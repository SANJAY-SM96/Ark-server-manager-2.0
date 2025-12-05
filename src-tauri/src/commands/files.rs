use crate::services::file_manager::{FileManager, FileInfo};
use std::path::PathBuf;

#[tauri::command]
pub async fn list_files(path: String) -> Result<Vec<FileInfo>, String> {
    FileManager::list_directory(&PathBuf::from(path)).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn read_file_content(path: String) -> Result<String, String> {
    FileManager::read_file(&PathBuf::from(path)).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn save_file_content(path: String, content: String) -> Result<(), String> {
    FileManager::write_file(&PathBuf::from(path), &content).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_file_path(path: String) -> Result<(), String> {
    FileManager::delete_path(&PathBuf::from(path)).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn zip_directory(source: String, destination: String) -> Result<(), String> {
    // Run in blocking thread as zip can be heavy
    tokio::task::spawn_blocking(move || {
        FileManager::create_zip(&PathBuf::from(source), &PathBuf::from(destination))
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn unzip_file(zip_path: String, destination: String) -> Result<(), String> {
     tokio::task::spawn_blocking(move || {
        FileManager::extract_zip(&PathBuf::from(zip_path), &PathBuf::from(destination))
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e| e.to_string())
}
