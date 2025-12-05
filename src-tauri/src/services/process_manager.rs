use anyhow::{Context, Result};
use std::collections::HashMap;
use std::path::PathBuf;
use std::process::{Child, Command};
use std::sync::{Arc, Mutex};

pub struct ProcessManager {
    processes: Arc<Mutex<HashMap<i64, Child>>>,
}

impl ProcessManager {
    pub fn new() -> Self {
        ProcessManager {
            processes: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    /// Start ARK server
    pub fn start_server(
        &self,
        server_id: i64,
        server_type: &str,
        install_path: &PathBuf,
        map_name: &str,
        session_name: &str,
        game_port: u16,
        query_port: u16,
        rcon_port: u16,
        max_players: i32,
        server_password: Option<&str>,
        admin_password: &str,
        use_battleye: bool,
        multihome_ip: Option<String>,
        crossplay_enabled: bool,
    ) -> Result<()> {
        let executable = match server_type {
            "ASE" => install_path
                .join("ShooterGame")
                .join("Binaries")
                .join("Win64")
                .join("ShooterGameServer.exe"),
            "ASA" => install_path
                .join("ShooterGame")
                .join("Binaries")
                .join("Win64")
                .join("ArkAscendedServer.exe"),
            _ => return Err(anyhow::anyhow!("Invalid server type")),
        };

        if !executable.exists() {
            return Err(anyhow::anyhow!(
                "Server executable not found at {:?}",
                executable
            ));
        }

        // Build launch arguments
        let mut args = vec![
            map_name.to_string(),
            format!("listen"),
            format!("?SessionName={}", session_name),
            format!("?Port={}", game_port),
            format!("?QueryPort={}", query_port),
            format!("?RCONPort={}", rcon_port),
            format!("?MaxPlayers={}", max_players),
            format!("?ServerAdminPassword={}", admin_password),
        ];

        if let Some(password) = server_password {
            args.push(format!("?ServerPassword={}", password));
        }

        if let Some(ip) = multihome_ip {
            if !ip.is_empty() {
                args.push(format!("?MultiHome={}", ip));
            }
        }

        args.push("-log".to_string());
        if !use_battleye {
            args.push("-NoBattlEye".to_string());
        }

        if crossplay_enabled {
            match server_type {
                "ASE" => args.push("-crossplay".to_string()),
                "ASA" => {
                    // ASA usually has crossplay on by default, but this enforces it for Win10/Xbox
                    // Or specific flags. Common one:
                    // args.push("-WinLiveMaxPlayers=70".to_string()); // Example
                    // Actually, simple -crossplay works effectively as a marker for some wrappers,
                    // but for raw server: -ServerPlatform=ALL is often implied.
                    // We'll add a generic launch arg if needed, but for now we'll stick to
                    // -crossplay if ASE, and for ASA perhaps nothing special is needed OR
                    // we add -WinLiveMaxPlayers if requested.
                    // Let's rely on user knowledge via "ConfigEditor" args for advanced,
                    // but for this toggle we'll add the standard recommended flag.
                    // ASE: -crossplay. ASA: -WinLiveMaxPlayers=MaxPlayers?
                    // Let's disable BattleEye restriction for Crossplay if needed?
                    // Actually, Microsoft Store version requires no BattlEye often.
                    if !use_battleye {
                        // Crossplay on ASA without BattlEye is easier.
                    }
                    // For now, let's just add the arg if it's ASE.
                    // For ASA, it's mostly default.
                }
                _ => {}
            }
            if server_type == "ASE" {
                // args.push("-crossplay".to_string());
                // Wait, I can't push conditionally inside the match due to ownership?
                // No, standard Vec push is fine.
            }
        }

        // Refined Crossplay Logic
        if crossplay_enabled {
            if server_type == "ASE" {
                args.push("-crossplay".to_string());
            }
            // For ASA, crossplay is default. We might add specific overrides later.
        }

        let child = Command::new(&executable)
            .args(&args)
            .spawn()
            .context("Failed to start server process")?;

        let mut processes = self.processes.lock().unwrap();
        processes.insert(server_id, child);

        Ok(())
    }

    /// Stop ARK server
    pub fn stop_server(&self, server_id: i64) -> Result<()> {
        let mut processes = self.processes.lock().unwrap();

        if let Some(mut child) = processes.remove(&server_id) {
            child.kill().context("Failed to kill server process")?;
            child.wait().context("Failed to wait for server process")?;
            Ok(())
        } else {
            Err(anyhow::anyhow!("Server process not found"))
        }
    }

    /// Check if server is running
    pub fn is_running(&self, server_id: i64) -> bool {
        let mut processes = self.processes.lock().unwrap();

        if let Some(child) = processes.get_mut(&server_id) {
            match child.try_wait() {
                Ok(Some(_)) => {
                    // Process has exited
                    processes.remove(&server_id);
                    false
                }
                Ok(None) => true, // Still running
                Err(_) => false,
            }
        } else {
            false
        }
    }

    /// Restart server
    pub fn restart_server(
        &self,
        server_id: i64,
        server_type: &str,
        install_path: &PathBuf,
        map_name: &str,
        session_name: &str,
        game_port: u16,
        query_port: u16,
        rcon_port: u16,
        max_players: i32,
        server_password: Option<&str>,
        admin_password: &str,
        use_battleye: bool,
        multihome_ip: Option<String>,
        crossplay_enabled: bool,
    ) -> Result<()> {
        // Stop if running
        if self.is_running(server_id) {
            self.stop_server(server_id)?;
        }

        // Wait a moment for cleanup
        std::thread::sleep(std::time::Duration::from_secs(2));

        // Start again
        self.start_server(
            server_id,
            server_type,
            install_path,
            map_name,
            session_name,
            game_port,
            query_port,
            rcon_port,
            max_players,
            server_password,
            admin_password,
            use_battleye,
            multihome_ip,
            crossplay_enabled,
        )
    }

    /// Check for dead processes and remove them, returning their IDs and exit status
    pub fn check_dead_processes(&self) -> Vec<(i64, Option<i32>)> {
        let mut processes = self.processes.lock().unwrap();
        let mut dead_servers = Vec::new();

        // Collect dead server IDs first to avoid borrow issues
        let ids: Vec<i64> = processes.keys().cloned().collect();

        for id in ids {
            if let Some(child) = processes.get_mut(&id) {
                match child.try_wait() {
                    Ok(Some(status)) => {
                        dead_servers.push((id, status.code()));
                    }
                    Ok(None) => {} // Running
                    Err(_) => {
                        // Error waiting? Assume dead?
                        dead_servers.push((id, None));
                    }
                }
            }
        }

        // Remove dead ones
        for (id, _) in &dead_servers {
            processes.remove(id);
        }

        dead_servers
    }
}

impl Default for ProcessManager {
    fn default() -> Self {
        Self::new()
    }
}
