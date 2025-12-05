use crate::AppState;
use tauri::State;
use std::fs;
use std::path::PathBuf;

#[tauri::command]
pub async fn update_server_map(state: State<'_, AppState>, server_id: i64, map_name: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.get_connection().map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE servers SET map_name = ?1 WHERE id = ?2",
        [&map_name, &server_id.to_string()],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn wipe_server_save(state: State<'_, AppState>, server_id: i64) -> Result<(), String> {
    // 1. Get install path
    let install_path: String = {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        let conn = db.get_connection().map_err(|e| e.to_string())?;
        conn.query_row(
            "SELECT install_path FROM servers WHERE id = ?1",
            [server_id],
            |row| row.get(0),
        ).map_err(|e| e.to_string())?
    };

    let save_dir = PathBuf::from(install_path).join("ShooterGame/Saved/SavedArks");
    
    if save_dir.exists() {
        // Option A: Delete the whole directory
        fs::remove_dir_all(&save_dir).map_err(|e| e.to_string())?;
        // Recreate it empty
        fs::create_dir_all(&save_dir).map_err(|e| e.to_string())?;
    }

    Ok(())
}
