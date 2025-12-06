use crate::models::{ModInfo, ServerType};
use tauri::State;
use crate::AppState;
use crate::services::mod_scraper;
use std::path::{Path, PathBuf};
use std::fs;
use crate::services::mod_compatibility::{ModCompatibilityService, ModConflict};

// Helper to find GameUserSettings.ini path
fn get_config_path(install_path: &Path) -> PathBuf {
    install_path.join("ShooterGame/Saved/Config/WindowsServer/GameUserSettings.ini")
}

#[tauri::command]
pub async fn search_mods(state: State<'_, AppState>, query: String, server_type: String) -> Result<Vec<ModInfo>, String> {
    println!("🔍 search_mods called: query='{}', type='{}'", query, server_type);
    
    match server_type.as_str() {
        "ASE" => {
            mod_scraper::search_steam_workshop(&query).await.map_err(|e| e.to_string())
        },
        "ASA" => {
            let api_key = crate::services::api_key_manager::ApiKeyManager::get_curseforge_key(&state);
            mod_scraper::search_curseforge(&query, api_key).await.map_err(|e| e.to_string())
        },
        _ => Err("Invalid server type".to_string())
    }
}

#[tauri::command]
pub async fn install_mod(state: State<'_, AppState>, server_id: i64, mod_id: String) -> Result<(), String> {
    // 1. Get install path
    let (install_path, server_type_str) = {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        let conn = db.get_connection().map_err(|e| e.to_string())?;
        conn.query_row(
            "SELECT install_path, server_type FROM servers WHERE id = ?1",
            [server_id],
            |row| Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?)),
        ).map_err(|e| e.to_string())?
    };

    let config_path = get_config_path(&PathBuf::from(install_path));
    
    // Ensure config exists
    if !config_path.exists() {
        return Err("GameUserSettings.ini not found. Is the server installed?".to_string());
    }

    // 2. Read Config
    let content = fs::read_to_string(&config_path).map_err(|e| e.to_string())?;
    
    // 3. Update ActiveMods
    let mut new_lines = Vec::new();
    let mut in_server_settings = false;
    let mut active_mods_found = false;
    
    for line in content.lines() {
        if line.trim().eq_ignore_ascii_case("[ServerSettings]") {
            in_server_settings = true;
            new_lines.push(line.to_string());
            continue;
        }
        
        if line.trim().starts_with("[") && line.trim().ends_with("]") {
            in_server_settings = false;
        }

        if in_server_settings && line.trim().starts_with("ActiveMods=") {
            active_mods_found = true;
            let current_val = line.trim().strip_prefix("ActiveMods=").unwrap_or("");
            let mut mods: Vec<&str> = current_val.split(',').filter(|s| !s.is_empty()).collect();
            
            if !mods.contains(&mod_id.as_str()) {
                mods.push(&mod_id);
            }
            
            new_lines.push(format!("ActiveMods={}", mods.join(",")));
        } else {
            new_lines.push(line.to_string());
        }
    }

    // If section exists but key missing
    if !active_mods_found {
         if content.contains("[ServerSettings]") {
             new_lines = Vec::new(); // restart
             for line in content.lines() {
                new_lines.push(line.to_string());
                if line.trim().eq_ignore_ascii_case("[ServerSettings]") {
                    new_lines.push(format!("ActiveMods={}", mod_id));
                    active_mods_found = true;
                }
             }
         } else {
             // Append section
             new_lines.push("\n[ServerSettings]".to_string());
             new_lines.push(format!("ActiveMods={}", mod_id));
         }
    }

    fs::write(config_path, new_lines.join("\n")).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn update_active_mods(state: State<'_, AppState>, server_id: i64, mod_ids: Vec<String>) -> Result<(), String> {
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

    let config_path = get_config_path(&PathBuf::from(install_path));
    if !config_path.exists() {
         return Err("GameUserSettings.ini not found".to_string());
    }

    let content = fs::read_to_string(&config_path).map_err(|e| e.to_string())?;
    
    // Replace ActiveMods line
    let mut new_lines = Vec::new();
    let mut in_server_settings = false;
    let mut active_mods_found = false;
    let new_active_mods_line = format!("ActiveMods={}", mod_ids.join(","));

    for line in content.lines() {
        if line.trim().eq_ignore_ascii_case("[ServerSettings]") {
            in_server_settings = true;
            new_lines.push(line.to_string());
            continue;
        }
         if line.trim().starts_with("[") && line.trim().ends_with("]") {
            in_server_settings = false;
        }

        if in_server_settings && line.trim().starts_with("ActiveMods=") {
            active_mods_found = true;
            new_lines.push(new_active_mods_line.clone());
        } else {
            new_lines.push(line.to_string());
        }
    }

     if !active_mods_found {
         if content.contains("[ServerSettings]") {
             new_lines = Vec::new(); // restart
             for line in content.lines() {
                new_lines.push(line.to_string());
                if line.trim().eq_ignore_ascii_case("[ServerSettings]") {
                    new_lines.push(new_active_mods_line.clone());
                }
             }
         } else {
              new_lines.push("\n[ServerSettings]".to_string());
              new_lines.push(new_active_mods_line);
         }
    }

    fs::write(config_path, new_lines.join("\n")).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn get_installed_mods(state: State<'_, AppState>, server_id: i64) -> Result<Vec<ModInfo>, String> {
    // 1. Get install path & type
    let (install_path, server_type_str) = {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        let conn = db.get_connection().map_err(|e| e.to_string())?;
        conn.query_row(
            "SELECT install_path, server_type FROM servers WHERE id = ?1",
            [server_id],
            |row| Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?)),
        ).map_err(|e| e.to_string())?
    };

    let config_path = get_config_path(&PathBuf::from(&install_path));
    if !config_path.exists() {
        return Ok(vec![]);
    }

    let content = fs::read_to_string(&config_path).map_err(|e| e.to_string())?;
    let mut mod_ids = Vec::new();
    let mut in_server_settings = false;

    for line in content.lines() {
        if line.trim().eq_ignore_ascii_case("[ServerSettings]") {
            in_server_settings = true;
            continue;
        }
        if line.trim().starts_with("[") {
            in_server_settings = false;
        }
        if in_server_settings && line.trim().starts_with("ActiveMods=") {
            let val = line.trim().strip_prefix("ActiveMods=").unwrap_or("");
            mod_ids = val.split(',').filter(|s| !s.is_empty()).map(String::from).collect();
            break; 
        }
    }

    // Verify physical existence
    let mods_dir = PathBuf::from(&install_path).join("ShooterGame/Content/Mods");
    let mut present_mods = Vec::new();

    for mod_id in mod_ids {
        if mods_dir.join(&mod_id).exists() {
            present_mods.push(mod_id);
        }
    }

    if present_mods.is_empty() {
        return Ok(vec![]);
    }

    // 2. Fetch Details
    match server_type_str.as_str() {
        "ASE" => {
            mod_scraper::get_steam_mod_details(present_mods).await.map_err(|e| e.to_string())
        },
        "ASA" => {
            let api_key = crate::services::api_key_manager::ApiKeyManager::get_curseforge_key(&state);
             mod_scraper::get_curseforge_mod_details(present_mods, api_key).await.map_err(|e| e.to_string())
        },
        _ => Ok(vec![])
    }
}

#[tauri::command]
pub async fn uninstall_mod(state: State<'_, AppState>, server_id: i64, mod_id: String) -> Result<(), String> {
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
 
     // 2. Remove files 
     let mods_dir = PathBuf::from(&install_path).join("ShooterGame/Content/Mods");
     let mod_path = mods_dir.join(&mod_id);
     let mod_file = mods_dir.join(format!("{}.mod", mod_id));
 
     if mod_path.exists() {
         let _ = fs::remove_dir_all(&mod_path);
     }
     if mod_file.exists() {
         let _ = fs::remove_file(&mod_file);
     }
 
     // 3. Update active mods in INI (Reuse update logic or call it)
     // To avoid code duplication, we can call update_active_mods logic.
     // But wait, update_active_mods takes a LIST of mods to SET.
     // We need to READ the current list, filter out the one we are removing, and then save.
     
     let config_path = get_config_path(&PathBuf::from(install_path));
     if !config_path.exists() {
        // If config doesn't exist, we are done (files removed)
          return Ok(());
     }
     
     let content = fs::read_to_string(&config_path).map_err(|e| e.to_string())?;
     let mut new_lines = Vec::new();
     let mut in_server_settings = false;
     let mut active_mods_found = false;
 
     for line in content.lines() {
        if line.trim().eq_ignore_ascii_case("[ServerSettings]") {
             in_server_settings = true;
             new_lines.push(line.to_string());
             continue;
         }
         if line.trim().starts_with("[") && line.trim().ends_with("]") {
             in_server_settings = false;
         }
 
         if in_server_settings && line.trim().starts_with("ActiveMods=") {
             active_mods_found = true;
             let val = line.trim().strip_prefix("ActiveMods=").unwrap_or("");
             let current_mods: Vec<&str> = val.split(',').filter(|s| !s.is_empty() && *s != mod_id).collect();
             new_lines.push(format!("ActiveMods={}", current_mods.join(",")));
         } else {
             new_lines.push(line.to_string());
         }
     }
     
     // If we didn't find the ActiveMods line, we don't need to add it because we are removing.
 
     fs::write(config_path, new_lines.join("\n")).map_err(|e| e.to_string())?;
     
     Ok(())
 }

#[tauri::command]
pub async fn install_mods_batch(app_handle: tauri::AppHandle, state: State<'_, AppState>, server_id: i64, mod_ids: Vec<String>) -> Result<(), String> {
    // 1. Get install path
    let (install_path, server_type) = {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        let conn = db.get_connection().map_err(|e| e.to_string())?;
        conn.query_row(
            "SELECT install_path, server_type FROM servers WHERE id = ?1",
            [server_id],
            |row| Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?)),
        ).map_err(|e| e.to_string())?
    };

    // 2. Download mods if ASE (Steam)
    if server_type == "ASE" {
        use crate::services::steamcmd::SteamCmdService;
        let service = SteamCmdService::new(app_handle.clone());
        let path = PathBuf::from(&install_path);
        let mods_clone = mod_ids.clone();
        
        tauri::async_runtime::spawn_blocking(move || {
            service.download_mods(&server_type, &path, mods_clone)
        }).await.map_err(|e| e.to_string())?.map_err(|e| e.to_string())?;
    }

    let config_path = get_config_path(&PathBuf::from(install_path));
    if !config_path.exists() {
         return Err("GameUserSettings.ini not found".to_string());
    }

    let content = fs::read_to_string(&config_path).map_err(|e| e.to_string())?;
    
    // 2. Parse current ActiveMods
    let mut current_mods = Vec::new();
    let mut in_server_settings = false;

    for line in content.lines() {
        if line.trim().eq_ignore_ascii_case("[ServerSettings]") {
            in_server_settings = true;
            continue;
        }
        if line.trim().starts_with("[") {
            in_server_settings = false;
        }
        if in_server_settings && line.trim().starts_with("ActiveMods=") {
            let val = line.trim().strip_prefix("ActiveMods=").unwrap_or("");
            current_mods = val.split(',').filter(|s| !s.is_empty()).map(String::from).collect();
            break; 
        }
    }

    // 3. Merge new mods
    let mut modified = false;
    for mod_id in mod_ids {
        if !current_mods.contains(&mod_id) {
            current_mods.push(mod_id);
            modified = true;
        }
    }

    if !modified {
        return Ok(());
    }

    // 4. Write back
    let mut new_lines = Vec::new();
    let mut in_server_settings_write = false;
    let mut active_mods_found = false;
    let new_active_mods_line = format!("ActiveMods={}", current_mods.join(","));

    for line in content.lines() {
        if line.trim().eq_ignore_ascii_case("[ServerSettings]") {
            in_server_settings_write = true;
            new_lines.push(line.to_string());
            continue;
        }
        if line.trim().starts_with("[") && line.trim().ends_with("]") {
            in_server_settings_write = false;
        }

        if in_server_settings_write && line.trim().starts_with("ActiveMods=") {
            active_mods_found = true;
            new_lines.push(new_active_mods_line.clone());
        } else {
            new_lines.push(line.to_string());
        }
    }

    if !active_mods_found {
         if content.contains("[ServerSettings]") {
             new_lines = Vec::new(); 
             for line in content.lines() {
                new_lines.push(line.to_string());
                if line.trim().eq_ignore_ascii_case("[ServerSettings]") {
                    new_lines.push(new_active_mods_line.clone());
                }
             }
         } else {
              new_lines.push("\n[ServerSettings]".to_string());
              new_lines.push(new_active_mods_line);
         }
    }

    fs::write(config_path, new_lines.join("\n")).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn check_mod_conflicts(state: State<'_, AppState>, server_id: i64) -> Result<Vec<ModConflict>, String> {
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

    let config_path = get_config_path(&PathBuf::from(install_path));
    if !config_path.exists() {
         return Ok(vec![]);
    }

    let content = fs::read_to_string(&config_path).map_err(|e| e.to_string())?;
    
    // 2. Parse ActiveMods
    let mut mod_ids = Vec::new();
    let mut in_server_settings = false;

    for line in content.lines() {
        if line.trim().eq_ignore_ascii_case("[ServerSettings]") {
            in_server_settings = true;
            continue;
        }
        if line.trim().starts_with("[") {
            in_server_settings = false;
        }
        if in_server_settings && line.trim().starts_with("ActiveMods=") {
            let val = line.trim().strip_prefix("ActiveMods=").unwrap_or("");
            mod_ids = val.split(',').filter(|s| !s.is_empty()).map(String::from).collect();
            break; 
        }
    }

    Ok(ModCompatibilityService::check_conflicts(&mod_ids))
}
