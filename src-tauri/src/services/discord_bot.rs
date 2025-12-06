use crate::AppState;
use serenity::async_trait;
use serenity::builder::{CreateCommand, CreateCommandOption, CreateEmbed, CreateInteractionResponse, CreateInteractionResponseMessage};
use serenity::model::application::{CommandOptionType, Interaction, ResolvedOption, ResolvedValue};
use serenity::model::gateway::Ready;
use serenity::model::id::GuildId;
use serenity::prelude::*;
use tauri::{AppHandle, Manager, Emitter};

/// Discord bot handle for managing the bot lifecycle
pub struct DiscordBotHandle {
    pub is_running: bool,
    shutdown_tx: Option<tokio::sync::oneshot::Sender<()>>,
}

impl DiscordBotHandle {
    pub fn new() -> Self {
        Self {
            is_running: false,
            shutdown_tx: None,
        }
    }

    pub fn set_running(&mut self, tx: tokio::sync::oneshot::Sender<()>) {
        self.is_running = true;
        self.shutdown_tx = Some(tx);
    }

    pub fn stop(&mut self) {
        if let Some(tx) = self.shutdown_tx.take() {
            let _ = tx.send(());
        }
        self.is_running = false;
    }
}

/// Event handler for the Discord bot
struct Handler {
    app_handle: AppHandle,
    guild_id: Option<u64>,
}

#[async_trait]
impl EventHandler for Handler {
    async fn ready(&self, ctx: Context, ready: Ready) {
        println!("🤖 Discord bot connected as {}", ready.user.name);

        // Register slash commands
        let commands = vec![
            // Server commands
            CreateCommand::new("servers")
                .description("Manage ARK servers")
                .add_option(
                    CreateCommandOption::new(CommandOptionType::SubCommand, "list", "List all servers")
                )
                .add_option(
                    CreateCommandOption::new(CommandOptionType::SubCommand, "start", "Start a server")
                        .add_sub_option(
                            CreateCommandOption::new(CommandOptionType::Integer, "id", "Server ID")
                                .required(true)
                        )
                )
                .add_option(
                    CreateCommandOption::new(CommandOptionType::SubCommand, "stop", "Stop a server")
                        .add_sub_option(
                            CreateCommandOption::new(CommandOptionType::Integer, "id", "Server ID")
                                .required(true)
                        )
                )
                .add_option(
                    CreateCommandOption::new(CommandOptionType::SubCommand, "restart", "Restart a server")
                        .add_sub_option(
                            CreateCommandOption::new(CommandOptionType::Integer, "id", "Server ID")
                                .required(true)
                        )
                )
                .add_option(
                    CreateCommandOption::new(CommandOptionType::SubCommand, "status", "Get server status")
                        .add_sub_option(
                            CreateCommandOption::new(CommandOptionType::Integer, "id", "Server ID")
                                .required(true)
                        )
                ),
            // Mod commands
            CreateCommand::new("mods")
                .description("Manage server mods")
                .add_option(
                    CreateCommandOption::new(CommandOptionType::SubCommand, "list", "List installed mods")
                        .add_sub_option(
                            CreateCommandOption::new(CommandOptionType::Integer, "server_id", "Server ID")
                                .required(true)
                        )
                )
                .add_option(
                    CreateCommandOption::new(CommandOptionType::SubCommand, "search", "Search for mods")
                        .add_sub_option(
                            CreateCommandOption::new(CommandOptionType::String, "query", "Search query")
                                .required(true)
                        )
                ),
            // Backup commands
            CreateCommand::new("backups")
                .description("Manage server backups")
                .add_option(
                    CreateCommandOption::new(CommandOptionType::SubCommand, "list", "List backups")
                        .add_sub_option(
                            CreateCommandOption::new(CommandOptionType::Integer, "server_id", "Server ID")
                                .required(true)
                        )
                )
                .add_option(
                    CreateCommandOption::new(CommandOptionType::SubCommand, "create", "Create a backup")
                        .add_sub_option(
                            CreateCommandOption::new(CommandOptionType::Integer, "server_id", "Server ID")
                                .required(true)
                        )
                ),
            // System commands
            CreateCommand::new("bot")
                .description("Bot status and info")
                .add_option(
                    CreateCommandOption::new(CommandOptionType::SubCommand, "status", "Check bot status")
                )
                .add_option(
                    CreateCommandOption::new(CommandOptionType::SubCommand, "info", "Show system info")
                ),
        ];

        // Register commands globally or to a specific guild
        if let Some(guild_id) = self.guild_id {
            let guild = GuildId::new(guild_id);
            if let Err(e) = guild.set_commands(&ctx.http, commands).await {
                eprintln!("Failed to register guild commands: {}", e);
            } else {
                println!("✅ Registered slash commands for guild {}", guild_id);
            }
        } else {
            // Register globally (takes up to 1 hour to propagate)
            for cmd in commands {
                if let Err(e) = serenity::model::application::Command::create_global_command(&ctx.http, cmd).await {
                    eprintln!("Failed to register global command: {}", e);
                }
            }
            println!("✅ Registered global slash commands (may take up to 1 hour to appear)");
        }
    }

    async fn interaction_create(&self, ctx: Context, interaction: Interaction) {
        if let Interaction::Command(command) = interaction {
            let content = match command.data.name.as_str() {
                "servers" => self.handle_servers_command(&command.data.options()).await,
                "mods" => self.handle_mods_command(&command.data.options()).await,
                "backups" => self.handle_backups_command(&command.data.options()).await,
                "bot" => self.handle_bot_command(&command.data.options()).await,
                _ => "Unknown command".to_string(),
            };

            // Create response embed
            let embed = CreateEmbed::new()
                .title("ARK Server Manager")
                .description(&content)
                .color(0x00D166); // Green color

            let response = CreateInteractionResponse::Message(
                CreateInteractionResponseMessage::new().embed(embed)
            );

            if let Err(e) = command.create_response(&ctx.http, response).await {
                eprintln!("Failed to respond to command: {}", e);
            }
        }
    }
}

impl Handler {
    async fn handle_servers_command(&self, options: &[ResolvedOption<'_>]) -> String {
        let subcommand = options.first();
        
        match subcommand {
            Some(ResolvedOption { name, value: ResolvedValue::SubCommand(sub_opts), .. }) => {
                match *name {
                    "list" => self.get_servers_list().await,
                    "start" => {
                        if let Some(id) = self.get_integer_from_options(sub_opts, "id") {
                            self.start_server(id).await
                        } else {
                            "❌ Server ID is required".to_string()
                        }
                    }
                    "stop" => {
                        if let Some(id) = self.get_integer_from_options(sub_opts, "id") {
                            self.stop_server(id).await
                        } else {
                            "❌ Server ID is required".to_string()
                        }
                    }
                    "restart" => {
                        if let Some(id) = self.get_integer_from_options(sub_opts, "id") {
                            self.restart_server(id).await
                        } else {
                            "❌ Server ID is required".to_string()
                        }
                    }
                    "status" => {
                        if let Some(id) = self.get_integer_from_options(sub_opts, "id") {
                            self.get_server_status(id).await
                        } else {
                            "❌ Server ID is required".to_string()
                        }
                    }
                    _ => "❌ Unknown subcommand".to_string(),
                }
            }
            _ => "❌ Unknown subcommand".to_string(),
        }
    }

    async fn handle_mods_command(&self, options: &[ResolvedOption<'_>]) -> String {
        let subcommand = options.first();
        
        match subcommand {
            Some(ResolvedOption { name, value: ResolvedValue::SubCommand(sub_opts), .. }) => {
                match *name {
                    "list" => {
                        if let Some(server_id) = self.get_integer_from_options(sub_opts, "server_id") {
                            self.get_mods_list(server_id).await
                        } else {
                            "❌ Server ID is required".to_string()
                        }
                    }
                    "search" => {
                        if let Some(query) = self.get_string_from_options(sub_opts, "query") {
                            self.search_mods(query).await
                        } else {
                            "❌ Search query is required".to_string()
                        }
                    }
                    _ => "❌ Unknown subcommand".to_string(),
                }
            }
            _ => "❌ Unknown subcommand".to_string(),
        }
    }

    async fn handle_backups_command(&self, options: &[ResolvedOption<'_>]) -> String {
        let subcommand = options.first();
        
        match subcommand {
            Some(ResolvedOption { name, value: ResolvedValue::SubCommand(sub_opts), .. }) => {
                match *name {
                    "list" => {
                        if let Some(server_id) = self.get_integer_from_options(sub_opts, "server_id") {
                            self.get_backups_list(server_id).await
                        } else {
                            "❌ Server ID is required".to_string()
                        }
                    }
                    "create" => {
                        if let Some(server_id) = self.get_integer_from_options(sub_opts, "server_id") {
                            self.create_backup(server_id).await
                        } else {
                            "❌ Server ID is required".to_string()
                        }
                    }
                    _ => "❌ Unknown subcommand".to_string(),
                }
            }
            _ => "❌ Unknown subcommand".to_string(),
        }
    }

    async fn handle_bot_command(&self, options: &[ResolvedOption<'_>]) -> String {
        let subcommand = options.first();
        
        match subcommand {
            Some(ResolvedOption { name, value: ResolvedValue::SubCommand(_), .. }) => {
                match *name {
                    "status" => self.get_bot_status().await,
                    "info" => self.get_system_info().await,
                    _ => "❌ Unknown subcommand".to_string(),
                }
            }
            _ => "❌ Unknown subcommand".to_string(),
        }
    }

    // Helper to get integer option from resolved options
    fn get_integer_from_options(&self, options: &[ResolvedOption<'_>], name: &str) -> Option<i64> {
        options.iter()
            .find(|o| o.name == name)
            .and_then(|o| {
                if let ResolvedValue::Integer(val) = o.value {
                    Some(val)
                } else {
                    None
                }
            })
    }

    // Helper to get string option from resolved options
    fn get_string_from_options<'a>(&self, options: &'a [ResolvedOption<'a>], name: &str) -> Option<&'a str> {
        options.iter()
            .find(|o| o.name == name)
            .and_then(|o| {
                if let ResolvedValue::String(val) = o.value {
                    Some(val)
                } else {
                    None
                }
            })
    }

    // ==================== Server Commands ====================

    async fn get_servers_list(&self) -> String {
        if let Some(state) = self.app_handle.try_state::<AppState>() {
            if let Ok(db) = state.db.lock() {
                if let Ok(conn) = db.get_connection() {
                    let mut stmt = match conn.prepare(
                        "SELECT id, name, server_type, status, map_name FROM servers ORDER BY id"
                    ) {
                        Ok(s) => s,
                        Err(e) => return format!("❌ Database error: {}", e),
                    };

                    let servers: Vec<String> = stmt
                        .query_map([], |row| {
                            let id: i64 = row.get(0)?;
                            let name: String = row.get(1)?;
                            let server_type: String = row.get(2)?;
                            let status: String = row.get(3)?;
                            let map: String = row.get(4)?;
                            
                            let status_emoji = match status.as_str() {
                                "running" => "🟢",
                                "stopped" => "🔴",
                                "starting" => "🟡",
                                "updating" => "🔄",
                                _ => "⚪",
                            };
                            
                            Ok(format!("{} **[{}]** {} ({}) - {}", status_emoji, id, name, server_type, map))
                        })
                        .ok()
                        .map(|rows| rows.filter_map(|r| r.ok()).collect())
                        .unwrap_or_default();

                    if servers.is_empty() {
                        return "📭 No servers configured".to_string();
                    }

                    return format!("**📋 Server List**\n\n{}", servers.join("\n"));
                }
            }
        }
        "❌ Failed to access database".to_string()
    }

    async fn start_server(&self, server_id: i64) -> String {
        if let Some(state) = self.app_handle.try_state::<AppState>() {
            // Check if server exists and get details
            let server_info = {
                if let Ok(db) = state.db.lock() {
                    if let Ok(conn) = db.get_connection() {
                        conn.query_row(
                            "SELECT name, status FROM servers WHERE id = ?1",
                            [server_id],
                            |row| Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
                        ).ok()
                    } else {
                        None
                    }
                } else {
                    None
                }
            };

            match server_info {
                Some((name, status)) => {
                    if status == "running" {
                        return format!("⚠️ Server **{}** is already running", name);
                    }
                    
                    // Use the app_handle's emit to trigger the start
                    let _ = self.app_handle.emit("discord-server-command", serde_json::json!({
                        "action": "start",
                        "server_id": server_id
                    }));
                    
                    format!("🚀 Starting server **{}** (ID: {})...\nUse `/servers status {}` to check progress", name, server_id, server_id)
                }
                None => format!("❌ Server with ID {} not found", server_id),
            }
        } else {
            "❌ Failed to access app state".to_string()
        }
    }

    async fn stop_server(&self, server_id: i64) -> String {
        if let Some(state) = self.app_handle.try_state::<AppState>() {
            let server_info = {
                if let Ok(db) = state.db.lock() {
                    if let Ok(conn) = db.get_connection() {
                        conn.query_row(
                            "SELECT name, status FROM servers WHERE id = ?1",
                            [server_id],
                            |row| Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
                        ).ok()
                    } else {
                        None
                    }
                } else {
                    None
                }
            };

            match server_info {
                Some((name, status)) => {
                    if status == "stopped" {
                        return format!("⚠️ Server **{}** is already stopped", name);
                    }
                    
                    // Emit stop command
                    let _ = self.app_handle.emit("discord-server-command", serde_json::json!({
                        "action": "stop",
                        "server_id": server_id
                    }));
                    
                    // Also try to stop via process manager directly
                    let _ = state.process_manager.stop_server(server_id);
                    
                    // Update DB status
                    if let Ok(db) = state.db.lock() {
                        if let Ok(conn) = db.get_connection() {
                            let _ = conn.execute("UPDATE servers SET status = 'stopped' WHERE id = ?1", [server_id]);
                        }
                    }
                    
                    format!("🛑 Stopped server **{}** (ID: {})", name, server_id)
                }
                None => format!("❌ Server with ID {} not found", server_id),
            }
        } else {
            "❌ Failed to access app state".to_string()
        }
    }

    async fn restart_server(&self, server_id: i64) -> String {
        if let Some(state) = self.app_handle.try_state::<AppState>() {
            let server_info = {
                if let Ok(db) = state.db.lock() {
                    if let Ok(conn) = db.get_connection() {
                        conn.query_row(
                            "SELECT name FROM servers WHERE id = ?1",
                            [server_id],
                            |row| row.get::<_, String>(0)
                        ).ok()
                    } else {
                        None
                    }
                } else {
                    None
                }
            };

            match server_info {
                Some(name) => {
                    let _ = self.app_handle.emit("discord-server-command", serde_json::json!({
                        "action": "restart",
                        "server_id": server_id
                    }));
                    
                    format!("🔄 Restarting server **{}** (ID: {})...", name, server_id)
                }
                None => format!("❌ Server with ID {} not found", server_id),
            }
        } else {
            "❌ Failed to access app state".to_string()
        }
    }

    async fn get_server_status(&self, server_id: i64) -> String {
        if let Some(state) = self.app_handle.try_state::<AppState>() {
            if let Ok(db) = state.db.lock() {
                if let Ok(conn) = db.get_connection() {
                    let result = conn.query_row(
                        "SELECT name, server_type, status, map_name, game_port, max_players, last_started 
                         FROM servers WHERE id = ?1",
                        [server_id],
                        |row| {
                            Ok((
                                row.get::<_, String>(0)?,
                                row.get::<_, String>(1)?,
                                row.get::<_, String>(2)?,
                                row.get::<_, String>(3)?,
                                row.get::<_, u16>(4)?,
                                row.get::<_, i32>(5)?,
                                row.get::<_, Option<String>>(6)?,
                            ))
                        }
                    );

                    match result {
                        Ok((name, server_type, status, map, port, max_players, last_started)) => {
                            let status_emoji = match status.as_str() {
                                "running" => "🟢 Running",
                                "stopped" => "🔴 Stopped",
                                "starting" => "🟡 Starting",
                                "updating" => "🔄 Updating",
                                "crashed" => "💥 Crashed",
                                _ => "⚪ Unknown",
                            };
                            
                            let last_started_str = last_started.unwrap_or_else(|| "Never".to_string());
                            
                            format!(
                                "**📊 Server Status: {}**\n\n\
                                 • **Type:** {}\n\
                                 • **Status:** {}\n\
                                 • **Map:** {}\n\
                                 • **Port:** {}\n\
                                 • **Max Players:** {}\n\
                                 • **Last Started:** {}",
                                name, server_type, status_emoji, map, port, max_players, last_started_str
                            )
                        }
                        Err(_) => format!("❌ Server with ID {} not found", server_id),
                    }
                } else {
                    "❌ Failed to access database".to_string()
                }
            } else {
                "❌ Failed to lock database".to_string()
            }
        } else {
            "❌ Failed to access app state".to_string()
        }
    }

    // ==================== Mod Commands ====================

    async fn get_mods_list(&self, server_id: i64) -> String {
        if let Some(state) = self.app_handle.try_state::<AppState>() {
            if let Ok(db) = state.db.lock() {
                if let Ok(conn) = db.get_connection() {
                    // First verify server exists
                    let server_name: Option<String> = conn.query_row(
                        "SELECT name FROM servers WHERE id = ?1",
                        [server_id],
                        |row| row.get(0)
                    ).ok();

                    if server_name.is_none() {
                        return format!("❌ Server with ID {} not found", server_id);
                    }

                    let mut stmt = match conn.prepare(
                        "SELECT mod_id, mod_name FROM installed_mods WHERE server_id = ?1"
                    ) {
                        Ok(s) => s,
                        Err(_) => return format!("📦 No mods installed on **{}**", server_name.unwrap()),
                    };

                    let mods: Vec<String> = stmt
                        .query_map([server_id], |row| {
                            let mod_id: String = row.get(0)?;
                            let mod_name: String = row.get(1)?;
                            Ok(format!("• {} (ID: {})", mod_name, mod_id))
                        })
                        .ok()
                        .map(|rows| rows.filter_map(|r| r.ok()).collect())
                        .unwrap_or_default();

                    if mods.is_empty() {
                        return format!("📦 No mods installed on **{}**", server_name.unwrap());
                    }

                    format!("**📦 Installed Mods on {}**\n\n{}", server_name.unwrap(), mods.join("\n"))
                } else {
                    "❌ Failed to access database".to_string()
                }
            } else {
                "❌ Failed to lock database".to_string()
            }
        } else {
            "❌ Failed to access app state".to_string()
        }
    }

    async fn search_mods(&self, query: &str) -> String {
        // For now, return a placeholder. Full implementation would call the mod scraper
        format!("🔍 Searching for mods: **{}**\n\n*Mod search via Discord is not yet implemented. Please use the ARK Server Manager UI to search and install mods.*", query)
    }

    // ==================== Backup Commands ====================

    async fn get_backups_list(&self, server_id: i64) -> String {
        if let Some(state) = self.app_handle.try_state::<AppState>() {
            if let Ok(db) = state.db.lock() {
                if let Ok(conn) = db.get_connection() {
                    // Verify server exists
                    let server_name: Option<String> = conn.query_row(
                        "SELECT name FROM servers WHERE id = ?1",
                        [server_id],
                        |row| row.get(0)
                    ).ok();

                    if server_name.is_none() {
                        return format!("❌ Server with ID {} not found", server_id);
                    }

                    let mut stmt = match conn.prepare(
                        "SELECT id, name, created_at, size_bytes FROM backups WHERE server_id = ?1 ORDER BY created_at DESC LIMIT 10"
                    ) {
                        Ok(s) => s,
                        Err(_) => return format!("💾 No backups found for **{}**", server_name.unwrap()),
                    };

                    let backups: Vec<String> = stmt
                        .query_map([server_id], |row| {
                            let id: i64 = row.get(0)?;
                            let name: String = row.get(1)?;
                            let created: String = row.get(2)?;
                            let size: i64 = row.get::<_, i64>(3).unwrap_or(0);
                            let size_mb = size / (1024 * 1024);
                            Ok(format!("• **[{}]** {} - {} ({} MB)", id, name, created, size_mb))
                        })
                        .ok()
                        .map(|rows| rows.filter_map(|r| r.ok()).collect())
                        .unwrap_or_default();

                    if backups.is_empty() {
                        return format!("💾 No backups found for **{}**", server_name.unwrap());
                    }

                    format!("**💾 Backups for {}** (Last 10)\n\n{}", server_name.unwrap(), backups.join("\n"))
                } else {
                    "❌ Failed to access database".to_string()
                }
            } else {
                "❌ Failed to lock database".to_string()
            }
        } else {
            "❌ Failed to access app state".to_string()
        }
    }

    async fn create_backup(&self, server_id: i64) -> String {
        if let Some(state) = self.app_handle.try_state::<AppState>() {
            let server_name: Option<String> = {
                if let Ok(db) = state.db.lock() {
                    if let Ok(conn) = db.get_connection() {
                        conn.query_row(
                            "SELECT name FROM servers WHERE id = ?1",
                            [server_id],
                            |row| row.get(0)
                        ).ok()
                    } else {
                        None
                    }
                } else {
                    None
                }
            };

            match server_name {
                Some(name) => {
                    // Emit backup command
                    let _ = self.app_handle.emit("discord-backup-command", serde_json::json!({
                        "action": "create",
                        "server_id": server_id
                    }));
                    
                    format!("💾 Creating backup for server **{}**...\nThis may take a few minutes. Use `/backups list {}` to see when it's complete.", name, server_id)
                }
                None => format!("❌ Server with ID {} not found", server_id),
            }
        } else {
            "❌ Failed to access app state".to_string()
        }
    }

    // ==================== Bot Commands ====================

    async fn get_bot_status(&self) -> String {
        "🤖 **Bot Status: Online**\n\n✅ Connected to ARK Server Manager\n✅ Commands registered".to_string()
    }

    async fn get_system_info(&self) -> String {
        if let Some(state) = self.app_handle.try_state::<AppState>() {
            if let Ok(mut sys) = state.sys.lock() {
                sys.refresh_all();
                
                let total_memory = sys.total_memory();
                let used_memory = sys.used_memory();
                let memory_percent = (used_memory as f64 / total_memory as f64 * 100.0).round();
                
                let cpu_usage: f32 = sys.cpus().iter().map(|c| c.cpu_usage()).sum::<f32>() / sys.cpus().len() as f32;
                
                format!(
                    "**💻 System Information**\n\n\
                     • **CPU Usage:** {:.1}%\n\
                     • **Memory:** {} GB / {} GB ({:.0}%)\n\
                     • **CPU Cores:** {}",
                    cpu_usage,
                    used_memory / (1024 * 1024 * 1024),
                    total_memory / (1024 * 1024 * 1024),
                    memory_percent,
                    sys.cpus().len()
                )
            } else {
                "❌ Failed to get system info".to_string()
            }
        } else {
            "❌ Failed to access app state".to_string()
        }
    }
}

/// Start the Discord bot
pub async fn start_bot(app_handle: AppHandle, token: String, guild_id: Option<u64>) -> Result<(), String> {
    let intents = GatewayIntents::empty();
    
    let handler = Handler {
        app_handle: app_handle.clone(),
        guild_id,
    };

    let mut client = Client::builder(&token, intents)
        .event_handler(handler)
        .await
        .map_err(|e| format!("Failed to create Discord client: {}", e))?;

    // Create shutdown channel
    let (tx, mut rx) = tokio::sync::oneshot::channel::<()>();

    // Update bot handle in app state
    if let Some(state) = app_handle.try_state::<AppState>() {
        if let Ok(mut bot_handle) = state.discord_bot.lock() {
            bot_handle.set_running(tx);
        }
    }

    // Start the bot with graceful shutdown
    tokio::select! {
        result = client.start() => {
            if let Err(e) = result {
                eprintln!("Discord bot error: {}", e);
                return Err(format!("Discord bot error: {}", e));
            }
        }
        _ = &mut rx => {
            println!("🛑 Discord bot shutting down...");
            client.shard_manager.shutdown_all().await;
        }
    }

    Ok(())
}
