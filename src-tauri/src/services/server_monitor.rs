use tauri::{AppHandle, Manager, Emitter};
use std::time::Duration;
use tokio::time::{sleep, timeout};
use crate::AppState;
use std::collections::HashMap;
use std::path::PathBuf;
use crate::services::rcon_client::RconClient;

pub struct ServerMonitorService;

impl ServerMonitorService {
    pub fn init(app_handle: AppHandle) {
        // 1. PID Reconciliation on Start
        if let Some(state) = app_handle.try_state::<AppState>() {
            let running_servers: Result<Vec<(i64, u32)>, _> = {
                let db = state.db.lock().map_err(|e| e.to_string());
                if let Ok(db_guard) = db {
                    if let Ok(conn) = db_guard.get_connection() {
                         let mut stmt = conn.prepare("SELECT id, pid FROM servers WHERE status = 'running'").unwrap();
                         let rows = stmt.query_map([], |row| {
                             let pid_i64: Option<i64> = row.get(1)?;
                             Ok((row.get(0)?, pid_i64.map(|p| p as u32).unwrap_or(0)))
                         }).unwrap();
                         rows.collect()
                    } else { Ok(vec![]) }
                } else { Ok(vec![]) }
            };

            if let Ok(servers) = running_servers {
                use sysinfo::{System, Pid};
                let mut sys = System::new_all();
                sys.refresh_all(); // Refresh processes

                for (id, pid) in servers {
                    let mut should_stop = false;
                    if pid == 0 {
                        should_stop = true;
                    } else {
                        let s_pid = Pid::from(pid as usize);
                        if sys.process(s_pid).is_none() {
                            println!("Reconciliation: Server {} (PID {}) is dead. Marking stopped.", id, pid);
                            should_stop = true;
                        } else {
                            println!("Reconciliation: Server {} (PID {}) is alive.", id, pid);
                        }
                    }

                    if should_stop {
                        let db = state.db.lock().unwrap();
                        let conn_res = db.get_connection();
                        if let Ok(conn) = conn_res {
                            let _ = conn.execute("UPDATE servers SET status = 'stopped' WHERE id = ?1", [id]);
                        }
                    }
                }
            }
        }

        tauri::async_runtime::spawn(async move {
            let mut failure_counts: HashMap<i64, u32> = HashMap::new();
            let mut tick_iters = 0;

            loop {
                sleep(Duration::from_secs(5)).await;
                tick_iters += 1;

                if let Some(state) = app_handle.try_state::<AppState>() {
                    // 1. Check Dead Processes (Crash Detection)
                    let dead_processes = state.process_manager.check_dead_processes(); // ... existing logic ...

                    if !dead_processes.is_empty() {
                        let mut notifications = Vec::new();

                        { // Scope for DB Lock
                            let db_lock = state.db.lock();
                            if let Ok(db) = db_lock {
                                if let Ok(conn) = db.get_connection() {
                                    for (server_id, exit_code) in dead_processes {
                                        let mut status = if exit_code == Some(0) { "stopped" } else { "crashed" };
                                        
                                        // Check for Auto Restart if crashed
                                        let mut auto_restart = false;
                                        if status == "crashed" {
                                            if let Ok(enabled) = conn.query_row(
                                                "SELECT auto_restart FROM servers WHERE id = ?1",
                                                [server_id],
                                                |row| row.get::<_, Option<bool>>(0),
                                            ) {
                                                auto_restart = enabled.unwrap_or(false);
                                            }
                                        }

                                        if auto_restart {
                                            println!("Server {} crashed. Auto-restarting...", server_id);
                                            // Fetch details
                                            let details: Result<(String, String, String, String, u16, u16, u16, i32, Option<String>, String, bool, Option<String>, bool), _> = conn.query_row(
                                                "SELECT server_type, install_path, map_name, session_name, game_port, query_port, rcon_port,
                                                 max_players, server_password, admin_password, battleye_enabled, multihome_ip, crossplay_enabled 
                                                 FROM servers WHERE id = ?1",
                                                [server_id],
                                                |row| Ok((
                                                    row.get::<_, String>(0)?,
                                                    row.get::<_, String>(1)?,
                                                    row.get::<_, String>(2)?,
                                                    row.get::<_, String>(3)?,
                                                    row.get::<_, u16>(4)?,
                                                    row.get::<_, u16>(5)?,
                                                    row.get::<_, u16>(6)?,
                                                    row.get::<_, i32>(7)?,
                                                    row.get::<_, Option<String>>(8)?,
                                                    row.get::<_, String>(9)?,
                                                    row.get::<_, bool>(10).unwrap_or(false),
                                                    row.get::<_, Option<String>>(11)?,
                                                    row.get::<_, bool>(12).unwrap_or(false),
                                                ))
                                            );

                                            if let Ok((server_type, install_path, map_name, session_name, game_port, query_port, rcon_port, max_players, server_password, admin_password, use_battleye, multihome_ip, crossplay_enabled)) = details {
                                                match state.process_manager.start_server(
                                                    server_id,
                                                    &server_type,
                                                    &PathBuf::from(install_path),
                                                    &map_name,
                                                    &session_name,
                                                    game_port,
                                                    query_port,
                                                    rcon_port,
                                                    max_players,
                                                    server_password.as_deref(),
                                                    &admin_password,
                                                    use_battleye,
                                                    multihome_ip,
                                                    crossplay_enabled,
                                                ) {
                                                    Ok(_) => {
                                                        status = "running";
                                                        println!("Auto-restart successful.");
                                                        notifications.push((
                                                            "Server Restarted".to_string(),
                                                            format!("Server {} crashed and was auto-restarted.", session_name)
                                                        ));
                                                    }
                                                    Err(e) => {
                                                        eprintln!("Failed to auto-restart server: {}", e);
                                                    }
                                                }
                                            }
                                        }

                                        // Update DB Status
                                        let _ = conn.execute(
                                            "UPDATE servers SET status = ?1 WHERE id = ?2",
                                            (status, server_id),
                                        );

                                        // Emit event
                                        let _ = app_handle.emit("server-status-changed",  serde_json::json!({
                                            "id": server_id,
                                            "status": status,
                                            "exit_code": exit_code
                                        }));
                                        
                                        if status == "crashed" {
                                            println!("Detected server {} exit (code {:?}). Updated status to {}", server_id, exit_code, status);
                                            notifications.push((
                                                "Server Crashed".to_string(),
                                                format!("Server {} has crashed!", server_id)
                                            ));
                                        }
                                    }
                                }
                            }
                        } // Lock dropped

                        // Send Notifications
                        for (title, msg) in notifications {
                             let _ = crate::services::notifications::NotificationService::send_notification(&state, &title, &msg).await;
                        }
                    }

                    // 2. Watchdog / Freeze Detection (Every 60s)
                    if tick_iters % 12 == 0 {
                        let mut restart_list = Vec::new();

                        let running_servers_op: Option<Vec<(i64, u16, String, bool)>> = {
                            let db_lock = state.db.lock();
                            if let Ok(db) = db_lock {
                                if let Ok(conn) = db.get_connection() {
                                    if let Ok(mut stmt) = conn.prepare("SELECT id, rcon_port, admin_password, auto_restart FROM servers WHERE status = 'running'") {
                                        stmt.query_map([], |row| {
                                            Ok((
                                                row.get(0)?,
                                                row.get::<_, u16>(1)?,
                                                row.get::<_, String>(2)?,
                                                row.get::<_, Option<bool>>(3)?.unwrap_or(false),
                                            ))
                                        }).ok().map(|rows| rows.filter_map(Result::ok).collect())
                                    } else { None }
                                } else { None }
                            } else { None }
                        };

                        if let Some(servers) = running_servers_op {
                             for (id, port, pass, auto_restart) in servers {
                                // ... loop logic ...
                                                if !auto_restart {
                                                    continue; 
                                                }

                                                // Perform Check
                                                let is_healthy = match timeout(Duration::from_secs(10), RconClient::execute("127.0.0.1", port, &pass, "ListPlayers")).await {
                                                    Ok(Ok(_)) => true,
                                                    _ => false,
                                                };

                                                if is_healthy {
                                                    failure_counts.remove(&id);
                                                } else {
                                                    let count = failure_counts.entry(id).or_insert(0);
                                                    *count += 1;
                                                    println!("Server {} failed health check. Count: {}", id, count);

                                                    if *count >= 3 && auto_restart {
                                                        restart_list.push(id);
                                                        failure_counts.remove(&id);
                                                    }
                                                }
                             }
                        }

                        // Handle Restarts
                        for id in restart_list {
                             println!("Watchdog: Server {} frozen. Restarting...", id);
                             // To restart, we need to Stop then Start.
                             // We can reuse the logic.
                             // Call restart_server logic? 
                             // Using process_manager.stop_server(id) then the Monitor Loop will pick up the 'Dead Process' next tick!
                             // BUT it might not be 'Dead' immediately if kill takes time?
                             // process_manager.stop_server sends Kill.
                             // And sets exit code?
                             let _ = state.process_manager.stop_server(id);
                             
                             // The NEXT loop iteration (5s later) will see it as DEAD.
                             // And trigger the "Crash Auto-Recovery" logic which restarts it!
                             // Perfect synergy.
                             
                             let _ = crate::services::notifications::NotificationService::send_notification(
                                &state, 
                                "Watchdog Triggered", 
                                &format!("Server {} was frozen and is being restarted.", id)
                             ).await;
                        }
                    }
                }
            }
        });
    }
}

