// TypeScript types for the application

export type ServerType = 'ASE' | 'ASA';

export type ServerStatus = 'stopped' | 'starting' | 'running' | 'crashed' | 'updating';

export interface Server {
    id: number;
    name: string;
    serverType: ServerType;
    installPath: string;
    status: ServerStatus;
    config: ServerConfig;
    ports: ServerPorts;
    createdAt: string;
    lastStarted?: string;
    pid?: number;
}

export interface ServerPorts {
    gamePort: number;
    queryPort: number;
    rconPort: number;
}

export interface ServerConfig {
    maxPlayers: number;
    serverPassword?: string;
    adminPassword: string;
    mapName: string;
    sessionName: string;
    motd?: string;
    battleyeEnabled?: boolean;
    multihomeIp?: string;
    crossplayEnabled?: boolean;
    autoRestart?: boolean;
    autoUpdate?: boolean;
}

export interface SystemInfo {
    cpuUsage: number;
    ramUsage: number;
    ramTotal: number;
    diskUsage: number;
    diskTotal: number;
}

export interface PerformanceMetrics {
    serverId: number;
    cpuUsage: number;
    memoryUsage: number;
    playerCount: number;
    uptime: number;
    timestamp: string;
}

export interface ModInfo {
    id: string;
    name: string;
    version?: string;
    author?: string;
    description?: string;
    thumbnailUrl?: string;
    downloads?: string;
    compatible?: boolean;
    workshopUrl?: string;
    serverType?: ServerType;
    enabled?: boolean;
    loadOrder?: number;
}

export interface Backup {
    id: number;
    serverId: number;
    backupType: 'auto' | 'manual' | 'pre-update';
    filePath: string;
    size: number;
    createdAt: string;
    includesConfigs: boolean;
    includesMods: boolean;
    includesSaves: boolean;
    includesCluster: boolean;
    note?: string;
}

export interface Cluster {
    id: number;
    name: string;
    serverIds: number[];
    clusterPath: string;
    createdAt: string;
}

export interface LogEntry {
    timestamp: string;
    level: 'info' | 'warning' | 'error' | 'debug';
    message: string;
    source?: string;
}

export interface ConfigTemplate {
    id: string;
    name: string;
    description: string;
    gameMode: 'PvE' | 'PvP' | 'RP' | 'Hardcore' | 'Beginner' | 'No-Meta';
    settings: Record<string, any>;
}

export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}

export interface Schedule {
    id: number;
    serverId: number;
    taskType: string;
    cronExpression: string;
    payload?: string;
    enabled: boolean;
    lastRun?: string;
}
