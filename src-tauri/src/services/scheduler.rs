use crate::commands::{server, backup, rcon};
use crate::AppState;
use tauri::Manager;
use std::time::Duration;
use cron::Schedule as CronSchedule;
use std::str::FromStr;
use chrono::Local;

pub struct SchedulerService {
    app_handle: tauri::AppHandle,
}

impl SchedulerService {
    pub fn new(app_handle: tauri::AppHandle) -> Self {
        SchedulerService { app_handle }
    }

    pub fn start(&self) {
        let app_handle = self.app_handle.clone();
        
        tauri::async_runtime::spawn(async move {
            println!("Scheduler Service started.");
            loop {
                // Sleep for 60 seconds (check every minute)
                // We align to the minute boundary roughly
                tokio::time::sleep(Duration::from_secs(60)).await;
                
                if let Err(e) = Self::check_and_run_tasks(&app_handle).await {
                     eprintln!("Scheduler Error: {}", e);
                }
            }
        });
    }

    async fn check_and_run_tasks(app_handle: &tauri::AppHandle) -> Result<(), String> {
        let state = app_handle.state::<AppState>();
        
        // 1. Fetch active schedules
        let schedules = {
            let db = state.db.lock().map_err(|e| e.to_string())?;
            let conn = db.get_connection().map_err(|e| e.to_string())?;
            let mut stmt = conn.prepare(
                "SELECT id, server_id, task_type, cron_expression, payload FROM schedules WHERE enabled = 1"
            ).map_err(|e| e.to_string())?;
            
            let rows = stmt.query_map([], |row| {
                Ok((
                    row.get::<_, i64>(0)?,
                    row.get::<_, i64>(1)?,
                    row.get::<_, String>(2)?,
                    row.get::<_, String>(3)?,
                    row.get::<_, Option<String>>(4)?,
                ))
            }).map_err(|e| e.to_string())?;
            
            rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())?
        };

        let now = Local::now();

        // 2. Iterate and check cron
        for (id, server_id, task_type, cron_expr, payload) in schedules {
            if let Ok(schedule) = CronSchedule::from_str(&cron_expr) {
                // Check if the previous minute matches the schedule (since we just slept)
                // We rely on `upcoming` from 1 minute ago.
                if let Some(next_run) = schedule.after(&(now - chrono::Duration::minutes(1))).next() {
                    let diff = (next_run - now).num_seconds().abs();
                    if diff < 60 {
                        // It's due now (or very close)
                        
                        println!("Executing scheduled task: {} for server {}", task_type, server_id);
                        
                        match task_type.as_str() {
                            "restart" => {
                                let _ = server::restart_server(state.clone(), server_id).await;
                            },
                            "backup" => {
                                let _ = backup::create_backup(state.clone(), server_id, "auto".to_string()).await;
                            },
                            "update" => {
                                let _ = server::update_server(app_handle.clone(), state.clone(), server_id).await;
                            },
                            "broadcast" => {
                                if let Some(msg) = &payload {
                                    let _ = rcon::send_rcon_command(state.clone(), server_id, format!("Broadcast {}", msg)).await;
                                }
                            },
                            _ => {}
                        }

                        // Update last_run
                        let db = state.db.lock().map_err(|e| e.to_string())?;
                        let conn = db.get_connection().map_err(|e| e.to_string())?;
                        let _ = conn.execute("UPDATE schedules SET last_run = CURRENT_TIMESTAMP WHERE id = ?1", [id]);
                    }
                }
            }
        }

        Ok(())
    }
}
