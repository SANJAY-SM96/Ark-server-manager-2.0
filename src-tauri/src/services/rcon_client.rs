use rcon::Connection;
use std::time::Duration;
// use std::sync::Arc;
// use tokio::sync::Mutex;

// Structure to hold RCON connection details and execute commands
pub struct RconClient;

impl RconClient {
    pub async fn execute(ip: &str, port: u16, password: &str, command: &str) -> Result<String, String> {
        let address = format!("{}:{}", ip, port);
        
        // Connect to RCON
        // Note: rcon crate's Connection::connect is async
        let mut conn = Connection::builder()
            .connect(address, password)
            .await
            .map_err(|e| format!("Failed to connect to RCON: {}", e))?;

        // Send Command
        let response = conn.cmd(command).await
            .map_err(|e| format!("Failed to execute RCON command: {}", e))?;

        Ok(response)
    }

    // Helper to get list of players
    // ARK returns "No Players Connected" or a list like "Name, SteamID \n ..."
    pub async fn get_players(ip: &str, port: u16, password: &str) -> Result<Vec<String>, String> {
        let response = Self::execute(ip, port, password, "ListPlayers").await?;
        
        if response.trim() == "No Players Connected" {
            return Ok(vec![]);
        }

        // Parse line by line
        let players = response.lines()
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty())
            .collect();

        Ok(players)
    }
}
