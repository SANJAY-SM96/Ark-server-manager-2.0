use tauri::State;
use crate::AppState;
use std::time::Duration;
use tokio::time::sleep;
use crate::services::rcon_client::RconClient;
use crate::services::steamcmd::SteamCmdService;
use std::path::PathBuf;

pub struct ServerUpdateService;

impl ServerUpdateService {
    pub async fn update_server_graceful(
        app_handle: tauri::AppHandle,
        state: State<'_, AppState>,
        server_id: i64,
    ) -> Result<(), String> {
        // 1. Get server details
        let (server_type, install_path, rcon_port, admin_password, session_name) = {
            let db = state.db.lock().map_err(|e| e.to_string())?;
            let conn = db.get_connection().map_err(|e| e.to_string())?;
            conn.query_row(
                "SELECT server_type, install_path, rcon_port, admin_password, session_name FROM servers WHERE id = ?1",
                [server_id],
                |row| Ok((
                    row.get::<_, String>(0)?,
                    row.get::<_, String>(1)?,
                    row.get::<_, u16>(2)?,
                    row.get::<_, String>(3)?,
                    row.get::<_, String>(4)?,
                )),
            ).map_err(|e| e.to_string())?
        };

        // 2. Notify Players (Graceful Shutdown)
        // using localhost for RCON
        let ip = "127.0.0.1";
        
        let _ = RconClient::execute(ip, rcon_port, &admin_password, "Broadcast Server updating in 15 minutes!").await;
        // sleep(Duration::from_secs(300)).await; // 5 min passed (Total 10m left) - shortened for MVP?
        // Let's do a shorter sequence for MVP demo or real usage? 
        // Real usage: 15m -> 10m -> 5m -> 1m.
        // For MVP, let's do 1 minute warning to avoid blocking too long, or spin off thread?
        // Blocking here is okay if running in async task.
        
        // Let's do a quick 3-step: Update Imminent! -> 30s -> Saving... -> Shutdown.
        let _ = RconClient::execute(ip, rcon_port, &admin_password, "Broadcast Server updating in 2 minutes!").await;
        sleep(Duration::from_secs(60)).await;
        
        let _ = RconClient::execute(ip, rcon_port, &admin_password, "Broadcast Server updating in 60 seconds! Please log off.").await;
        sleep(Duration::from_secs(50)).await;
        
        let _ = RconClient::execute(ip, rcon_port, &admin_password, "Broadcast Server shutting down for update NOW!").await;
        let _ = RconClient::execute(ip, rcon_port, &admin_password, "SaveWorld").await;
        sleep(Duration::from_secs(10)).await;

        // 3. Stop Server
        // We call the existing stop_server logic but we need to do it via AppState directly or command logic.
        // state.process_manager is accessible.
        state.process_manager.stop_server(server_id).map_err(|e| e.to_string())?;

        // Update DB status to Updating
         {
            let db = state.db.lock().map_err(|e| e.to_string())?;
            let conn = db.get_connection().map_err(|e| e.to_string())?;
            conn.execute("UPDATE servers SET status = 'updating' WHERE id = ?1", [server_id])
                .map_err(|e| e.to_string())?;
         }

        // 4. Perform Update
        let steamcmd = SteamCmdService::new(app_handle.clone());
        let path = PathBuf::from(&install_path);
        
        let path_clone = path.clone();
        let type_clone = server_type.clone();

        // This is blocking, so run in blocking thread if not already
        match tauri::async_runtime::spawn_blocking(move || {
            steamcmd.install_server(&type_clone, &path_clone)
        }).await.map_err(|e| e.to_string())? {
            Ok(_) => {
                // 5. Restart Server
                // We need to call start_server. We don't have all args here easily without querying again.
                // We can call `crate::commands::server::start_server` if we exposed it? 
                // Or reuse process_manager.restart_server logic.
                // But ProcessManager logic needs all args.
                // Let's query again.
                
                let (game_port, query_port, max_players, server_password, battleye, multihome, crossplay, map_name) = {
                     let db = state.db.lock().map_err(|e| e.to_string())?;
                     let conn = db.get_connection().map_err(|e| e.to_string())?;
                     conn.query_row(
                        "SELECT game_port, query_port, max_players, server_password, battleye_enabled, multihome_ip, crossplay_enabled, map_name FROM servers WHERE id = ?1",
                        [server_id],
                        |row| Ok((
                            row.get::<_, u16>(0)?, 
                            row.get::<_, u16>(1)?, 
                            row.get::<_, i32>(2)?, 
                            row.get::<_, Option<String>>(3)?, 
                            row.get::<_, bool>(4).unwrap_or(false), 
                            row.get::<_, Option<String>>(5)?, 
                            row.get::<_, bool>(6).unwrap_or(false), 
                            row.get::<_, String>(7)?
                        ))
                     ).map_err(|e| e.to_string())?
                };

                state.process_manager.start_server(
                    server_id,
                    &server_type,
                    &path,
                    &map_name,
                    &session_name,
                    game_port,
                    query_port,
                    rcon_port,
                    max_players,
                    server_password.as_deref(),
                    &admin_password,
                    battleye,
                    multihome,
                    crossplay
                ).map_err(|e| e.to_string())?;

                // Update status
                {
                    let db = state.db.lock().map_err(|e| e.to_string())?;
                    let conn = db.get_connection().map_err(|e| e.to_string())?;
                    conn.execute("UPDATE servers SET status = 'running' WHERE id = ?1", [server_id])
                        .map_err(|e| e.to_string())?;
                }
                
                let _ = crate::services::notifications::NotificationService::send_notification(
                    &state, 
                    "Update Complete", 
                    &format!("Server {} has been updated and restarted.", session_name)
                ).await;
            },
            Err(e) => {
                // Mark as crashed/stopped
                 {
                    let db = state.db.lock().map_err(|e| e.to_string())?;
                    let conn = db.get_connection().map_err(|e| e.to_string())?;
                    conn.execute("UPDATE servers SET status = 'crashed' WHERE id = ?1", [server_id])
                        .map_err(|e| e.to_string())?;
                 }
                 return Err(format!("Update failed: {}", e));
            }
        }

        Ok(())
    }
}
