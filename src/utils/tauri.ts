// Frontend wrapper for Tauri commands
import { invoke } from '@tauri-apps/api/core';
import type {
    Server,
    SystemInfo,
    ModInfo,
    Backup,
    Cluster,
    ServerType,
    Schedule,
} from '../types';

export type {
    Server,
    SystemInfo,
    ModInfo,
    Backup,
    Cluster,
    ServerType,
    Schedule,
};

// ============================================================================
// System Commands
// ============================================================================

export async function getSystemInfo(): Promise<SystemInfo> {
    return await invoke('get_system_info');
}

export async function selectFolder(title: string): Promise<string | null> {
    return await invoke('select_folder', { title });
}

export async function getSetting(key: string): Promise<string | null> {
    return await invoke('get_setting', { key });
}

export async function setSetting(key: string, value: string): Promise<void> {
    return await invoke('set_setting', { key, value });
}

// ============================================================================
// Server Commands
// ============================================================================

export async function getAllServers(): Promise<Server[]> {
    return await invoke('get_all_servers');
}

export async function getServerById(serverId: number): Promise<Server | null> {
    return await invoke('get_server_by_id', { serverId });
}

export interface InstallServerParams {
    serverType: ServerType;
    installPath: string;
    name: string;
    mapName: string;
    gamePort: number;
    queryPort: number;
    rconPort: number;
}

export async function installServer(params: InstallServerParams): Promise<Server> {
    return await invoke('install_server', {
        serverType: params.serverType,
        installPath: params.installPath,
        name: params.name,
        mapName: params.mapName,
        gamePort: params.gamePort,
        queryPort: params.queryPort,
        rconPort: params.rconPort,
    });
}

export async function startServer(serverId: number): Promise<void> {
    return await invoke('start_server', { serverId });
}

export async function stopServer(serverId: number): Promise<void> {
    return await invoke('stop_server', { serverId });
}

export async function restartServer(serverId: number): Promise<void> {
    return await invoke('restart_server', { serverId });
}

export async function deleteServer(serverId: number): Promise<void> {
    return await invoke('delete_server', { serverId });
}

export async function updateServer(serverId: number): Promise<void> {
    return await invoke('update_server', { serverId });
}

export async function getServerVersion(serverId: number): Promise<string> {
    return await invoke('get_server_version', { serverId });
}

// ============================================================================
// Mod Commands
// ============================================================================

export async function searchMods(query: string, serverType: 'ASE' | 'ASA'): Promise<ModInfo[]> {
    return await invoke('search_mods', { query, serverType });
}

export async function installMod(serverId: number, modId: string): Promise<void> {
    return await invoke('install_mod', { serverId, modId });
}

export async function uninstallMod(serverId: number, modId: string): Promise<void> {
    return await invoke('uninstall_mod', { serverId, modId });
}

export async function installModsBatch(serverId: number, modIds: string[]): Promise<void> {
    return await invoke('install_mods_batch', { serverId, modIds });
}

export async function getInstalledMods(serverId: number): Promise<ModInfo[]> {
    return await invoke('get_installed_mods', { serverId });
}

export async function updateActiveMods(serverId: number, modIds: string[]): Promise<void> {
    return await invoke('update_active_mods', { serverId, modIds });
}

// ============================================================================
// Config Commands
// ============================================================================

export async function readConfig(serverId: number, configType: string): Promise<string> {
    return await invoke('read_config', { serverId, configType });
}

export async function saveConfig(serverId: number, configType: string, content: string): Promise<void> {
    return await invoke('save_config', { serverId, configType, content });
}

// ============================================================================
// Backup Commands
// ============================================================================

export async function createBackup(serverId: number, backupType: 'auto' | 'manual' | 'pre-update'): Promise<Backup> {
    return await invoke('create_backup', { serverId, backupType });
}

export async function getBackups(serverId: number): Promise<Backup[]> {
    return await invoke('get_backups', { serverId });
}

export async function restoreBackup(backupId: number): Promise<void> {
    return await invoke('restore_backup', { backupId });
}

export async function deleteBackup(backupId: number): Promise<void> {
    return await invoke('delete_backup', { backupId });
}

export async function updateBackup(backupId: number, note: string): Promise<void> {
    return await invoke('update_backup', { backupId, note });
}

export interface BackupFileInfo {
    name: string;
    path: string;
    size: number;
    is_dir: boolean;
}

export async function viewBackupContent(backupPath: string): Promise<BackupFileInfo[]> {
    return await invoke('view_backup_content', { backupPath });
}

// ============================================================================
// Cluster Commands
// ============================================================================

export async function createCluster(name: string, serverIds: number[]): Promise<Cluster> {
    return await invoke('create_cluster', { name, serverIds });
}

export async function getClusters(): Promise<Cluster[]> {
    return await invoke('get_clusters');
}

export async function deleteCluster(clusterId: number): Promise<void> {
    return await invoke('delete_cluster', { clusterId });
}

// ============================================================================
// Map Commands
// ============================================================================

export async function updateServerMap(serverId: number, mapName: string): Promise<void> {
    return await invoke('update_server_map', { serverId, mapName });
}

export async function wipeServerSave(serverId: number): Promise<void> {
    return await invoke('wipe_server_save', { serverId });
}

// ============================================================================
// RCON Commands
// ============================================================================

export async function sendRconCommand(serverId: number, command: string): Promise<string> {
    return await invoke('send_rcon_command', { serverId, command });
}

export async function getOnlinePlayers(serverId: number): Promise<string[]> {
    return await invoke('get_online_players', { serverId });
}

export async function destroyWildDinos(serverId: number): Promise<string> {
    return await invoke('destroy_wild_dinos', { serverId });
}

// ============================================================================
// Tribe Commands
// ============================================================================

export interface TribeFile {
    name: string;
    size: number;
    last_modified: string;
}

export async function getTribeFiles(serverId: number): Promise<TribeFile[]> {
    return await invoke('get_tribe_files', { serverId });
}

export async function deleteTribe(serverId: number, fileName: string): Promise<void> {
    return await invoke('delete_tribe', { serverId, fileName });
}

// ============================================================================
// Security Commands
// ============================================================================

export async function setBattlEye(serverId: number, enabled: boolean): Promise<void> {
    return await invoke('set_battleye', { serverId, enabled });
}

export async function getWhitelist(serverId: number): Promise<string[]> {
    return await invoke('get_whitelist', { serverId });
}

export async function addToWhitelist(serverId: number, steamId: string): Promise<void> {
    return await invoke('add_to_whitelist', { serverId, steamId });
}

export async function removeFromWhitelist(serverId: number, steamId: string): Promise<void> {
    return await invoke('remove_from_whitelist', { serverId, steamId });
}

// ============================================================================
// Scheduler Commands
// Scheduler Commands
export async function getSchedules(serverId: number): Promise<Schedule[]> {
    return await invoke('get_schedules', { serverId });
}

export async function createSchedule(serverId: number, taskType: string, cronExpression: string, payload?: string): Promise<void> {
    return await invoke('create_schedule', { serverId, taskType, cronExpression, payload });
}

export async function deleteSchedule(id: number): Promise<void> {
    return await invoke('delete_schedule', { id });
}

export async function toggleSchedule(id: number, enabled: boolean): Promise<void> {
    return await invoke('toggle_schedule', { id, enabled });
}

// Network
export async function getLocalIps(): Promise<string[]> {
    return await invoke('get_local_ips');
}

export async function setNetworkSettings(serverId: number, multihomeIp: string): Promise<void> {
    return await invoke('set_network_settings', { serverId, multihomeIp });
}

export async function setCrossplayEnabled(serverId: number, enabled: boolean): Promise<void> {
    return await invoke('set_crossplay_enabled', { serverId, enabled });
}

// ============================================================================
// File Manager Commands
// ============================================================================

export interface FileInfo {
    name: string;
    path: string;
    is_dir: boolean;
    size: number;
    modified?: number;
}

export async function listFiles(path: string): Promise<FileInfo[]> {
    return await invoke('list_files', { path });
}

export async function readFileContent(path: string): Promise<string> {
    return await invoke('read_file_content', { path });
}

export async function saveFileContent(path: string, content: string): Promise<void> {
    return await invoke('save_file_content', { path, content });
}

export async function deleteFilePath(path: string): Promise<void> {
    return await invoke('delete_file_path', { path });
}

export async function zipDirectory(source: string, destination: string): Promise<void> {
    return await invoke('zip_directory', { source, destination });
}

export async function unzipFile(zipPath: string, destination: string): Promise<void> {
    return await invoke('unzip_file', { zipPath, destination });
}
