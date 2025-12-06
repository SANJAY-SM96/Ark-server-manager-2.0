mod commands;
mod db;
mod models;
mod services;

pub use services::rcon_client;

use db::Database;
use services::process_manager::ProcessManager;
use services::steamcmd::SteamCmdService;
use services::scheduler::SchedulerService;
use services::discord_bot::DiscordBotHandle;
use std::sync::Mutex;
use tauri::Manager;
use sysinfo::System;
use services::notifications::test_discord_webhook;

pub struct AppState {
    pub db: Mutex<Database>,
    pub process_manager: ProcessManager,
    pub sys: Mutex<System>,
    pub discord_bot: Mutex<DiscordBotHandle>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // Initialize database
            let app_dir = app
                .path()
                .app_data_dir()
                .expect("failed to get app data dir");
            std::fs::create_dir_all(&app_dir).expect("failed to create app data dir");

            let db_path = app_dir.join("ark_manager_v2.db");
            let db = Database::new(db_path).expect("failed to initialize database");

            let mut sys = System::new_all();
            sys.refresh_all();

            app.manage(AppState {
                db: Mutex::new(db),
                process_manager: ProcessManager::new(),
                sys: Mutex::new(sys),
                discord_bot: Mutex::new(DiscordBotHandle::new()),
            });

            // Check and install SteamCMD
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                let steamcmd = SteamCmdService::new(app_handle);
                if !steamcmd.check_installation() {
                    println!("SteamCMD not found, installing...");
                    if let Err(e) = steamcmd.install().await {
                        eprintln!("Failed to install SteamCMD: {}", e);
                    }
                } else {
                    println!("SteamCMD is already installed.");
                }
            });

            // Start Scheduler Service
            let scheduler_handle = app.handle().clone();
            let scheduler = SchedulerService::new(scheduler_handle);
            scheduler.start();

            // Start Server Monitor Service
            let monitor_handle = app.handle().clone();
            services::server_monitor::ServerMonitorService::init(monitor_handle);

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                let app_handle = window.app_handle();
                if let Some(state) = app_handle.try_state::<AppState>() {
                    // Clean up dead processes first to get accurate count
                    let _ = state.process_manager.check_dead_processes();
                    
                    if state.process_manager.has_running_processes() {
                        // Prevent close
                        api.prevent_close();
                        
                        // Show confirmation dialog
                        let w = window.clone();
                        tauri::async_runtime::spawn(async move {
                            use tauri_plugin_dialog::DialogExt;
                            let answer = w.dialog()
                                .message("You have servers running. Are you sure you want to quit? This will stop all servers.")
                                .title("Servers Running")
                                .blocking_show();
                                
                            if answer {
                                w.close(); // Force close logic or graceful shutdown?
                                // If we call close() again, it might trigger this event again.
                                // We need to stop servers or exit app.
                                // Simplest is app_handle.exit(0), but that's abrupt.
                                // Better: Stop servers then exit.
                                // For now, let's just exit.
                                std::process::exit(0);
                            }
                        });
                    }
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            // System commands
            commands::system::get_system_info,
            commands::system::select_folder,
            commands::system::get_setting,
            commands::system::set_setting,
            test_discord_webhook,
            // Config commands
            commands::config::read_config,
            commands::config::save_config,
            commands::config::get_config_modified_time,
            // Server commands
            commands::server::get_all_servers,
            commands::server::get_server_by_id,
            commands::server::install_server,
            commands::server::start_server,
            commands::server::stop_server,
            commands::server::restart_server,
            commands::server::delete_server,
            commands::server::update_server,
            commands::server::get_server_version,
            commands::server::set_auto_restart,
            commands::server::set_auto_update,
            commands::server::update_server_graceful,
            commands::server::reset_stuck_servers,
            // Mod commands
            commands::mods::search_mods,
            commands::mods::install_mod,
            commands::mods::install_mods_batch,
            commands::mods::get_installed_mods,
            commands::mods::update_active_mods,
            commands::mods::uninstall_mod,
            commands::mods::check_mod_conflicts,
            // Backup commands
            commands::backup::create_backup,
            commands::backup::get_backups,
            commands::backup::restore_backup,
            commands::backup::delete_backup,
            commands::backup::update_backup,
            commands::backup::view_backup_content,
            // Map commands
            commands::map::update_server_map,
            commands::map::wipe_server_save,
            // Cluster commands
            commands::cluster::create_cluster,
            commands::cluster::get_clusters,
            commands::cluster::delete_cluster,
            // App Updater
            commands::app_updater::check_app_update,
            commands::app_updater::install_app_update,
            commands::app_updater::get_app_version,
            commands::app_updater::set_github_repo,
            // RCON commands
            commands::rcon::send_rcon_command,
            commands::rcon::get_online_players,
            commands::rcon::destroy_wild_dinos,
            // Tribe commands
            commands::tribe::get_tribe_files,
            commands::tribe::delete_tribe,
            // Security commands
            commands::security::set_battleye,
            commands::security::get_whitelist,
            commands::security::add_to_whitelist,
            commands::security::remove_from_whitelist,
            // Scheduler commands
            commands::scheduler::get_schedules,
            commands::scheduler::create_schedule,
            commands::scheduler::delete_schedule,
            commands::scheduler::toggle_schedule,
            // Network commands
            commands::network::get_local_ips,
            commands::network::set_network_settings,
            commands::network::set_crossplay_enabled,
            // File commands
            commands::files::list_files,
            commands::files::read_file_content,
            commands::files::save_file_content,
            commands::files::delete_file_path,
            commands::files::zip_directory,
            commands::files::unzip_file,
            // Dependency commands
            commands::dependencies::check_steamcmd_installed,
            commands::dependencies::install_steamcmd,
            commands::dependencies::get_steamcmd_path,
            commands::dependencies::check_all_dependencies,
            // Discord Bot commands
            commands::discord::start_discord_bot,
            commands::discord::stop_discord_bot,
            commands::discord::get_discord_bot_status,
            commands::discord::set_discord_bot_config,
            commands::discord::get_discord_bot_config,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
