use crate::AppState;
use tauri::{AppHandle, State};
use crate::services::app_updater::{AppUpdateService, AppUpdateInfo};

#[tauri::command]
pub async fn check_app_update(state: State<'_, AppState>) -> Result<Option<AppUpdateInfo>, String> {
    AppUpdateService::check_for_updates(&state).await
}

#[tauri::command]
pub async fn install_app_update(app_handle: AppHandle, download_url: String) -> Result<(), String> {
    AppUpdateService::install_update(app_handle, download_url).await
}

#[tauri::command]
pub async fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

#[tauri::command]
pub async fn set_github_repo(state: State<'_, AppState>, repo: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.set_setting("github_repo", &repo).map_err(|e| e.to_string())?;
    Ok(())
}
