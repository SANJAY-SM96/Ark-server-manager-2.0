use tauri::State;
use crate::AppState;
use std::fs;
use std::path::PathBuf;
use std::time::UNIX_EPOCH;

#[tauri::command]
pub async fn read_config(state: State<'_, AppState>, server_id: i64, config_type: String) -> Result<String, String> {
    // Get server install path from DB
    let install_path: String = {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        let conn = db.get_connection().map_err(|e| e.to_string())?;
        conn.query_row(
            "SELECT install_path FROM servers WHERE id = ?1",
            [server_id],
            |row| row.get(0),
        ).map_err(|e| e.to_string())?
    };

    let path = PathBuf::from(install_path)
        .join("ShooterGame/Saved/Config/WindowsServer")
        .join(format!("{}.ini", config_type));

    if path.exists() {
        fs::read_to_string(path).map_err(|e| e.to_string())
    } else {
        // Return default/empty config if file doesn't exist
        Ok(String::new())
    }
}

#[tauri::command]
pub async fn save_config(state: State<'_, AppState>, server_id: i64, config_type: String, content: String) -> Result<(), String> {
    // Get server install path from DB
    let install_path: String = {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        let conn = db.get_connection().map_err(|e| e.to_string())?;
        conn.query_row(
            "SELECT install_path FROM servers WHERE id = ?1",
            [server_id],
            |row| row.get(0),
        ).map_err(|e| e.to_string())?
    };

    let dir_path = PathBuf::from(install_path)
        .join("ShooterGame/Saved/Config/WindowsServer");
        
    fs::create_dir_all(&dir_path).map_err(|e| e.to_string())?;
    
    let file_path = dir_path.join(format!("{}.ini", config_type));
    
    fs::write(file_path, content).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_config_modified_time(state: State<'_, AppState>, server_id: i64, config_type: String) -> Result<u64, String> {
    // Get server install path from DB
    let install_path: String = {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        let conn = db.get_connection().map_err(|e| e.to_string())?;
        conn.query_row(
            "SELECT install_path FROM servers WHERE id = ?1",
            [server_id],
            |row| row.get(0),
        ).map_err(|e| e.to_string())?
    };

    let path = PathBuf::from(install_path)
        .join("ShooterGame/Saved/Config/WindowsServer")
        .join(format!("{}.ini", config_type));

    if path.exists() {
        let metadata = fs::metadata(&path).map_err(|e| e.to_string())?;
        let modified = metadata.modified().map_err(|e| e.to_string())?;
        let duration = modified.duration_since(UNIX_EPOCH).map_err(|e| e.to_string())?;
        Ok(duration.as_secs())
    } else {
        Ok(0)
    }
}
