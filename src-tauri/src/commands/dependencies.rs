use tauri::{command, AppHandle};
use crate::services::steamcmd::SteamCmdService;

#[command]
pub async fn check_steamcmd_installed(app_handle: AppHandle) -> Result<bool, String> {
    let service = SteamCmdService::new(app_handle);
    Ok(service.check_installation())
}

#[command]
pub async fn install_steamcmd(app_handle: AppHandle) -> Result<(), String> {
    let service = SteamCmdService::new(app_handle);
    service.install().await.map_err(|e| e.to_string())
}

#[command]
pub async fn get_steamcmd_path(app_handle: AppHandle) -> Result<String, String> {
    let service = SteamCmdService::new(app_handle);
    let path = service.get_steamcmd_dir().map_err(|e| e.to_string())?;
    Ok(path.to_string_lossy().to_string())
}

#[command]
pub async fn check_all_dependencies(app_handle: AppHandle) -> Result<DependencyStatus, String> {
    let service = SteamCmdService::new(app_handle);
    
    Ok(DependencyStatus {
        steamcmd_installed: service.check_installation(),
        vcredist_installed: check_vcredist(),
        dotnet_installed: check_dotnet(),
    })
}

fn check_vcredist() -> bool {
    // Check Windows Registry for VC++ Redistributables
    #[cfg(target_os = "windows")]
    {
        use winreg::RegKey;
        use winreg::enums::*;
        
        let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
        
        // Check multiple possible registry locations for VC++ 2015-2022
        let paths = vec![
            r"SOFTWARE\Microsoft\VisualStudio\14.0\VC\Runtimes\x64",
            r"SOFTWARE\WOW6432Node\Microsoft\VisualStudio\14.0\VC\Runtimes\x64",
            r"SOFTWARE\Microsoft\DevDiv\vc\Servicing\14.0\RuntimeMinimum",
        ];
        
        for path in paths {
            if let Ok(runtimes) = hklm.open_subkey(path) {
                if let Ok(installed) = runtimes.get_value::<u32, _>("Installed") {
                    if installed == 1 {
                        return true;
                    }
                }
                // Also check for Version key as an indicator
                if let Ok(_version) = runtimes.get_value::<String, _>("Version") {
                    return true;
                }
            }
        }
    }
    
    #[cfg(not(target_os = "windows"))]
    {
        true // Non-Windows platforms don't need VC++ redistributables
    }
    
    false
}

fn check_dotnet() -> bool {
    // Optional: Check for .NET runtime if needed in future
    // For now, not required for ARK Server Manager
    true
}

#[derive(serde::Serialize)]
pub struct DependencyStatus {
    pub steamcmd_installed: bool,
    pub vcredist_installed: bool,
    pub dotnet_installed: bool,
}
