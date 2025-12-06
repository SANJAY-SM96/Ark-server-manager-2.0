use crate::services::discord_bot;
use crate::AppState;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, State, Manager};

#[derive(Debug, Serialize, Deserialize)]
pub struct DiscordBotConfig {
    pub token: String,
    pub enabled: bool,
    pub guild_id: Option<String>,
    pub admin_role_id: Option<String>,
    pub allowed_channels: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BotStatus {
    pub is_running: bool,
    pub connected: bool,
}

/// Start the Discord bot with the given token
#[tauri::command]
pub async fn start_discord_bot(
    app: AppHandle,
    state: State<'_, AppState>,
    token: String,
    guild_id: Option<String>,
) -> Result<(), String> {
    // Check if bot is already running
    {
        let bot_handle = state.discord_bot.lock().map_err(|e| e.to_string())?;
        if bot_handle.is_running {
            return Err("Discord bot is already running".to_string());
        }
    }

    // Parse guild_id if provided
    let guild_id_parsed: Option<u64> = match &guild_id {
        Some(id) => id.parse().ok(),
        None => None,
    };

    // Save token to settings
    {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        let conn = db.get_connection().map_err(|e| e.to_string())?;
        conn.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES ('discord_bot_token', ?1)",
            [&token],
        ).map_err(|e| e.to_string())?;
        
        if let Some(ref gid) = guild_id {
            conn.execute(
                "INSERT OR REPLACE INTO settings (key, value) VALUES ('discord_bot_guild_id', ?1)",
                [gid],
            ).map_err(|e| e.to_string())?;
        }
        
        conn.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES ('discord_bot_enabled', 'true')",
            [],
        ).map_err(|e| e.to_string())?;
    }

    // Start the bot in the background
    let app_handle = app.clone();
    let token_clone = token.clone();
    
    tauri::async_runtime::spawn(async move {
        if let Err(e) = discord_bot::start_bot(app_handle, token_clone, guild_id_parsed).await {
            eprintln!("Discord bot error: {}", e);
        }
    });

    println!("🤖 Discord bot starting...");
    Ok(())
}

/// Stop the Discord bot
#[tauri::command]
pub async fn stop_discord_bot(state: State<'_, AppState>) -> Result<(), String> {
    let mut bot_handle = state.discord_bot.lock().map_err(|e| e.to_string())?;
    
    if !bot_handle.is_running {
        return Err("Discord bot is not running".to_string());
    }

    bot_handle.stop();

    // Update settings
    {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        let conn = db.get_connection().map_err(|e| e.to_string())?;
        conn.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES ('discord_bot_enabled', 'false')",
            [],
        ).map_err(|e| e.to_string())?;
    }

    println!("🛑 Discord bot stopped");
    Ok(())
}

/// Get the current status of the Discord bot
#[tauri::command]
pub async fn get_discord_bot_status(state: State<'_, AppState>) -> Result<BotStatus, String> {
    let bot_handle = state.discord_bot.lock().map_err(|e| e.to_string())?;
    
    Ok(BotStatus {
        is_running: bot_handle.is_running,
        connected: bot_handle.is_running, // Simplified for now
    })
}

/// Save Discord bot configuration
#[tauri::command]
pub async fn set_discord_bot_config(
    state: State<'_, AppState>,
    config: DiscordBotConfig,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.get_connection().map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT OR REPLACE INTO settings (key, value) VALUES ('discord_bot_token', ?1)",
        [&config.token],
    ).map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT OR REPLACE INTO settings (key, value) VALUES ('discord_bot_enabled', ?1)",
        [if config.enabled { "true" } else { "false" }],
    ).map_err(|e| e.to_string())?;

    if let Some(guild_id) = config.guild_id {
        conn.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES ('discord_bot_guild_id', ?1)",
            [&guild_id],
        ).map_err(|e| e.to_string())?;
    }

    if let Some(admin_role) = config.admin_role_id {
        conn.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES ('discord_bot_admin_role', ?1)",
            [&admin_role],
        ).map_err(|e| e.to_string())?;
    }

    let channels_json = serde_json::to_string(&config.allowed_channels).unwrap_or_default();
    conn.execute(
        "INSERT OR REPLACE INTO settings (key, value) VALUES ('discord_bot_allowed_channels', ?1)",
        [&channels_json],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

/// Get Discord bot configuration
#[tauri::command]
pub async fn get_discord_bot_config(state: State<'_, AppState>) -> Result<DiscordBotConfig, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.get_connection().map_err(|e| e.to_string())?;

    let get_setting = |key: &str| -> Option<String> {
        conn.query_row(
            "SELECT value FROM settings WHERE key = ?1",
            [key],
            |row| row.get(0),
        ).ok()
    };

    let token = get_setting("discord_bot_token").unwrap_or_default();
    let enabled = get_setting("discord_bot_enabled").map(|v| v == "true").unwrap_or(false);
    let guild_id = get_setting("discord_bot_guild_id");
    let admin_role_id = get_setting("discord_bot_admin_role");
    let allowed_channels: Vec<String> = get_setting("discord_bot_allowed_channels")
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or_default();

    Ok(DiscordBotConfig {
        token,
        enabled,
        guild_id,
        admin_role_id,
        allowed_channels,
    })
}
