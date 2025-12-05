use crate::models::{Server, ServerType, ServerStatus, ServerPorts, ServerConfig};
use crate::AppState;
use tauri::{AppHandle, State, Manager};
use std::path::PathBuf;
use crate::services::steamcmd::SteamCmdService;
use crate::services::notifications::NotificationService;

#[tauri::command]
pub async fn get_all_servers(state: State<'_, AppState>) -> Result<Vec<Server>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.get_connection().map_err(|e| e.to_string())?;
    
    let mut stmt = conn.prepare(
        "SELECT id, name, server_type, install_path, status, game_port, query_port, rcon_port, 
         max_players, server_password, admin_password, map_name, session_name, motd, 
         created_at, last_started, battleye_enabled, multihome_ip, crossplay_enabled FROM servers ORDER BY id"
    ).map_err(|e| e.to_string())?;
    
    let servers = stmt.query_map([], |row| {
        Ok(Server {
            id: row.get(0)?,
            name: row.get(1)?,
            server_type: row.get::<_, String>(2)?.parse().unwrap_or(ServerType::ASE),
            install_path: PathBuf::from(row.get::<_, String>(3)?),
            status: match row.get::<_, String>(4)?.as_str() {
                "stopped" => ServerStatus::Stopped,
                "starting" => ServerStatus::Starting,
                "running" => ServerStatus::Running,
                "crashed" => ServerStatus::Crashed,
                "updating" => ServerStatus::Updating,
                _ => ServerStatus::Stopped,
            },
            ports: ServerPorts {
                game_port: row.get(5)?,
                query_port: row.get(6)?,
                rcon_port: row.get(7)?,
            },
            config: ServerConfig {
                max_players: row.get(8)?,
                server_password: row.get(9)?,
                admin_password: row.get(10)?,
                map_name: row.get(11)?,
                session_name: row.get(12)?,
                motd: row.get(13)?,
                battleye_enabled: row.get::<_, bool>(16).unwrap_or(false),
                multihome_ip: row.get(17).unwrap_or(None),
                crossplay_enabled: row.get::<_, bool>(18).unwrap_or(false),
            },
            created_at: row.get(14)?,
            last_started: row.get(15)?,
        })
    }).map_err(|e| e.to_string())?;
    
    servers.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_server_by_id(_state: State<'_, AppState>, _server_id: i64) -> Result<Option<Server>, String> {
    // Similar to get_all_servers but with WHERE clause
    // TODO: Implement
    Ok(None)
}

#[tauri::command]
pub async fn install_server(
    app: AppHandle,
    state: State<'_, AppState>,
    server_type: String,
    install_path: String,
    name: String,
    map_name: String,
    game_port: u16,
    query_port: u16,
    rcon_port: u16,
) -> Result<Server, String> {
    // 1. Create DB Entry
    
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.get_connection().map_err(|e| e.to_string())?;
    
    conn.execute(
        "INSERT INTO servers (name, server_type, install_path, status, game_port, query_port, rcon_port, 
         max_players, admin_password, map_name, session_name) 
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
        (
            &name,
            &server_type,
            &install_path,
            "installing", // Set status to installing
            game_port,
            query_port,
            rcon_port,
            70,
            "admin123", 
            &map_name,
            &name,
        ),
    ).map_err(|e| e.to_string())?;
    
    let id = conn.last_insert_rowid();

    // 2. Spawn Background Installation
    let app_handle = app.clone();
    let service = SteamCmdService::new(app_handle.clone());
    let server_type_clone = server_type.clone();
    let install_path_clone = PathBuf::from(&install_path);
    // Determine database path or how to access DB in thread. 
    // AppState is Send/Sync so we can clone the Arc for DB?
    // Actually AppState holds Arc<Mutex<Database>>, so we can clone state if we had it as Arc, but here it is tauri::State.
    // simpler: Get a fresh DB connection in the thread if possible, or just accept we might not update status on failure perfectly without more boilerplate.
    // BETTER: Use the AppHandle to get the state again inside the thread!
    
    tauri::async_runtime::spawn_blocking(move || {
        // We can access state from app_handle if needed, but for now just run the install
        match service.install_server(&server_type_clone, &install_path_clone) {
            Ok(_) => {
                // Update status to stopped (ready)
                 if let Some(state) = app_handle.try_state::<AppState>() {
                    if let Ok(db) = state.db.lock() {
                        if let Ok(conn) = db.get_connection() {
                            let _ = conn.execute("UPDATE servers SET status = ?1 WHERE id = ?2", ("stopped", id));
                        }
                    }
                 }
            }
            Err(e) => {
                println!("Installation failed: {}", e);
                 if let Some(state) = app_handle.try_state::<AppState>() {
                    if let Ok(db) = state.db.lock() {
                        if let Ok(conn) = db.get_connection() {
                            let _ = conn.execute("UPDATE servers SET status = ?1 WHERE id = ?2", ("crashed", id)); // Or 'error'
                        }
                    }
                 }
            }
        }
    });
    
    Ok(Server {
        id,
        name: name.clone(),
        server_type: server_type.parse().unwrap_or(ServerType::ASE),
        install_path: PathBuf::from(install_path),
        status: ServerStatus::Installing, // Return as Installing
        ports: ServerPorts { game_port, query_port, rcon_port },
        config: ServerConfig {
            max_players: 70,
            server_password: None,
            admin_password: "admin123".to_string(),
            map_name: map_name.clone(),
            session_name: name,
            motd: None,
            battleye_enabled: false,
            multihome_ip: None,
            crossplay_enabled: false,
        },
        created_at: chrono::Utc::now().to_rfc3339(),
        last_started: None,
    })
}

#[tauri::command]
pub async fn start_server(state: State<'_, AppState>, server_id: i64) -> Result<(), String> {
    // Get server details from database
    let (server_type, install_path, map_name, session_name, game_port, query_port, rcon_port,
         max_players, server_password, admin_password, use_battleye, multihome_ip, crossplay_enabled) = {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        let conn = db.get_connection().map_err(|e| e.to_string())?;
        
        let mut stmt = conn.prepare(
            "SELECT server_type, install_path, map_name, session_name, game_port, query_port, rcon_port,
             max_players, server_password, admin_password, battleye_enabled, multihome_ip, crossplay_enabled FROM servers WHERE id = ?1"
        ).map_err(|e| e.to_string())?;
        
        stmt.query_row([server_id], |row| {
            Ok((
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
        }).map_err(|e| e.to_string())?
    };

    state.process_manager.start_server(
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
    ).map_err(|e| e.to_string())?;

    // Update status in database
    {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        let conn = db.get_connection().map_err(|e| e.to_string())?;
        conn.execute("UPDATE servers SET status = ?1 WHERE id = ?2", ("running", server_id))
            .map_err(|e| e.to_string())?;
    }
    
    let _ = NotificationService::send_notification(&state, "Server Started", &format!("Server {} ({}) has been started.", session_name, server_type)).await;

    Ok(())
}

#[tauri::command]
pub async fn stop_server(state: State<'_, AppState>, server_id: i64) -> Result<(), String> {
    state.process_manager.stop_server(server_id).map_err(|e| e.to_string())?;
    
    // Update status in database
    {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        let conn = db.get_connection().map_err(|e| e.to_string())?;
        conn.execute("UPDATE servers SET status = ?1 WHERE id = ?2", ("stopped", server_id))
            .map_err(|e| e.to_string())?;
    }
    
    let _ = NotificationService::send_notification(&state, "Server Stopped", &format!("Server {} has been stopped.", server_id)).await;

    Ok(())
}

#[tauri::command]
pub async fn restart_server(state: State<'_, AppState>, server_id: i64) -> Result<(), String> {
    // Get server details from database
    let (server_type, install_path, map_name, session_name, game_port, query_port, rcon_port,
         max_players, server_password, admin_password, use_battleye, multihome_ip, crossplay_enabled) = {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        let conn = db.get_connection().map_err(|e| e.to_string())?;
        
        let mut stmt = conn.prepare(
            "SELECT server_type, install_path, map_name, session_name, game_port, query_port, rcon_port,
             max_players, server_password, admin_password, battleye_enabled, multihome_ip, crossplay_enabled FROM servers WHERE id = ?1"
        ).map_err(|e| e.to_string())?;
        
        stmt.query_row([server_id], |row| {
            Ok((
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
        }).map_err(|e| e.to_string())?
    }; // db and conn dropped here
    
    state.process_manager.restart_server(
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
    ).map_err(|e| e.to_string())?;
    
    let _ = NotificationService::send_notification(&state, "Server Restarted", &format!("Server {} has been restarted.", server_id)).await;

    Ok(())
}

#[tauri::command]
pub async fn delete_server(state: State<'_, AppState>, server_id: i64) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.get_connection().map_err(|e| e.to_string())?;
    
    conn.execute("DELETE FROM servers WHERE id = ?1", [server_id])
        .map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
pub async fn update_server(app_handle: AppHandle, state: State<'_, AppState>, server_id: i64) -> Result<(), String> {
    // 1. Get server details
    let (server_type, install_path, current_status) = {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        let conn = db.get_connection().map_err(|e| e.to_string())?;
        let mut stmt = conn.prepare("SELECT server_type, install_path, status FROM servers WHERE id = ?1").map_err(|e| e.to_string())?;
        
        stmt.query_row([server_id], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
            ))
        }).map_err(|e| e.to_string())?
    };

    // 2. Stop server if running
    if current_status == "running" || current_status == "starting" {
        state.process_manager.stop_server(server_id).map_err(|e| e.to_string())?;
        // Update status in DB
        {
            let db = state.db.lock().map_err(|e| e.to_string())?;
            let conn = db.get_connection().map_err(|e| e.to_string())?;
            conn.execute("UPDATE servers SET status = ?1 WHERE id = ?2", ("stopped", server_id))
                .map_err(|e| e.to_string())?;
        }
    }

    // 3. Set status to updating
    {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        let conn = db.get_connection().map_err(|e| e.to_string())?;
        conn.execute("UPDATE servers SET status = ?1 WHERE id = ?2", ("updating", server_id))
            .map_err(|e| e.to_string())?;
    }

    // 4. Run SteamCMD Update (This is blocking for now, ideally should be detached or async transparent)
    // Since we are in an async command, we can perform the blocking operation? 
    // Tauri commands run on a separate thread pool, so it shouldn't block the UI *event loop*, 
    // but the frontend promise will wait.
    let service = SteamCmdService::new(app_handle.clone());
    let path = PathBuf::from(&install_path);
    
    // We use spawn_blocking for the heavy lifting if needed, but the service method just spawns a process and waits.
    // That wait is blocking the thread.
    let result = tauri::async_runtime::spawn_blocking(move || {
        service.install_server(&server_type, &path)
    }).await.map_err(|e| e.to_string())?;

    // 5. Handle Result
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.get_connection().map_err(|e| e.to_string())?;
    
    match result {
        Ok(_) => {
            conn.execute("UPDATE servers SET status = ?1 WHERE id = ?2", ("stopped", server_id))
                .map_err(|e| e.to_string())?;
            Ok(())
        }
        Err(e) => {
            conn.execute("UPDATE servers SET status = ?1 WHERE id = ?2", ("stopped", server_id)) // Or error status
                .map_err(|e| e.to_string())?;
            Err(e.to_string())
        }
    }
}

#[tauri::command]
pub async fn get_server_version(app_handle: AppHandle, state: State<'_, AppState>, server_id: i64) -> Result<String, String> {
     let (server_type, install_path) = {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        let conn = db.get_connection().map_err(|e| e.to_string())?;
        let mut stmt = conn.prepare("SELECT server_type, install_path FROM servers WHERE id = ?1").map_err(|e| e.to_string())?;
        
        stmt.query_row([server_id], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
            ))
        }).map_err(|e| e.to_string())?
    };

    let service = SteamCmdService::new(app_handle);
    let path = PathBuf::from(install_path);
    
    service.get_build_id(&server_type, &path).map_err(|e| e.to_string())
}
