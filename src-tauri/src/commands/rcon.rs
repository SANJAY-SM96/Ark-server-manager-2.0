use tauri::State;
use crate::AppState;
use crate::services::rcon_client::RconClient;
use std::path::PathBuf;
use std::fs;
use std::io::BufRead;

// Helper to get RCON details from GameUserSettings.ini
// Assumption: RCON is enabled and port is usually GamePort + ? or explicitly set.
// For MVP, let's assume standard RCON port offset or read from config if possible.
// Actually, RCON port is often `RCONPort` in `[ServerSettings]` or launch arg. 
// AND ServerAdminPassword in `[ServerSettings]`.

fn get_rcon_details(install_path: &str) -> Option<(u16, String)> {
    let config_path = PathBuf::from(install_path).join("ShooterGame/Saved/Config/WindowsServer/GameUserSettings.ini");
    if !config_path.exists() {
        return None;
    }

    let file = fs::File::open(config_path).ok()?;
    let reader = std::io::BufReader::new(file);

    let mut inside_server_settings = false;
    let mut password = None;
    let mut port: Option<u16> = None;

    for line in reader.lines() {
        let line = line.ok()?;
        let trimmed = line.trim();
        if trimmed.starts_with('[') && trimmed.ends_with(']') {
            inside_server_settings = trimmed == "[ServerSettings]";
            continue;
        }

        if inside_server_settings {
            if let Some((key, val)) = trimmed.split_once('=') {
                let key = key.trim();
                let val = val.trim();
                match key {
                    "ServerAdminPassword" => password = Some(val.to_string()),
                    "RCONPort" => port = val.parse::<u16>().ok(),
                    _ => {}
                }
            }
        }
    }

    let port = port.unwrap_or(27020);
    // If password is not found, we can't RCON? Or maybe empty password?
    // Let's require it.
    let password = password?;

    Some((port, password))
}

#[tauri::command]
pub async fn send_rcon_command(state: State<'_, AppState>, server_id: i64, command: String) -> Result<String, String> {
    // 1. Get server details
    let (install_path, _game_port) = {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        let conn = db.get_connection().map_err(|e| e.to_string())?;
        conn.query_row(
            "SELECT install_path, port FROM servers WHERE id = ?1",
            [server_id],
            |row| Ok((row.get::<_, String>(0)?, row.get::<_, u16>(1)?)),
        ).map_err(|e| e.to_string())?
    };

    // 2. Get RCON credentials
    let (rcon_port, password) = get_rcon_details(&install_path)
        .ok_or_else(|| "Could not find RCON credentials (RCONPort/ServerAdminPassword) in GameUserSettings.ini".to_string())?;

    // 3. Execute
    // Note: Localhost for now since manager runs on same machine as server usually
    RconClient::execute("127.0.0.1", rcon_port, &password, &command).await
}

#[tauri::command]
pub async fn get_online_players(state: State<'_, AppState>, server_id: i64) -> Result<Vec<String>, String> {
   // 1. Get server details
    let install_path = {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        let conn = db.get_connection().map_err(|e| e.to_string())?;
        conn.query_row(
            "SELECT install_path FROM servers WHERE id = ?1",
            [server_id],
            |row| row.get::<_, String>(0),
        ).map_err(|e| e.to_string())?
    };

    // 2. Get RCON credentials
    let (rcon_port, password) = get_rcon_details(&install_path)
        .ok_or_else(|| "RCON not configured".to_string())?;

    // 3. Get Players
    RconClient::get_players("127.0.0.1", rcon_port, &password).await
}

#[tauri::command]
pub async fn destroy_wild_dinos(state: State<'_, AppState>, server_id: i64) -> Result<String, String> {
     // 1. Get server details
    let install_path = {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        let conn = db.get_connection().map_err(|e| e.to_string())?;
        conn.query_row(
            "SELECT install_path FROM servers WHERE id = ?1",
            [server_id],
            |row| row.get::<_, String>(0),
        ).map_err(|e| e.to_string())?
    };

    // 2. Get RCON credentials
    let (rcon_port, password) = get_rcon_details(&install_path)
        .ok_or_else(|| "RCON not configured".to_string())?;

    // 3. Execute Command
    RconClient::execute("127.0.0.1", rcon_port, &password, "DestroyWildDinos").await
}
