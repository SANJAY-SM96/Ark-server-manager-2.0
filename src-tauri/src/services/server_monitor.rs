use tauri::{AppHandle, Manager, Emitter};
use std::time::Duration;
use tokio::time::sleep;
use crate::AppState;

pub struct ServerMonitorService;

impl ServerMonitorService {
    pub fn init(app_handle: AppHandle) {
        tauri::async_runtime::spawn(async move {
            loop {
                sleep(Duration::from_secs(5)).await;

                if let Some(state) = app_handle.try_state::<AppState>() {
                    let dead_processes = state.process_manager.check_dead_processes();

                    if !dead_processes.is_empty() {
                        let db_lock = state.db.lock();
                        if let Ok(db) = db_lock {
                            if let Ok(conn) = db.get_connection() {
                                for (server_id, exit_code) in dead_processes {
                                    let status = if exit_code == Some(0) { "stopped" } else { "crashed" };
                                    
                                    // Update DB
                                    let _ = conn.execute(
                                        "UPDATE servers SET status = ?1 WHERE id = ?2 AND status = 'running'",
                                        (status, server_id),
                                    );

                                    // Emit event
                                    let _ = app_handle.emit("server-status-changed",  serde_json::json!({
                                        "id": server_id,
                                        "status": status,
                                        "exit_code": exit_code
                                    }));
                                    
                                    println!("Detected server {} exit (code {:?}). Updated status to {}", server_id, exit_code, status);
                                }
                            }
                        }
                    }
                }
            }
        });
    }
}
