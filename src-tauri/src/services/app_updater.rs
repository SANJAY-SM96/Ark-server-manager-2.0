use tauri::{AppHandle, Manager, State};
use crate::AppState;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::fs;
use reqwest::header::USER_AGENT;

#[derive(Debug, Serialize, Deserialize)]
pub struct AppUpdateInfo {
    pub version: String,
    pub download_url: String,
    pub release_notes: String,
}

#[derive(Deserialize)]
struct GitHubRelease {
    tag_name: String,
    body: String,
    assets: Vec<GitHubAsset>,
}

#[derive(Deserialize)]
struct GitHubAsset {
    name: String,
    browser_download_url: String,
}

pub struct AppUpdateService;

impl AppUpdateService {
    pub async fn check_for_updates(state: &State<'_, AppState>) -> Result<Option<AppUpdateInfo>, String> {
        // 1. Get Repo Settings
        let repo_opt = {
             let db = state.db.lock().map_err(|e| e.to_string())?;
             db.get_setting("github_repo").map_err(|e| e.to_string())?
        };

        let repo = match repo_opt {
            Some(r) if !r.trim().is_empty() => r,
            _ => "SANJAY-SM96/Ark-server-manager-2.0".to_string(), // Default repo
        };

        // 2. Fetch Latest Release
        let client = reqwest::Client::new();
        let url = format!("https://api.github.com/repos/{}/releases/latest", repo);
        
        let resp = client.get(&url)
            .header(USER_AGENT, "ArkServerManager")
            .send()
            .await
            .map_err(|e| format!("Failed to check updates: {}", e))?;

        if !resp.status().is_success() {
            return Err(format!("GitHub API Error: {}", resp.status()));
        }

        let release: GitHubRelease = resp.json().await.map_err(|e| format!("Failed to parse release info: {}", e))?;

        // 3. Compare Versions using SemVer
        let current_version_str = env!("CARGO_PKG_VERSION");
        let remote_version_str = release.tag_name.trim_start_matches('v');

        let current_version = semver::Version::parse(current_version_str)
            .map_err(|e| format!("Failed to parse current version {}: {}", current_version_str, e))?;
        let remote_version = semver::Version::parse(remote_version_str)
            .map_err(|e| format!("Failed to parse remote version {}: {}", remote_version_str, e))?;

        if remote_version <= current_version {
            return Ok(None); // Remote is same or older
        }

        // Find .exe asset
        let asset = release.assets.iter()
            .find(|a| a.name.ends_with(".exe") || a.name.ends_with(".msi"))
            .ok_or("No executable asset found in release.".to_string())?;

        Ok(Some(AppUpdateInfo {
            version: remote_version_str.to_string(),
            download_url: asset.browser_download_url.clone(),
            release_notes: release.body,
        }))
    }

    pub async fn install_update(app_handle: AppHandle, download_url: String) -> Result<(), String> {
        // 1. Download File
        let temp_dir = app_handle.path().temp_dir().map_err(|e| e.to_string())?;
        let file_name = download_url.split('/').last().unwrap_or("update.exe");
        let dest_path = temp_dir.join(file_name);

        let response = reqwest::get(&download_url).await.map_err(|e| format!("Failed to download update: {}", e))?;
        let content = response.bytes().await.map_err(|e| format!("Failed to read update body: {}", e))?;
        
        fs::write(&dest_path, content).map_err(|e| format!("Failed to save update file: {}", e))?;

        // 2. Run Installer with Elevation (RunAs)
        // We use PowerShell to trigger the UAC prompt since direct Command::new fails with error 740
        let installer_path = dest_path.to_string_lossy();
        let _ = std::process::Command::new("powershell")
            .args(&[
                "Start-Process",
                "-FilePath", &format!("'{}'", installer_path),
                "-ArgumentList", "'/SILENT'",
                "-Verb", "RunAs"
            ])
            .spawn()
            .map_err(|e| format!("Failed to launch installer: {}", e))?;

        // 3. Exit App
        app_handle.exit(0);
        
        Ok(())
    }
}
