mod commands;
mod db;
mod models;
mod services;

pub use services::rcon_client;

use db::Database;
use services::process_manager::ProcessManager;
use services::steamcmd::SteamCmdService;
use services::scheduler::SchedulerService;
use std::sync::Mutex;
use tauri::Manager;
use sysinfo::System;
use services::notifications::test_discord_webhook;

pub struct AppState {
    pub db: Mutex<Database>,
    pub process_manager: ProcessManager,
    pub sys: Mutex<System>,
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
        .invoke_handler(tauri::generate_handler![
            // System commands
            commands::system::get_system_info,
            commands::system::select_folder,
            commands::system::get_setting,
            commands::system::get_setting,
            commands::system::set_setting,
            test_discord_webhook,
            // Config commands
            commands::config::read_config,
            commands::config::save_config,
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
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
