use std::path::PathBuf;
use std::io::Cursor;
use tauri::{AppHandle, Manager, Emitter};
use anyhow::{Result, Context};
use std::os::windows::process::CommandExt; // For create_no_window

pub struct SteamCmdService {
    app_handle: AppHandle,
}

impl SteamCmdService {
    pub fn new(app_handle: AppHandle) -> Self {
        Self { app_handle }
    }

    pub fn get_steamcmd_dir(&self) -> Result<PathBuf> {
        let app_dir = self.app_handle.path().app_data_dir()?;
        Ok(app_dir.join("steamcmd"))
    }

    pub fn get_steamcmd_exe(&self) -> Result<PathBuf> {
        Ok(self.get_steamcmd_dir()?.join("steamcmd.exe"))
    }

    pub fn check_installation(&self) -> bool {
        match self.get_steamcmd_exe() {
            Ok(path) => path.exists(),
            Err(_) => false,
        }
    }

    pub async fn install(&self) -> Result<()> {
        let install_dir = self.get_steamcmd_dir()?;
        if !install_dir.exists() {
            std::fs::create_dir_all(&install_dir)?;
        }

        println!("Downloading SteamCMD...");
        let response = reqwest::get("https://steamcdn-a.akamaihd.net/client/installer/steamcmd.zip")
            .await
            .context("Failed to download SteamCMD")?;

        let bytes = response.bytes().await.context("Failed to get bytes from response")?;
        
        println!("Extracting SteamCMD...");
        let target_dir = install_dir.clone();
        tokio::task::spawn_blocking(move || -> Result<()> {
            let mut archive = zip::ZipArchive::new(Cursor::new(bytes))?;
            archive.extract(&target_dir)?;
            Ok(())
        }).await??;

        println!("SteamCMD installed successfully at {:?}", install_dir);
        Ok(())
    }

    pub fn install_server(&self, server_type: &str, install_path: &PathBuf) -> Result<()> {
        let steamcmd_exe = self.get_steamcmd_exe()?;
        if !steamcmd_exe.exists() {
             return Err(anyhow::anyhow!("SteamCMD not found. Please install it first."));
        }

        let app_id = match server_type {
            "ASE" => "376030",
            "ASA" => "2430930",
            _ => return Err(anyhow::anyhow!("Invalid server type")),
        };

        let path_str = install_path.to_str().ok_or_else(|| anyhow::anyhow!("Invalid install path"))?;

        println!("Starting SteamCMD update for {} (AppID: {}) to {:?}", server_type, app_id, install_path);
        
        let _ = self.app_handle.emit("install-progress", format!("Starting installation for {}...", server_type));

        let mut child = std::process::Command::new(steamcmd_exe)
            .args(&[
                "+login", "anonymous",
                "+force_install_dir", path_str,
                "+app_update", app_id, "validate",
                "+quit"
            ])
            .stdout(std::process::Stdio::piped())
            .stderr(std::process::Stdio::piped()) // Capture stderr too
            .creation_flags(0x08000000) // CREATE_NO_WINDOW
            .spawn()
            .context("Failed to spawn SteamCMD process")?;

        // Handle stdout streaming
        let stdout = child.stdout.take().unwrap();
        let app_handle = self.app_handle.clone();
        
        // We can't use async reading easily here because we are in a blocking function (presumably wrapped in spawn_blocking)
        // So we use BufReader
        use std::io::{BufRead, BufReader};
        
        let reader = BufReader::new(stdout);
        
        for line in reader.lines() {
            if let Ok(l) = line {
                println!("[SteamCMD] {}", l);
                let _ = app_handle.emit("install-output", l);
            }
        }

        let status = child.wait().context("Failed to wait for SteamCMD")?;

        if status.success() {
            println!("SteamCMD update completed successfully.");
            let _ = self.app_handle.emit("install-progress", "Installation completed successfully.");
            Ok(())
        } else {
             let _ = self.app_handle.emit("install-progress", "Installation failed.");
             Err(anyhow::anyhow!("SteamCMD finished with error code: {:?}", status.code()))
        }
    }

    pub fn get_build_id(&self, server_type: &str, install_path: &PathBuf) -> Result<String> {
        let app_id = match server_type {
            "ASE" => "376030",
            "ASA" => "2430930",
            _ => return Err(anyhow::anyhow!("Invalid server type")),
        };

        let manifest_path = install_path.join("steamapps").join(format!("appmanifest_{}.acf", app_id));
        
        if !manifest_path.exists() {
            return Ok("Not Installed".to_string());
        }

        let content = std::fs::read_to_string(manifest_path).context("Failed to read appmanifest")?;
        
        // Simple regex to find "buildid"      "8529340"
        let re = regex::Regex::new(r#""buildid"\s+"(\d+)""#)?;
        
        if let Some(captures) = re.captures(&content) {
            if let Some(build_id) = captures.get(1) {
                return Ok(build_id.as_str().to_string());
            }
        }

        Ok("Unknown".to_string())
    }
}
