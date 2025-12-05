use tauri::State;
use crate::AppState;
use std::path::PathBuf;
use std::fs;
use std::time::SystemTime;
use chrono::{DateTime, Utc};
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize)]
pub struct TribeFile {
    pub name: String,
    pub size: u64,
    pub last_modified: String,
}

#[tauri::command]
pub async fn get_tribe_files(state: State<'_, AppState>, server_id: i64) -> Result<Vec<TribeFile>, String> {
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

    // 2. Construct path to SavedArks
    // Note: This path might vary slightly between ASE/ASA or maps, but usually it's here:
    let saves_path = PathBuf::from(&install_path).join("ShooterGame/Saved/SavedArks");
    
    if !saves_path.exists() {
        return Ok(vec![]);
    }

    // 3. List files
    let mut files = Vec::new();
    let entries = fs::read_dir(saves_path).map_err(|e| e.to_string())?;

    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        
        if path.extension().and_then(|s| s.to_str()) == Some("arktribe") {
            let metadata = entry.metadata().map_err(|e| e.to_string())?;
            let modified: DateTime<Utc> = metadata.modified().unwrap_or(SystemTime::now()).into();
            
            files.push(TribeFile {
                name: entry.file_name().to_string_lossy().to_string(),
                size: metadata.len(),
                last_modified: modified.format("%Y-%m-%d %H:%M:%S").to_string(),
            });
        }
    }

    // Sort by Date Descending
    files.sort_by(|a, b| b.last_modified.cmp(&a.last_modified));

    Ok(files)
}

#[tauri::command]
pub async fn delete_tribe(state: State<'_, AppState>, server_id: i64, file_name: String) -> Result<(), String> {
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

    // 2. Validate filename to prevent directory traversal
    if file_name.contains("..") || !file_name.ends_with(".arktribe") {
        return Err("Invalid filename".to_string());
    }

    let file_path = PathBuf::from(&install_path)
        .join("ShooterGame/Saved/SavedArks")
        .join(&file_name);

    if !file_path.exists() {
        return Err("File not found".to_string());
    }

    fs::remove_file(file_path).map_err(|e| e.to_string())?;

    Ok(())
}
