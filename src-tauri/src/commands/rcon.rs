use tauri::State;
use crate::AppState;
use crate::services::rcon_client::RconClient;

#[tauri::command]
pub async fn send_rcon_command(state: State<'_, AppState>, server_id: i64, command: String) -> Result<String, String> {
    // 1. Get RCON credentials from database
    let (rcon_port, admin_password) = {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        let conn = db.get_connection().map_err(|e| e.to_string())?;
        
        let mut stmt = conn.prepare("SELECT rcon_port, admin_password FROM servers WHERE id = ?1")
            .map_err(|e| e.to_string())?;
            
        stmt.query_row([server_id], |row| {
            Ok((
                row.get::<_, u16>(0)?,
                row.get::<_, String>(1)?
            ))
        }).map_err(|e| e.to_string())?
    };

    // 2. Execute
    // Note: Localhost for now since manager runs on same machine
    RconClient::execute("127.0.0.1", rcon_port, &admin_password, &command).await
}

#[tauri::command]
pub async fn get_online_players(state: State<'_, AppState>, server_id: i64) -> Result<Vec<String>, String> {
   // 1. Get RCON credentials from database
    let (rcon_port, admin_password) = {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        let conn = db.get_connection().map_err(|e| e.to_string())?;
        
        let mut stmt = conn.prepare("SELECT rcon_port, admin_password FROM servers WHERE id = ?1")
            .map_err(|e| e.to_string())?;
            
        stmt.query_row([server_id], |row| {
            Ok((
                row.get::<_, u16>(0)?,
                row.get::<_, String>(1)?
            ))
        }).map_err(|e| e.to_string())?
    };

    // 2. Get Players
    RconClient::get_players("127.0.0.1", rcon_port, &admin_password).await
}

#[tauri::command]
pub async fn destroy_wild_dinos(state: State<'_, AppState>, server_id: i64) -> Result<String, String> {
     // 1. Get RCON credentials from database
    let (rcon_port, admin_password) = {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        let conn = db.get_connection().map_err(|e| e.to_string())?;
        
        let mut stmt = conn.prepare("SELECT rcon_port, admin_password FROM servers WHERE id = ?1")
            .map_err(|e| e.to_string())?;
            
        stmt.query_row([server_id], |row| {
            Ok((
                row.get::<_, u16>(0)?,
                row.get::<_, String>(1)?
            ))
        }).map_err(|e| e.to_string())?
    };

    // 2. Execute Command
    RconClient::execute("127.0.0.1", rcon_port, &admin_password, "DestroyWildDinos").await
}
