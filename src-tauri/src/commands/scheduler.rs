use crate::models::Schedule;
use crate::AppState;
use tauri::State;

#[tauri::command]
pub async fn get_schedules(state: State<'_, AppState>, server_id: i64) -> Result<Vec<Schedule>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.get_connection().map_err(|e| e.to_string())?;
    
    let mut stmt = conn.prepare(
        "SELECT id, server_id, task_type, cron_expression, payload, enabled, last_run 
         FROM schedules WHERE server_id = ?1 ORDER BY created_at DESC"
    ).map_err(|e| e.to_string())?;
    
    let schedules = stmt.query_map([server_id], |row| {
        Ok(Schedule {
            id: row.get(0)?,
            server_id: row.get(1)?,
            task_type: row.get(2)?,
            cron_expression: row.get(3)?,
            payload: row.get(4)?,
            enabled: row.get(5)?,
            last_run: row.get(6)?,
        })
    }).map_err(|e| e.to_string())?;
    
    schedules.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_schedule(
    state: State<'_, AppState>, 
    server_id: i64, 
    task_type: String, 
    cron_expression: String,
    payload: Option<String>
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.get_connection().map_err(|e| e.to_string())?;
    
    conn.execute(
        "INSERT INTO schedules (server_id, task_type, cron_expression, payload) VALUES (?1, ?2, ?3, ?4)",
        (server_id, task_type, cron_expression, payload),
    ).map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
pub async fn delete_schedule(state: State<'_, AppState>, id: i64) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.get_connection().map_err(|e| e.to_string())?;
    
    conn.execute("DELETE FROM schedules WHERE id = ?1", [id])
        .map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
pub async fn toggle_schedule(state: State<'_, AppState>, id: i64, enabled: bool) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.get_connection().map_err(|e| e.to_string())?;
    
    conn.execute("UPDATE schedules SET enabled = ?1 WHERE id = ?2", (enabled, id))
        .map_err(|e| e.to_string())?;
    
    Ok(())
}
