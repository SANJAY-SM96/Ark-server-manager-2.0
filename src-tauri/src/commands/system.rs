use crate::models::SystemInfo;
use sysinfo::Disks;
use tauri::State;
use crate::AppState;

#[tauri::command]
pub async fn get_system_info(state: State<'_, AppState>) -> Result<SystemInfo, String> {
    let mut sys = state.sys.lock().map_err(|_| "Failed to lock system info".to_string())?;
    sys.refresh_all();
    
    let disks = Disks::new_with_refreshed_list();
    let mut total_disk = 0u64;
    let mut available_disk = 0u64;
    
    for disk in disks.list() {
        total_disk += disk.total_space();
        available_disk += disk.available_space();
    }
    
    let used_disk = total_disk.saturating_sub(available_disk);
    
    Ok(SystemInfo {
        cpu_usage: sys.global_cpu_usage(),
        ram_usage: (sys.used_memory() as f64) / (1024.0 * 1024.0 * 1024.0), // Convert to GB
        ram_total: (sys.total_memory() as f64) / (1024.0 * 1024.0 * 1024.0), // Convert to GB
        disk_usage: (used_disk as f64) / (1024.0 * 1024.0 * 1024.0), // Convert to GB
        disk_total: (total_disk as f64) / (1024.0 * 1024.0 * 1024.0), // Convert to GB
    })
}

#[tauri::command]
pub async fn select_folder(app: tauri::AppHandle, title: String) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;
    
    let file_path = app.dialog()
        .file()
        .set_title(title)
        .blocking_pick_folder();

    Ok(file_path.map(|p| p.to_string()))
}

#[tauri::command]
pub async fn get_setting(state: State<'_, AppState>, key: String) -> Result<Option<String>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.get_setting(&key).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn set_setting(state: State<'_, AppState>, key: String, value: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.set_setting(&key, &value).map_err(|e| e.to_string())
}
