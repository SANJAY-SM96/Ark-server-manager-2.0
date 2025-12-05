use crate::AppState;
use tauri::State;
use std::path::PathBuf;
use std::fs;
use std::io::Write;

#[tauri::command]
pub async fn set_battleye(state: State<'_, AppState>, server_id: i64, enabled: bool) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.get_connection().map_err(|e| e.to_string())?;
    
    conn.execute(
        "UPDATE servers SET battleye_enabled = ?1 WHERE id = ?2",
        (enabled, server_id),
    ).map_err(|e| e.to_string())?;
    
    Ok(())
}

fn get_whitelist_path(install_path: &PathBuf) -> PathBuf {
    // Both ASE and ASA use similar structure for binaries
    install_path.join("ShooterGame").join("Binaries").join("Win64").join("PlayersExclusiveJoinList.txt")
}

#[tauri::command]
pub async fn get_whitelist(state: State<'_, AppState>, server_id: i64) -> Result<Vec<String>, String> {
    let install_path = {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        let conn = db.get_connection().map_err(|e| e.to_string())?;
        conn.query_row(
            "SELECT install_path FROM servers WHERE id = ?1",
            [server_id],
            |row| row.get::<_, String>(0),
        ).map_err(|e| e.to_string())?
    };

    let path = get_whitelist_path(&PathBuf::from(install_path));
    
    if !path.exists() {
        return Ok(Vec::new());
    }

    let content = fs::read_to_string(path).map_err(|e| e.to_string())?;
    let ids: Vec<String> = content.lines()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .collect();
        
    Ok(ids)
}

#[tauri::command]
pub async fn add_to_whitelist(state: State<'_, AppState>, server_id: i64, steam_id: String) -> Result<(), String> {
    let install_path = {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        let conn = db.get_connection().map_err(|e| e.to_string())?;
        conn.query_row(
            "SELECT install_path FROM servers WHERE id = ?1",
            [server_id],
            |row| row.get::<_, String>(0),
        ).map_err(|e| e.to_string())?
    };

    let path = get_whitelist_path(&PathBuf::from(install_path));
    
    // Ensure parent directory exists
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }

    // Append to file
    let mut file = fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(&path)
        .map_err(|e| e.to_string())?;
        
    writeln!(file, "{}", steam_id).map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
pub async fn remove_from_whitelist(state: State<'_, AppState>, server_id: i64, steam_id: String) -> Result<(), String> {
    let install_path = {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        let conn = db.get_connection().map_err(|e| e.to_string())?;
        conn.query_row(
            "SELECT install_path FROM servers WHERE id = ?1",
            [server_id],
            |row| row.get::<_, String>(0),
        ).map_err(|e| e.to_string())?
    };

    let path = get_whitelist_path(&PathBuf::from(install_path));
    
    if !path.exists() {
        return Ok(())
    }

    let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    let new_lines: Vec<&str> = content.lines()
        .map(|s| s.trim())
        .filter(|s| !s.is_empty() && *s != steam_id)
        .collect();
        
    fs::write(path, new_lines.join("\n")).map_err(|e| e.to_string())?;
    
    Ok(())
}
