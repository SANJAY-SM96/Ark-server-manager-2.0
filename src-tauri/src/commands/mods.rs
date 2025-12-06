// ============================================================================
// SIMPLIFIED MOD MANAGER - FILE-BASED ONLY (NO DATABASE)
// ============================================================================
// 
// This module provides simple mod management:
// - Read mods from disk (ShooterGame/Content/Mods folder)
// - Read/Write ActiveMods in GameUserSettings.ini
// - No database storage for mods
//
// ============================================================================

use crate::models::ModInfo;
use tauri::State;
use crate::AppState;
use std::path::PathBuf;
use std::fs;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/// Get the path to GameUserSettings.ini
fn get_ini_path(install_path: &str) -> PathBuf {
    PathBuf::from(install_path).join("ShooterGame/Saved/Config/WindowsServer/GameUserSettings.ini")
}

/// Get the path to the Mods folder
fn get_mods_folder(install_path: &str) -> PathBuf {
    PathBuf::from(install_path).join("ShooterGame/Content/Mods")
}

/// Read ActiveMods from INI file
fn read_active_mods(install_path: &str) -> Vec<String> {
    let ini_path = get_ini_path(install_path);
    
    if !ini_path.exists() {
        println!("  ⚠️ INI file not found: {:?}", ini_path);
        return vec![];
    }

    let content = match fs::read_to_string(&ini_path) {
        Ok(c) => c,
        Err(e) => {
            println!("  ❌ Failed to read INI: {}", e);
            return vec![];
        }
    };

    // Parse [ServerSettings] section for ActiveMods=
    let mut in_server_settings = false;
    for line in content.lines() {
        let trimmed = line.trim();
        
        if trimmed.eq_ignore_ascii_case("[ServerSettings]") {
            in_server_settings = true;
            continue;
        }
        
        if trimmed.starts_with("[") && trimmed.ends_with("]") {
            in_server_settings = false;
        }
        
        if in_server_settings && trimmed.starts_with("ActiveMods=") {
            let value = trimmed.strip_prefix("ActiveMods=").unwrap_or("");
            return value.split(',')
                .filter(|s| !s.is_empty())
                .map(String::from)
                .collect();
        }
    }

    vec![]
}

/// Write ActiveMods to INI file
fn write_active_mods(install_path: &str, mod_ids: &[String]) -> Result<(), String> {
    let ini_path = get_ini_path(install_path);
    
    if !ini_path.exists() {
        return Err("INI file not found".to_string());
    }

    let content = fs::read_to_string(&ini_path).map_err(|e| e.to_string())?;
    let new_active_mods = format!("ActiveMods={}", mod_ids.join(","));
    
    let mut new_lines: Vec<String> = Vec::new();
    let mut in_server_settings = false;
    let mut found_active_mods = false;

    for line in content.lines() {
        let trimmed = line.trim();
        
        if trimmed.eq_ignore_ascii_case("[ServerSettings]") {
            in_server_settings = true;
            new_lines.push(line.to_string());
            continue;
        }
        
        if trimmed.starts_with("[") && trimmed.ends_with("]") {
            // Leaving ServerSettings - if we haven't found ActiveMods, add it
            if in_server_settings && !found_active_mods {
                new_lines.push(new_active_mods.clone());
                found_active_mods = true;
            }
            in_server_settings = false;
        }
        
        if in_server_settings && trimmed.starts_with("ActiveMods=") {
            new_lines.push(new_active_mods.clone());
            found_active_mods = true;
        } else {
            new_lines.push(line.to_string());
        }
    }

    // If no [ServerSettings] section exists, append it
    if !found_active_mods {
        new_lines.push("\n[ServerSettings]".to_string());
        new_lines.push(new_active_mods);
    }

    fs::write(&ini_path, new_lines.join("\n")).map_err(|e| e.to_string())?;
    Ok(())
}

// ============================================================================
// TAURI COMMANDS
// ============================================================================

/// Get server install path from database (only DB access we need)
fn get_server_path(state: &State<'_, AppState>, server_id: i64) -> Result<String, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.get_connection().map_err(|e| e.to_string())?;
    
    conn.query_row(
        "SELECT install_path FROM servers WHERE id = ?1",
        [server_id],
        |row| row.get(0),
    ).map_err(|e| format!("Server not found: {}", e))
}

/// LIST: Get all mods installed on a server (verified against file system)
#[tauri::command]
pub async fn get_installed_mods(state: State<'_, AppState>, server_id: i64) -> Result<Vec<ModInfo>, String> {
    println!("\n📦 GET INSTALLED MODS (server_id: {})", server_id);
    
    // 1. Get server install path
    let install_path = get_server_path(&state, server_id)?;
    println!("  📁 Install path: {}", install_path);
    
    // 2. Check if server folder exists
    if !PathBuf::from(&install_path).exists() {
        println!("  ⚠️ Server folder does not exist!");
        return Ok(vec![]);
    }
    
    // 3. Read ActiveMods from INI
    let active_mods = read_active_mods(&install_path);
    println!("  📋 ActiveMods in INI: {:?}", active_mods);
    
    if active_mods.is_empty() {
        println!("  → No mods in ActiveMods list");
        return Ok(vec![]);
    }
    
    // 4. Verify each mod exists on disk
    let mods_folder = get_mods_folder(&install_path);
    println!("  📁 Mods folder: {:?} (exists: {})", mods_folder, mods_folder.exists());
    
    let mut verified_mods: Vec<ModInfo> = Vec::new();
    
    for (index, mod_id) in active_mods.iter().enumerate() {
        let mod_folder = mods_folder.join(mod_id);
        let mod_file = mods_folder.join(format!("{}.mod", mod_id));
        
        let exists = mod_folder.exists() || mod_file.exists();
        println!("    → Mod {}: {}", mod_id, if exists { "✅ EXISTS" } else { "❌ MISSING" });
        
        if exists {
            // Create basic ModInfo with all required fields
            verified_mods.push(ModInfo {
                id: mod_id.clone(),
                name: format!("Mod {}", mod_id),
                version: None,
                author: None,
                description: None,
                thumbnail_url: None,
                downloads: None,
                compatible: Some(true),
                workshop_url: Some(format!("https://steamcommunity.com/sharedfiles/filedetails/?id={}", mod_id)),
                server_type: crate::models::ServerType::ASE,
                enabled: true,
                load_order: index as i32,
            });
        }
    }
    
    println!("  ✅ Verified {} mods", verified_mods.len());
    Ok(verified_mods)
}

/// DELETE: Remove a mod from server
#[tauri::command]
pub async fn uninstall_mod(state: State<'_, AppState>, server_id: i64, mod_id: String) -> Result<(), String> {
    println!("\n🗑️ UNINSTALL MOD (server_id: {}, mod_id: {})", server_id, mod_id);
    
    // 1. Get server install path
    let install_path = get_server_path(&state, server_id)?;
    println!("  📁 Install path: {}", install_path);
    
    // 2. Remove mod files
    let mods_folder = get_mods_folder(&install_path);
    let mod_folder = mods_folder.join(&mod_id);
    let mod_file = mods_folder.join(format!("{}.mod", mod_id));
    
    if mod_folder.exists() {
        println!("  → Deleting folder: {:?}", mod_folder);
        fs::remove_dir_all(&mod_folder).map_err(|e| format!("Failed to delete mod folder: {}", e))?;
        println!("  ✅ Folder deleted");
    }
    
    if mod_file.exists() {
        println!("  → Deleting file: {:?}", mod_file);
        fs::remove_file(&mod_file).map_err(|e| format!("Failed to delete .mod file: {}", e))?;
        println!("  ✅ File deleted");
    }
    
    // 3. Update INI - remove mod from ActiveMods
    let mut active_mods = read_active_mods(&install_path);
    active_mods.retain(|m| m != &mod_id);
    
    println!("  → Updating ActiveMods: {:?}", active_mods);
    write_active_mods(&install_path, &active_mods)?;
    
    println!("  ✅ UNINSTALL COMPLETE");
    Ok(())
}

/// UPDATE: Set the mod load order
#[tauri::command]
pub async fn update_active_mods(state: State<'_, AppState>, server_id: i64, mod_ids: Vec<String>) -> Result<(), String> {
    println!("\n📝 UPDATE ACTIVE MODS (server_id: {})", server_id);
    println!("  → New order: {:?}", mod_ids);
    
    let install_path = get_server_path(&state, server_id)?;
    write_active_mods(&install_path, &mod_ids)?;
    
    println!("  ✅ UPDATED");
    Ok(())
}

/// SEARCH: Search for mods (Steam Workshop API)
#[tauri::command]
pub async fn search_mods(_state: State<'_, AppState>, query: String, server_type: String) -> Result<Vec<ModInfo>, String> {
    println!("\n🔍 SEARCH MODS (query: '{}', type: {})", query, server_type);
    
    // For simplicity, return empty - mods are added via Steam Workshop subscription
    // The user should subscribe to mods on Steam and they'll appear in the mods folder
    println!("  → Mod search disabled - subscribe via Steam Workshop directly");
    
    Ok(vec![])
}

// ============================================================================
// UNUSED COMMANDS (kept for compatibility)
// ============================================================================

#[tauri::command]
pub async fn install_mod(_state: State<'_, AppState>, _server_id: i64, _mod_id: String) -> Result<(), String> {
    Ok(()) // No-op
}

#[tauri::command]
pub async fn install_mods_batch(_app_handle: tauri::AppHandle, _state: State<'_, AppState>, _server_id: i64, _mod_ids: Vec<String>) -> Result<(), String> {
    Ok(()) // No-op
}

#[tauri::command]
pub async fn check_mod_conflicts(_state: State<'_, AppState>, _server_id: i64) -> Result<Vec<String>, String> {
    Ok(vec![]) // No-op
}

#[tauri::command]
pub async fn get_mod_compatibility(_state: State<'_, AppState>, _mod_id: String) -> Result<serde_json::Value, String> {
    Ok(serde_json::json!({})) // No-op
}
