use crate::AppState;
use tauri::State;
use rusqlite::OptionalExtension;
use serde_json::json;

pub struct NotificationService;

impl NotificationService {
    pub async fn send_notification(db: &AppState, title: &str, message: &str) -> anyhow::Result<()> {
        let webhook_url = {
            let db_guard = db.db.lock().unwrap();
            let conn = db_guard.get_connection().unwrap();
            let mut stmt = conn.prepare("SELECT value FROM settings WHERE key = 'discord_webhook_url'")?;
            stmt.query_row([], |row| row.get::<_, String>(0)).optional()?
        };

        if let Some(url) = webhook_url {
            let client = reqwest::Client::new();
            let payload = json!({
                "username": "ARK Server Manager",
                "embeds": [{
                    "title": title,
                    "description": message,
                    "color": 5763719 // Green-ish
                }]
            });

            client.post(&url).json(&payload).send().await?;
        }
        
        Ok(())
    }
}

// Command for testing
#[tauri::command]
pub async fn test_discord_webhook(_state: State<'_, AppState>, webhook_url: String) -> Result<(), String> {
    let client = reqwest::Client::new();
    let payload = json!({
        "username": "ARK Server Manager",
        "content": "🔔 This is a test notification from your ARK Server Manager!"
    });

    let res = client.post(&webhook_url)
        .json(&payload)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if res.status().is_success() {
        Ok(())
    } else {
        Err(format!("Failed with status: {}", res.status()))
    }
}
