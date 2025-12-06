use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum ServerType {
    ASE,
    ASA,
}

impl ToString for ServerType {
    fn to_string(&self) -> String {
        match self {
            ServerType::ASE => "ASE".to_string(),
            ServerType::ASA => "ASA".to_string(),
        }
    }
}

impl std::str::FromStr for ServerType {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "ASE" => Ok(ServerType::ASE),
            "ASA" => Ok(ServerType::ASA),
            _ => Err(format!("Invalid server type: {}", s)),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ServerStatus {
    Stopped,
    Starting,
    Running,
    Crashed,
    Updating,
    Installing,
}

impl ToString for ServerStatus {
    fn to_string(&self) -> String {
        match self {
            ServerStatus::Stopped => "stopped".to_string(),
            ServerStatus::Starting => "starting".to_string(),
            ServerStatus::Running => "running".to_string(),
            ServerStatus::Crashed => "crashed".to_string(),
            ServerStatus::Updating => "updating".to_string(),
            ServerStatus::Installing => "installing".to_string(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Server {
    pub id: i64,
    pub name: String,
    pub server_type: ServerType,
    pub install_path: PathBuf,
    pub status: ServerStatus,
    pub ports: ServerPorts,
    pub config: ServerConfig,
    pub created_at: String,
    pub last_started: Option<String>,
    pub pid: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ServerPorts {
    pub game_port: u16,
    pub query_port: u16,
    pub rcon_port: u16,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ServerConfig {
    pub max_players: i32,
    pub server_password: Option<String>,
    pub admin_password: String,
    pub map_name: String,
    pub session_name: String,
    pub motd: Option<String>,
    pub battleye_enabled: bool,
    pub multihome_ip: Option<String>,
    pub crossplay_enabled: bool,
    pub auto_restart: Option<bool>,
    pub auto_update: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ModInfo {
    pub id: String,
    pub name: String,
    pub version: Option<String>,
    pub author: Option<String>,
    pub description: Option<String>,
    pub thumbnail_url: Option<String>,
    pub downloads: Option<String>,
    pub compatible: Option<bool>,
    pub workshop_url: Option<String>,
    pub server_type: ServerType,
    pub enabled: bool,
    pub load_order: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Backup {
    pub id: i64,
    pub server_id: i64,
    pub backup_type: BackupType,
    pub file_path: PathBuf,
    pub size: i64,
    pub includes_configs: bool,
    pub includes_mods: bool,
    pub includes_saves: bool,
    pub includes_cluster: bool,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum BackupType {
    Auto,
    Manual,
    PreUpdate,
}

impl ToString for BackupType {
    fn to_string(&self) -> String {
        match self {
            BackupType::Auto => "auto".to_string(),
            BackupType::Manual => "manual".to_string(),
            BackupType::PreUpdate => "pre-update".to_string(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Cluster {
    pub id: i64,
    pub name: String,
    pub cluster_path: PathBuf,
    pub server_ids: Vec<i64>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SystemInfo {
    pub cpu_usage: f32,
    pub ram_usage: f64,
    pub ram_total: f64,
    pub disk_usage: f64,
    pub disk_total: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PerformanceMetrics {
    pub server_id: i64,
    pub cpu_usage: f32,
    pub memory_usage: f64,
    pub player_count: i32,
    pub uptime: i64,
    pub timestamp: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Schedule {
    pub id: i64,
    pub server_id: i64,
    pub task_type: String, // restart, backup, broadcast
    pub cron_expression: String,
    pub payload: Option<String>,
    pub enabled: bool,
    pub last_run: Option<String>,
}
