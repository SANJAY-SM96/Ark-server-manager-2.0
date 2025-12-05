-- ARK Server Manager Database Schema

-- Servers table
CREATE TABLE IF NOT EXISTS servers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    server_type TEXT NOT NULL CHECK(server_type IN ('ASE', 'ASA')),
    install_path TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'stopped' CHECK(status IN ('stopped', 'starting', 'running', 'crashed', 'updating')),
    game_port INTEGER NOT NULL,
    query_port INTEGER NOT NULL,
    rcon_port INTEGER NOT NULL,
    max_players INTEGER DEFAULT 70,
    server_password TEXT,
    admin_password TEXT NOT NULL,
    map_name TEXT NOT NULL,
    session_name TEXT NOT NULL,
    motd TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_started TIMESTAMP,
    battleye_enabled BOOLEAN DEFAULT 0,
    multihome_ip TEXT,
    crossplay_enabled BOOLEAN DEFAULT 0,
    UNIQUE(name)
);

-- Mods table
CREATE TABLE IF NOT EXISTS mods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    server_id INTEGER NOT NULL,
    mod_id TEXT NOT NULL,
    name TEXT NOT NULL,
    version TEXT,
    author TEXT,
    description TEXT,
    workshop_url TEXT,
    server_type TEXT NOT NULL CHECK(server_type IN ('ASE', 'ASA')),
    enabled BOOLEAN DEFAULT 1,
    load_order INTEGER NOT NULL,
    installed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (server_id) REFERENCES servers (id) ON DELETE CASCADE,
    UNIQUE(server_id, mod_id)
);

-- Backups table
CREATE TABLE IF NOT EXISTS backups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    server_id INTEGER NOT NULL,
    backup_type TEXT NOT NULL CHECK(backup_type IN ('auto', 'manual', 'pre-update')),
    file_path TEXT NOT NULL,
    size INTEGER NOT NULL,
includes_configs BOOLEAN DEFAULT 1,
    includes_mods BOOLEAN DEFAULT 1,
    includes_saves BOOLEAN DEFAULT 1,
    includes_cluster BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (server_id) REFERENCES servers (id) ON DELETE CASCADE
);

-- Clusters table
CREATE TABLE IF NOT EXISTS clusters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    cluster_path TEXT NOT NULL,
    server_ids TEXT NOT NULL, -- JSON array of server IDs
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Settings table (key-value store)
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Schedules table
CREATE TABLE IF NOT EXISTS schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    server_id INTEGER NOT NULL,
    task_type TEXT NOT NULL CHECK(task_type IN ('restart', 'backup', 'broadcast')),
    cron_expression TEXT NOT NULL,
    payload TEXT,
    enabled BOOLEAN DEFAULT 1,
    last_run TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (server_id) REFERENCES servers (id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_mods_server_id ON mods(server_id);
CREATE INDEX IF NOT EXISTS idx_backups_server_id ON backups(server_id);
CREATE INDEX IF NOT EXISTS idx_servers_status ON servers(status);
