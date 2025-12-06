use crate::models::{Backup, BackupType};
use crate::AppState;
use tauri::State;
use std::fs;
use std::path::{Path, PathBuf};
use chrono::Local;
use walkdir::WalkDir;
use serde::Serialize;

#[derive(Serialize)]
pub struct BackupFileInfo {
    name: String,
    path: String,
    size: u64,
    is_dir: bool,
}

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

fn calculate_dir_size(path: &Path) -> u64 {
    WalkDir::new(path)
        .min_depth(1)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter_map(|e| e.metadata().ok())
        .filter(|m| m.is_file())
        .map(|m| m.len())
        .sum()
}

#[tauri::command]
pub async fn create_backup(state: State<'_, AppState>, server_id: i64, backup_type: String, note: Option<String>) -> Result<Backup, String> {
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
        // Ensure table has note column (simple migration attempt)
        let _ = conn.execute("ALTER TABLE backups ADD COLUMN note TEXT", []);

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
    fs::create_dir_all(&destination).map_err(|e| e.to_string())?;
    
    // 4. Perform Backup
    // Backup SavedArks (World Data)
    let saved_arks_src = save_path.join("SavedArks");
    let saved_arks_dst = destination.join("SavedArks");
    let includes_saves = if saved_arks_src.exists() {
         copy_dir_recursive(&saved_arks_src, &saved_arks_dst).map_err(|e| e.to_string())?;
         true
    } else {
        false
    };

    // Backup Config (Settings) -> ShooterGame/Saved/Config/WindowsServer
    let config_src = save_path.join("Config/WindowsServer");
    let config_dst = destination.join("Config");
    let includes_configs = if config_src.exists() {
        copy_dir_recursive(&config_src, &config_dst).map_err(|e| e.to_string())?;
        true
    } else {
        false
    };

    let size = calculate_dir_size(&destination);

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
            includes_cluster BOOLEAN,
            note TEXT
        )",
        [],
    ).map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO backups (server_id, backup_type, file_path, size, created_at, includes_configs, includes_mods, includes_saves, includes_cluster, note)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
        (
            server_id,
            match backup_type_enum {
                BackupType::Auto => "auto",
                BackupType::Manual => "manual",
                BackupType::PreUpdate => "pre-update",
            },
            destination.to_string_lossy().to_string(),
            size as i64,
            Local::now().to_rfc3339(),
            includes_configs,
            false,
            includes_saves,
            false,
            note
        ),
    ).map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();

    Ok(Backup {
        id,
        server_id,
        backup_type: backup_type_enum,
        file_path: destination,
        size: size as i64,
        includes_configs,
        includes_mods: false,
        includes_saves,
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
            includes_cluster BOOLEAN,
            note TEXT
        )",
        [],
    ).map_err(|e| e.to_string())?;

    // Attempt migration for existing tables without note
    let _ = conn.execute("ALTER TABLE backups ADD COLUMN note TEXT", []);

    let mut stmt = conn.prepare("SELECT id, server_id, backup_type, file_path, size, created_at, includes_configs, includes_mods, includes_saves, includes_cluster, note FROM backups WHERE server_id = ?1 ORDER BY created_at DESC").map_err(|e| e.to_string())?;
    
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
            // note: row.get(10)? // Assuming Backup struct has note field, if not strict, we can ignore or add it
        })
    }).map_err(|e| e.to_string())?;

    backups.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_backup(state: State<'_, AppState>, backup_id: i64, note: Option<String>) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.get_connection().map_err(|e| e.to_string())?;
    
    conn.execute(
        "UPDATE backups SET note = ?1 WHERE id = ?2",
        (note, backup_id),
    ).map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
pub async fn view_backup_content(_state: State<'_, AppState>, backup_path: String) -> Result<Vec<BackupFileInfo>, String> {
    let path = PathBuf::from(backup_path);
    if !path.exists() {
        return Err("Backup path not found".to_string());
    }

    let mut files = Vec::new();
    let walker = WalkDir::new(&path).into_iter();

    for entry in walker.filter_map(|e| e.ok()) {
        let metadata = entry.metadata().map_err(|e| e.to_string())?;
        
        // Skip the root dir itself
        if entry.path() == path { continue; }

        let relative_path = entry.path().strip_prefix(&path).unwrap_or(entry.path());
        
        files.push(BackupFileInfo {
            name: entry.file_name().to_string_lossy().to_string(),
            path: relative_path.to_string_lossy().to_string(),
            size: metadata.len(),
            is_dir: metadata.is_dir(),
        });
    }

    Ok(files)
}


#[tauri::command]
pub async fn restore_backup(state: State<'_, AppState>, backup_id: i64) -> Result<(), String> {
     let (file_path, server_id, includes_configs) = {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        let conn = db.get_connection().map_err(|e| e.to_string())?;
        
        let mut stmt = conn.prepare("SELECT file_path, server_id, includes_configs FROM backups WHERE id = ?1").map_err(|e| e.to_string())?;
        
        stmt.query_row(
            [backup_id],
            |row| Ok((row.get::<_, String>(0)?, row.get::<_, i64>(1)?, row.get::<_, bool>(2)?)),
        ).map_err(|e| e.to_string())?
    };

    // Get install path
    let install_path: String = {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        let conn = db.get_connection().map_err(|e| e.to_string())?;
        conn.query_row("SELECT install_path FROM servers WHERE id = ?1", [server_id], |row| row.get(0))
            .map_err(|e| e.to_string())?
    };

    let server_root = PathBuf::from(install_path);
    let backup_root = PathBuf::from(file_path);

    if !backup_root.exists() {
        return Err("Backup file/folder not found".to_string());
    }

    // Restore SavedArks
    let target_save_dir = server_root.join("ShooterGame/Saved/SavedArks");
    let backup_save_dir = backup_root.join("SavedArks");
    
    if backup_save_dir.exists() {
        if target_save_dir.exists() {
            fs::remove_dir_all(&target_save_dir).map_err(|e| e.to_string())?;
        }
        fs::create_dir_all(&target_save_dir).map_err(|e| e.to_string())?;
        copy_dir_recursive(&backup_save_dir, &target_save_dir).map_err(|e| e.to_string())?;
    }

    // Restore Configs if available
    if includes_configs {
         let target_config_dir = server_root.join("ShooterGame/Saved/Config/WindowsServer");
         let backup_config_dir = backup_root.join("Config");
         
         if backup_config_dir.exists() {
            // Be careful verifying if we want to wipe configs. Usually yes for a rollback.
            if target_config_dir.exists() {
                fs::remove_dir_all(&target_config_dir).map_err(|e| e.to_string())?;
            }
            fs::create_dir_all(&target_config_dir).map_err(|e| e.to_string())?;
            copy_dir_recursive(&backup_config_dir, &target_config_dir).map_err(|e| e.to_string())?;
         }
    }

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
