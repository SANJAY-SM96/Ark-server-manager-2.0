use crate::models::{Backup, BackupType};
use crate::AppState;
use tauri::State;
use std::fs;
use std::path::{Path, PathBuf};
use chrono::Local;

// Helper to copy directory recursively
fn copy_dir_recursive(src: &Path, dst: &Path) -> std::io::Result<()> {
    if !dst.exists() {
        fs::create_dir_all(dst)?;
    }
    for entry in fs::read_dir(src)? {
        let entry = entry?;
        let ty = entry.file_type()?;
        if ty.is_dir() {
            copy_dir_recursive(&entry.path(), &dst.join(entry.file_name()))?;
        } else {
            fs::copy(entry.path(), dst.join(entry.file_name()))?;
        }
    }
    Ok(())
}

#[tauri::command]
pub async fn create_backup(state: State<'_, AppState>, server_id: i64, backup_type: String) -> Result<Backup, String> {
    // 1. Validate backup type
    let backup_type_enum = match backup_type.as_str() {
        "auto" => BackupType::Auto,
        "manual" => BackupType::Manual,
        "pre-update" => BackupType::PreUpdate,
        _ => return Err("Invalid backup type".to_string()),
    };

    // 2. Get server details
    let (install_path, server_name) = {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        let conn = db.get_connection().map_err(|e| e.to_string())?;
        let mut stmt = conn.prepare("SELECT install_path, name FROM servers WHERE id = ?1").map_err(|e| e.to_string())?;
        
        stmt.query_row([server_id], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
        }).map_err(|e| e.to_string())?
    };

    let save_path = PathBuf::from(&install_path).join("ShooterGame/Saved");
    
    if !save_path.exists() {
        return Err("Save directory does not exist".to_string());
    }

    // 3. Define backup location
    // Using a "Backups" folder relative to server root for this implementation
    let backup_root = PathBuf::from(&install_path).parent().unwrap_or(Path::new("C:/ARKServers")).join("Backups");
    fs::create_dir_all(&backup_root).map_err(|e| e.to_string())?;

    let timestamp = Local::now().format("%Y-%m-%d_%H-%M-%S").to_string();
    let backup_folder_name = format!("{}_{}_{}", server_name.replace(" ", "_"), backup_type, timestamp);
    let destination = backup_root.join(&backup_folder_name);
    
    // 4. Perform Backup (Copy SavedArks)
    let source = save_path.join("SavedArks");
    if source.exists() {
         copy_dir_recursive(&source, &destination).map_err(|e| e.to_string())?;
    } else {
        return Err("No SavedArks folder found to backup".to_string());
    }

    // 5. Insert into DB
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.get_connection().map_err(|e| e.to_string())?;
    
    // Check if table exists (idempotent)
    conn.execute(
        "CREATE TABLE IF NOT EXISTS backups (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            server_id INTEGER,
            backup_type TEXT,
            file_path TEXT,
            size INTEGER,
            created_at TEXT,
            includes_configs BOOLEAN,
            includes_mods BOOLEAN,
            includes_saves BOOLEAN,
            includes_cluster BOOLEAN
        )",
        [],
    ).map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO backups (server_id, backup_type, file_path, size, created_at, includes_configs, includes_mods, includes_saves, includes_cluster)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        (
            server_id,
            match backup_type_enum {
                BackupType::Auto => "auto",
                BackupType::Manual => "manual",
                BackupType::PreUpdate => "pre-update",
            },
            destination.to_string_lossy().to_string(),
            0, // TODO: calc size
            Local::now().to_rfc3339(),
            false,
            false,
            true, // saves only
            false
        ),
    ).map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();

    Ok(Backup {
        id,
        server_id,
        backup_type: backup_type_enum,
        file_path: destination,
        size: 0,
        includes_configs: false,
        includes_mods: false,
        includes_saves: true,
        includes_cluster: false,
        created_at: Local::now().to_rfc3339(),
    })
}

#[tauri::command]
pub async fn get_backups(state: State<'_, AppState>, server_id: i64) -> Result<Vec<Backup>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.get_connection().map_err(|e| e.to_string())?;

    // Check if table exists
    conn.execute(
        "CREATE TABLE IF NOT EXISTS backups (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            server_id INTEGER,
            backup_type TEXT,
            file_path TEXT,
            size INTEGER,
            created_at TEXT,
            includes_configs BOOLEAN,
            includes_mods BOOLEAN,
            includes_saves BOOLEAN,
            includes_cluster BOOLEAN
        )",
        [],
    ).map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare("SELECT id, server_id, backup_type, file_path, size, created_at, includes_configs, includes_mods, includes_saves, includes_cluster FROM backups WHERE server_id = ?1 ORDER BY created_at DESC").map_err(|e| e.to_string())?;
    
    let backups = stmt.query_map([server_id], |row| {
        let type_str: String = row.get(2)?;
        let backup_type = match type_str.as_str() {
            "auto" => BackupType::Auto,
            "manual" => BackupType::Manual,
            "pre-update" => BackupType::PreUpdate,
            _ => BackupType::Manual,
        };

        Ok(Backup {
            id: row.get(0)?,
            server_id: row.get(1)?,
            backup_type,
            file_path: PathBuf::from(row.get::<_, String>(3)?),
            size: row.get(4)?,
            created_at: row.get(5)?,
            includes_configs: row.get(6)?,
            includes_mods: row.get(7)?,
            includes_saves: row.get(8)?,
            includes_cluster: row.get(9)?,
        })
    }).map_err(|e| e.to_string())?;

    backups.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn restore_backup(state: State<'_, AppState>, backup_id: i64) -> Result<(), String> {
     let (file_path, server_id) = {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        let conn = db.get_connection().map_err(|e| e.to_string())?;
        
        let mut stmt = conn.prepare("SELECT file_path, server_id FROM backups WHERE id = ?1").map_err(|e| e.to_string())?;
        
        stmt.query_row(
            [backup_id],
            |row| Ok((row.get::<_, String>(0)?, row.get::<_, i64>(1)?)),
        ).map_err(|e| e.to_string())?
    };

    // Get install path
    let install_path: String = {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        let conn = db.get_connection().map_err(|e| e.to_string())?;
        conn.query_row("SELECT install_path FROM servers WHERE id = ?1", [server_id], |row| row.get(0))
            .map_err(|e| e.to_string())?
    };

    let target_dir = PathBuf::from(install_path).join("ShooterGame/Saved/SavedArks");
    let source_dir = PathBuf::from(file_path);

    if !source_dir.exists() {
        return Err("Backup file/folder not found".to_string());
    }

    // Safety: Wipe current target
    if target_dir.exists() {
        fs::remove_dir_all(&target_dir).map_err(|e| e.to_string())?;
    }
    fs::create_dir_all(&target_dir).map_err(|e| e.to_string())?;

    // Copy back
    copy_dir_recursive(&source_dir, &target_dir).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn delete_backup(state: State<'_, AppState>, backup_id: i64) -> Result<(), String> {
     let db = state.db.lock().map_err(|e| e.to_string())?;
     let conn = db.get_connection().map_err(|e| e.to_string())?;
     
     let file_path: String = conn.query_row(
        "SELECT file_path FROM backups WHERE id = ?1",
        [backup_id],
        |row| row.get(0)
     ).map_err(|e| e.to_string())?;

     // Remove from FS
     let path = Path::new(&file_path);
     if path.exists() {
        fs::remove_dir_all(&path).unwrap_or_else(|e| println!("Failed to delete backup files: {}", e)); 
     }

     conn.execute("DELETE FROM backups WHERE id = ?1", [backup_id]).map_err(|e| e.to_string())?;

     Ok(())
}
