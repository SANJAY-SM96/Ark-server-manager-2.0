use crate::AppState;
use tauri::State;
use local_ip_address::list_afinet_netifas;

#[tauri::command]
pub async fn get_local_ips() -> Result<Vec<String>, String> {
    let interfaces = list_afinet_netifas().map_err(|e| e.to_string())?;
    
    // Filter for IPv4 mostly, maybe return generic
    let ips: Vec<String> = interfaces
        .iter()
        .map(|(_, ip)| ip.to_string())
        .collect();
        
    Ok(ips)
}

#[tauri::command]
pub async fn set_network_settings(
    state: State<'_, AppState>,
    server_id: i64,
    multihome_ip: Option<String>
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.get_connection().map_err(|e| e.to_string())?;
    
    conn.execute(
        "UPDATE servers SET multihome_ip = ?1 WHERE id = ?2",
        (multihome_ip, server_id),
    ).map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
pub async fn set_crossplay_enabled(
    state: State<'_, AppState>,
    server_id: i64,
    enabled: bool
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.get_connection().map_err(|e| e.to_string())?;
    
    conn.execute(
        "UPDATE servers SET crossplay_enabled = ?1 WHERE id = ?2",
        (enabled, server_id),
    ).map_err(|e| e.to_string())?;
    
    Ok(())
}
