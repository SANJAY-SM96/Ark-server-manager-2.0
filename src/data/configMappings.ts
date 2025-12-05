
export type ConfigFieldType = 'text' | 'number' | 'boolean' | 'select' | 'color';

export interface ConfigField {
    key: string;
    label: string;
    type: ConfigFieldType;
    section: string;
    defaultValue?: string;
    description?: string;
    options?: { label: string; value: string }[];
    min?: number;
    max?: number;
    step?: number;
}

export interface ConfigGroup {
    title: string;
    description: string;
    fields: ConfigField[];
    icon?: string;
}

// --- Shared / Common Settings ---
const COMMON_SERVER_SETTINGS: ConfigField[] = [
    { key: 'SessionName', label: 'Session Name', type: 'text', section: 'ServerSettings', defaultValue: 'Ark Server', description: 'The name that appears in the server browser' },
    { key: 'Message', label: 'Message of the Day', type: 'text', section: 'MessageOfTheDay', description: 'Message shown when players join' },
    { key: 'Duration', label: 'MOTD Duration', type: 'number', section: 'MessageOfTheDay', defaultValue: '20', description: 'How long the MOTD is displayed (seconds)' },
    { key: 'ServerPassword', label: 'Server Password', type: 'text', section: 'ServerSettings', description: 'Leave empty for no password' },
    { key: 'ServerAdminPassword', label: 'Admin Password', type: 'text', section: 'ServerSettings', description: 'Password required for admin commands' },
    { key: 'SpectatorPassword', label: 'Spectator Password', type: 'text', section: 'ServerSettings', description: 'Password for spectator mode' },
    { key: 'MaxPlayers', label: 'Max Players', type: 'number', section: 'ServerSettings', defaultValue: '70', min: 1, max: 255, description: 'Maximum number of players allowed' },
];

const COMMON_GAMEPLAY: ConfigField[] = [
    { key: 'ServerPVE', label: 'PvE Mode', type: 'boolean', section: 'ServerSettings', defaultValue: 'False', description: 'Enable Player vs Environment mode (no player damage)' },
    { key: 'ServerHardcore', label: 'Hardcore Mode', type: 'boolean', section: 'ServerSettings', defaultValue: 'False', description: 'Characters are deleted on death' },
    { key: 'GlobalVoiceChat', label: 'Global Voice Chat', type: 'boolean', section: 'ServerSettings', defaultValue: 'False', description: 'Enable voice chat across entire server' },
    { key: 'ProximityChat', label: 'Proximity Chat', type: 'boolean', section: 'ServerSettings', defaultValue: 'False', description: 'Enable proximity-based voice chat' },
    { key: 'AllowThirdPersonPlayer', label: 'Allow Third Person', type: 'boolean', section: 'ServerSettings', defaultValue: 'True', description: 'Allow players to use third-person view' },
    { key: 'AlwaysNotifyPlayerLeft', label: 'Notify Player Left', type: 'boolean', section: 'ServerSettings', defaultValue: 'False', description: 'Show notification when player leaves' },
    { key: 'AlwaysNotifyPlayerJoined', label: 'Notify Player Joined', type: 'boolean', section: 'ServerSettings', defaultValue: 'False', description: 'Show notification when player joins' },
    { key: 'ShowMapPlayerLocation', label: 'Show Player Location on Map', type: 'boolean', section: 'ServerSettings', defaultValue: 'True', description: 'Display player position on map' },
    { key: 'ServerCrosshair', label: 'Enable Crosshair', type: 'boolean', section: 'ServerSettings', defaultValue: 'True', description: 'Show crosshair on screen' },
    { key: 'ServerForceNoHud', label: 'Force No HUD', type: 'boolean', section: 'ServerSettings', defaultValue: 'False', description: 'Disable HUD for all players' },
    { key: 'EnablePvPGamma', label: 'Enable PvP Gamma', type: 'boolean', section: 'ServerSettings', defaultValue: 'False', description: 'Allow gamma adjustment in PvP' },
    { key: 'DisablePvEGamma', label: 'Disable PvE Gamma', type: 'boolean', section: 'ServerSettings', defaultValue: 'False', description: 'Prevent gamma adjustment in PvE' },
];

const COMMON_DIFFICULTY: ConfigField[] = [
    { key: 'DifficultyOffset', label: 'Difficulty Offset', type: 'number', section: 'ServerSettings', step: 0.1, min: 0, max: 1, defaultValue: '1.0', description: 'Base difficulty (0.0-1.0)' },
    { key: 'OverrideOfficialDifficulty', label: 'Override Official Difficulty', type: 'number', section: 'ServerSettings', step: 0.5, min: 1, max: 10, defaultValue: '5.0', description: 'Maximum creature level scaling (1-10)' },
    { key: 'MaxTribeLogs', label: 'Max Tribe Logs', type: 'number', section: 'ServerSettings', defaultValue: '100', min: 10, max: 1000, description: 'Maximum tribe log entries' },
];

const COMMON_PREVENTION: ConfigField[] = [
    { key: 'NoTributeDownloads', label: 'No Tribute Downloads', type: 'boolean', section: 'ServerSettings', defaultValue: 'False', description: 'Prevent downloading items from obelisks' },
    { key: 'PreventDownloadSurvivors', label: 'Prevent Download Survivors', type: 'boolean', section: 'ServerSettings', defaultValue: 'False', description: 'Block survivor downloads from cloud' },
    { key: 'PreventUploadSurvivors', label: 'Prevent Upload Survivors', type: 'boolean', section: 'ServerSettings', defaultValue: 'False', description: 'Block survivor uploads to cloud' },
    { key: 'PreventDownloadItems', label: 'Prevent Download Items', type: 'boolean', section: 'ServerSettings', defaultValue: 'False', description: 'Block item downloads from cloud' },
    { key: 'PreventUploadItems', label: 'Prevent Upload Items', type: 'boolean', section: 'ServerSettings', defaultValue: 'False', description: 'Block item uploads to cloud' },
    { key: 'PreventDownloadDinos', label: 'Prevent Download Dinos', type: 'boolean', section: 'ServerSettings', defaultValue: 'False', description: 'Block dino downloads from cloud' },
    { key: 'PreventUploadDinos', label: 'Prevent Upload Dinos', type: 'boolean', section: 'ServerSettings', defaultValue: 'False', description: 'Block dino uploads to cloud' },
];

const COMMON_PLAYER_STATS: ConfigField[] = [
    { key: 'PlayerCharacterHealthRecoveryMultiplier', label: 'Health Recovery', type: 'number', section: 'ServerSettings', step: 0.1, min: 0.1, max: 10, defaultValue: '1.0', description: 'Multiplier for player health regeneration' },
    { key: 'PlayerCharacterStaminaRecoveryMultiplier', label: 'Stamina Recovery', type: 'number', section: 'ServerSettings', step: 0.1, min: 0.1, max: 10, defaultValue: '1.0', description: 'Multiplier for stamina regeneration' },
    { key: 'PlayerCharacterWaterDrainMultiplier', label: 'Water Drain', type: 'number', section: 'ServerSettings', step: 0.1, min: 0.1, max: 10, defaultValue: '1.0', description: 'How fast players get thirsty' },
    { key: 'PlayerCharacterFoodDrainMultiplier', label: 'Food Drain', type: 'number', section: 'ServerSettings', step: 0.1, min: 0.1, max: 10, defaultValue: '1.0', description: 'How fast players get hungry' },
    { key: 'PlayerDamageMultiplier', label: 'Player Damage', type: 'number', section: 'ServerSettings', step: 0.1, min: 0.1, max: 10, defaultValue: '1.0', description: 'Damage dealt by players' },
    { key: 'PlayerResistanceMultiplier', label: 'Player Resistance', type: 'number', section: 'ServerSettings', step: 0.1, min: 0.1, max: 10, defaultValue: '1.0', description: 'Damage resistance for players' },
];

const COMMON_DINO_STATS: ConfigField[] = [
    { key: 'DinoCharacterHealthRecoveryMultiplier', label: 'Dino Health Recovery', type: 'number', section: 'ServerSettings', step: 0.1, min: 0.1, max: 10, defaultValue: '1.0', description: 'Dino health regeneration rate' },
    { key: 'DinoCharacterStaminaDrainMultiplier', label: 'Dino Stamina Drain', type: 'number', section: 'ServerSettings', step: 0.1, min: 0.1, max: 10, defaultValue: '1.0', description: 'How fast dinos lose stamina' },
    { key: 'DinoCharacterFoodDrainMultiplier', label: 'Dino Food Drain', type: 'number', section: 'ServerSettings', step: 0.1, min: 0.1, max: 10, defaultValue: '1.0', description: 'How fast dinos get hungry' },
    { key: 'DinoDamageMultiplier', label: 'Dino Damage', type: 'number', section: 'ServerSettings', step: 0.1, min: 0.1, max: 10, defaultValue: '1.0', description: 'Damage dealt by tamed dinos' },
    { key: 'DinoResistanceMultiplier', label: 'Dino Resistance', type: 'number', section: 'ServerSettings', step: 0.1, min: 0.1, max: 10, defaultValue: '1.0', description: 'Damage resistance for tamed dinos' },
    { key: 'DinoCountMultiplier', label: 'Dino Spawn Count', type: 'number', section: 'ServerSettings', step: 0.1, min: 0.1, max: 5, defaultValue: '1.0', description: 'Number of dinos that spawn' },
    { key: 'MaxPersonalTamedDinos', label: 'Max Tamed Dinos (Personal)', type: 'number', section: 'ServerSettings', min: 1, max: 10000, defaultValue: '500', description: 'Max dinos per player/tribe member' },
    { key: 'MaxTamedDinos', label: 'Max Tamed Dinos (Server)', type: 'number', section: 'ServerSettings', min: 1, max: 50000, defaultValue: '5000', description: 'Max total tamed dinos on server' },
];

const COMMON_HARVESTING: ConfigField[] = [
    { key: 'HarvestAmountMultiplier', label: 'Harvest Amount', type: 'number', section: 'ServerSettings', step: 0.1, min: 0.1, max: 100, defaultValue: '1.0', description: 'Resources gathered per action' },
    { key: 'HarvestHealthMultiplier', label: 'Harvest Node Health', type: 'number', section: 'ServerSettings', step: 0.1, min: 0.1, max: 10, defaultValue: '1.0', description: 'Health of harvestable nodes' },
    { key: 'ResourcesRespawnPeriodMultiplier', label: 'Resource Respawn Speed', type: 'number', section: 'ServerSettings', step: 0.1, min: 0.1, max: 10, defaultValue: '1.0', description: 'How fast resources respawn (lower = faster)' },
    { key: 'ClampResourceHarvestDamage', label: 'Clamp Resource Harvest Damage', type: 'boolean', section: 'ServerSettings', defaultValue: 'False', description: 'Limit damage dealt to harvestable resources' },
];

const COMMON_XP_LEVELING: ConfigField[] = [
    { key: 'XPMultiplier', label: 'XP Multiplier', type: 'number', section: 'ServerSettings', step: 0.1, min: 0.1, max: 100, defaultValue: '1.0', description: 'Experience gain rate' },
    { key: 'PlayerLevelCapMultiplier', label: 'Player Level Cap Multiplier', type: 'number', section: 'ServerSettings', step: 0.1, min: 1, max: 10, defaultValue: '1.0', description: 'Multiply the max player level' },
];

const COMMON_TAMING: ConfigField[] = [
    { key: 'TamingSpeedMultiplier', label: 'Taming Speed', type: 'number', section: 'ServerSettings', step: 0.1, min: 0.1, max: 100, defaultValue: '1.0', description: 'Speed of taming process' },
    { key: 'DinoTurretDamageMultiplier', label: 'Dino Turret Damage', type: 'number', section: 'ServerSettings', step: 0.1, min: 0.1, max: 10, defaultValue: '1.0', description: 'Damage from auto turrets to dinos' },
];

const COMMON_BREEDING: ConfigField[] = [
    { key: 'MatingIntervalMultiplier', label: 'Mating Interval', type: 'number', section: 'ServerSettings', step: 0.1, min: 0.01, max: 100, defaultValue: '1.0', description: 'Time between mating (lower = faster)' },
    { key: 'EggHatchSpeedMultiplier', label: 'Egg Hatch Speed', type: 'number', section: 'ServerSettings', step: 0.1, min: 0.01, max: 100, defaultValue: '1.0', description: 'How fast eggs hatch' },
    { key: 'BabyMatureSpeedMultiplier', label: 'Baby Mature Speed', type: 'number', section: 'ServerSettings', step: 0.1, min: 0.01, max: 100, defaultValue: '1.0', description: 'How fast babies grow up' },
    { key: 'BabyCuddleIntervalMultiplier', label: 'Cuddle Interval', type: 'number', section: 'ServerSettings', step: 0.1, min: 0.01, max: 100, defaultValue: '1.0', description: 'Time between imprint requests (lower = more frequent)' },
    { key: 'BabyCuddleGracePeriodMultiplier', label: 'Cuddle Grace Period', type: 'number', section: 'ServerSettings', step: 0.1, min: 0.1, max: 10, defaultValue: '1.0', description: 'Time allowed to complete cuddle' },
    { key: 'BabyCuddleLoseImprintQualitySpeedMultiplier', label: 'Cuddle Lose Imprint Speed', type: 'number', section: 'ServerSettings', step: 0.1, min: 0.1, max: 10, defaultValue: '1.0', description: 'Speed of losing imprint quality' },
    { key: 'BabyImprintingStatScaleMultiplier', label: 'Imprinting Stat Scale', type: 'number', section: 'ServerSettings', step: 0.1, min: 0.1, max: 10, defaultValue: '1.0', description: 'Bonus stats from imprinting' },
    { key: 'LayEggIntervalMultiplier', label: 'Lay Egg Interval', type: 'number', section: 'ServerSettings', step: 0.1, min: 0.1, max: 10, defaultValue: '1.0', description: 'Time between laying eggs (lower = more frequent)' },
];

const COMMON_ENVIRONMENT: ConfigField[] = [
    { key: 'DayCycleSpeedScale', label: 'Day Cycle Speed', type: 'number', section: 'ServerSettings', step: 0.1, min: 0.1, max: 10, defaultValue: '1.0', description: 'Speed of day/night cycle' },
    { key: 'DayTimeSpeedScale', label: 'Day Time Speed', type: 'number', section: 'ServerSettings', step: 0.1, min: 0.1, max: 10, defaultValue: '1.0', description: 'Speed of daytime passage' },
    { key: 'NightTimeSpeedScale', label: 'Night Time Speed', type: 'number', section: 'ServerSettings', step: 0.1, min: 0.1, max: 10, defaultValue: '1.0', description: 'Speed of nighttime passage' },
];

const COMMON_STRUCTURE: ConfigField[] = [
    { key: 'PvEStructureDecayPeriodMultiplier', label: 'Structure Decay Period (PvE)', type: 'number', section: 'ServerSettings', step: 0.1, min: 0, max: 100, defaultValue: '1.0', description: 'Time until structures decay in PvE (0 = disabled)' },
    { key: 'PvEStructureDecayDestructionPeriod', label: 'Structure Decay Destruction (PvE)', type: 'number', section: 'ServerSettings', step: 1, min: 0, max: 100000, defaultValue: '0', description: 'Time until decayed structures are destroyed' },
    { key: 'StructureDamageMultiplier', label: 'Structure Damage', type: 'number', section: 'ServerSettings', step: 0.1, min: 0.1, max: 10, defaultValue: '1.0', description: 'Damage dealt to structures' },
    { key: 'StructureResistanceMultiplier', label: 'Structure Resistance', type: 'number', section: 'ServerSettings', step: 0.1, min: 0.1, max: 10, defaultValue: '1.0', description: 'Damage resistance of structures' },
];

// --- ASE Specifics ---
export const ASE_GAME_USER_SETTINGS_SCHEMA: ConfigGroup[] = [
    {
        title: 'Server Identity & Access',
        description: 'Server name, passwords, and access control',
        icon: 'server',
        fields: [...COMMON_SERVER_SETTINGS]
    },
    {
        title: 'Gameplay Rules',
        description: 'Core gameplay settings and restrictions',
        icon: 'gamepad',
        fields: [
            ...COMMON_GAMEPLAY,
            { key: 'AllowCaveBuildingPvE', label: 'Allow Cave Building (PvE)', type: 'boolean', section: 'ServerSettings', defaultValue: 'False', description: 'Allow building in caves in PvE mode' },
            { key: 'AllowFlyerCarryPvE', label: 'Allow Flyer Carry (PvE)', type: 'boolean', section: 'ServerSettings', defaultValue: 'False', description: 'Allow flyers to carry players/dinos in PvE' },
            { key: 'DisableStructurePlacementCollision', label: 'Disable Structure Collision', type: 'boolean', section: 'ServerSettings', defaultValue: 'False', description: 'Allow structures to be placed with overlaps' },
        ]
    },
    {
        title: 'Difficulty & Limits',
        description: 'Server difficulty and various limits',
        icon: 'chart',
        fields: COMMON_DIFFICULTY
    },
    {
        title: 'Player Stats & Progression',
        description: 'Player character stats and leveling',
        icon: 'user',
        fields: [
            ...COMMON_PLAYER_STATS,
            ...COMMON_XP_LEVELING,
        ]
    },
    {
        title: 'Dino Settings',
        description: 'Dinosaur stats and spawning',
        icon: 'dragon',
        fields: COMMON_DINO_STATS
    },
    {
        title: 'Harvesting & Resources',
        description: 'Resource gathering and respawn rates',
        icon: 'pickaxe',
        fields: COMMON_HARVESTING
    },
    {
        title: 'Taming & Breeding',
        description: 'Taming speed and breeding settings',
        icon: 'heart',
        fields: [
            ...COMMON_TAMING,
            ...COMMON_BREEDING,
        ]
    },
    {
        title: 'Environment & Time',
        description: 'Day/night cycles and weather',
        icon: 'sun',
        fields: COMMON_ENVIRONMENT
    },
    {
        title: 'Structure Settings',
        description: 'Structure decay and damage settings',
        icon: 'building',
        fields: COMMON_STRUCTURE
    },
    {
        title: 'Upload/Download Rules',
        description: 'Prevent uploads and downloads',
        icon: 'cloud',
        fields: COMMON_PREVENTION
    }
];

// --- ASA Specifics ---
export const ASA_GAME_USER_SETTINGS_SCHEMA: ConfigGroup[] = [
    {
        title: 'Server Identity & Access',
        description: 'Server name, passwords, and RCON',
        icon: 'server',
        fields: [
            ...COMMON_SERVER_SETTINGS,
            { key: 'RCONEnabled', label: 'Enable RCON', type: 'boolean', section: 'ServerSettings', defaultValue: 'True', description: 'Enable remote console access' },
            { key: 'RCONPort', label: 'RCON Port', type: 'number', section: 'ServerSettings', defaultValue: '27020', min: 1024, max: 65535, description: 'Port for RCON connections' },
        ]
    },
    {
        title: 'Gameplay Rules',
        description: 'Core gameplay settings for ASA',
        icon: 'gamepad',
        fields: [
            ...COMMON_GAMEPLAY,
            { key: 'DisableStructurePlacementCollision', label: 'Disable Structure Collision', type: 'boolean', section: 'ServerSettings', defaultValue: 'False', description: 'Allow structures to be placed with overlaps' },
            { key: 'AllowAnyoneBabyImprintCuddle', label: 'Anyone Can Cuddle', type: 'boolean', section: 'ServerSettings', defaultValue: 'False', description: 'Allow any tribe member to imprint' },
            { key: 'DisableImprintDinoBuff', label: 'Disable Imprint Buff', type: 'boolean', section: 'ServerSettings', defaultValue: 'False', description: 'Disable stat bonuses from imprinting' },
        ]
    },
    {
        title: 'Difficulty & Limits',
        description: 'Server difficulty and various limits',
        icon: 'chart',
        fields: COMMON_DIFFICULTY
    },
    {
        title: 'Player Stats & Progression',
        description: 'Player character stats and leveling',
        icon: 'user',
        fields: [
            ...COMMON_PLAYER_STATS,
            ...COMMON_XP_LEVELING,
        ]
    },
    {
        title: 'Dino Settings',
        description: 'Dinosaur stats and spawning',
        icon: 'dragon',
        fields: COMMON_DINO_STATS
    },
    {
        title: 'Harvesting & Resources',
        description: 'Resource gathering and respawn rates',
        icon: 'pickaxe',
        fields: COMMON_HARVESTING
    },
    {
        title: 'Taming & Breeding',
        description: 'Taming speed and breeding settings',
        icon: 'heart',
        fields: [
            ...COMMON_TAMING,
            ...COMMON_BREEDING,
            { key: 'BabyImprintAmountMultiplier', label: 'Baby Imprint Amount', type: 'number', section: 'ServerSettings', step: 0.1, min: 0.1, max: 10, defaultValue: '1.0', description: 'Amount of imprint gained per cuddle' },
        ]
    },
    {
        title: 'Environment & Time',
        description: 'Day/night cycles and weather',
        icon: 'sun',
        fields: COMMON_ENVIRONMENT
    },
    {
        title: 'Structure Settings',
        description: 'Structure decay and damage settings',
        icon: 'building',
        fields: [
            ...COMMON_STRUCTURE,
            { key: 'DisableStructureDecayPvE', label: 'Disable Structure Decay (PvE)', type: 'boolean', section: 'ServerSettings', defaultValue: 'False', description: 'Completely disable structure decay in PvE' },
            { key: 'ForceAllStructureLocking', label: 'Force Structure Locking', type: 'boolean', section: 'ServerSettings', defaultValue: 'False', description: 'Automatically lock all structures' },
        ]
    },
    {
        title: 'Upload/Download Rules',
        description: 'Prevent uploads and downloads',
        icon: 'cloud',
        fields: [
            ...COMMON_PREVENTION,
            { key: 'EnableCryopodNerf', label: 'Enable Cryopod Nerf', type: 'boolean', section: 'ServerSettings', defaultValue: 'True', description: 'Apply cryopod sickness debuff' },
        ]
    }
];

// --- Game.ini (Largely shared, but separated for future proofing) ---

const COMMON_GAME_MULTIPLIERS: ConfigField[] = [
    { key: 'XPMultiplier', label: 'XP Multiplier', type: 'number', section: '/Script/ShooterGame.ShooterGameMode', step: 0.1, min: 0.1, max: 100, defaultValue: '1.0', description: 'Overall XP gain rate' },
    { key: 'TamingSpeedMultiplier', label: 'Taming Speed', type: 'number', section: '/Script/ShooterGame.ShooterGameMode', step: 0.1, min: 0.1, max: 100, defaultValue: '1.0', description: 'Taming process speed' },
    { key: 'HarvestAmountMultiplier', label: 'Harvest Amount', type: 'number', section: '/Script/ShooterGame.ShooterGameMode', step: 0.1, min: 0.1, max: 100, defaultValue: '1.0', description: 'Resources per harvest action' },
    { key: 'CaveDamageMultiplier', label: 'Cave Damage', type: 'number', section: '/Script/ShooterGame.ShooterGameMode', step: 0.1, min: 0.1, max: 10, defaultValue: '1.0', description: 'Damage multiplier inside caves' },
];

const COMMON_GAME_BREEDING: ConfigField[] = [
    { key: 'MatingIntervalMultiplier', label: 'Mating Interval', type: 'number', section: '/Script/ShooterGame.ShooterGameMode', step: 0.1, min: 0.01, max: 100, defaultValue: '1.0', description: 'Cooldown between mating' },
    { key: 'EggHatchSpeedMultiplier', label: 'Egg Hatch Speed', type: 'number', section: '/Script/ShooterGame.ShooterGameMode', step: 0.1, min: 0.01, max: 100, defaultValue: '1.0', description: 'Egg incubation speed' },
    { key: 'BabyMatureSpeedMultiplier', label: 'Baby Mature Speed', type: 'number', section: '/Script/ShooterGame.ShooterGameMode', step: 0.1, min: 0.01, max: 100, defaultValue: '1.0', description: 'Baby growth rate' },
    { key: 'BabyCuddleIntervalMultiplier', label: 'Cuddle Interval', type: 'number', section: '/Script/ShooterGame.ShooterGameMode', step: 0.1, min: 0.01, max: 100, defaultValue: '1.0', description: 'Time between cuddles' },
];

export const ASE_GAME_INI_SCHEMA: ConfigGroup[] = [
    {
        title: 'Core Multipliers',
        description: 'Essential game rate multipliers',
        icon: 'settings',
        fields: COMMON_GAME_MULTIPLIERS
    },
    {
        title: 'Breeding Settings',
        description: 'Breeding and maturation rates',
        icon: 'heart',
        fields: COMMON_GAME_BREEDING
    }
];

export const ASA_GAME_INI_SCHEMA: ConfigGroup[] = [
    {
        title: 'Core Multipliers',
        description: 'Essential game rate multipliers',
        icon: 'settings',
        fields: COMMON_GAME_MULTIPLIERS
    },
    {
        title: 'Breeding Settings',
        description: 'Breeding and maturation rates',
        icon: 'heart',
        fields: [
            ...COMMON_GAME_BREEDING,
            { key: 'BabyImprintAmountMultiplier', label: 'Baby Imprint Amount', type: 'number', section: '/Script/ShooterGame.ShooterGameMode', step: 0.1, min: 0.1, max: 10, defaultValue: '1.0', description: 'Imprint percentage per cuddle' },
        ]
    }
];

// Preset configurations
export interface ConfigPreset {
    name: string;
    description: string;
    settings: Record<string, Record<string, string>>;
}

export const CONFIG_PRESETS: ConfigPreset[] = [
    {
        name: 'Official Rates',
        description: 'Official server rates (1x everything)',
        settings: {
            ServerSettings: {
                XPMultiplier: '1.0',
                TamingSpeedMultiplier: '1.0',
                HarvestAmountMultiplier: '1.0',
                EggHatchSpeedMultiplier: '1.0',
                BabyMatureSpeedMultiplier: '1.0',
            }
        }
    },
    {
        name: 'Slightly Boosted (2x)',
        description: 'Slightly faster progression (2x rates)',
        settings: {
            ServerSettings: {
                XPMultiplier: '2.0',
                TamingSpeedMultiplier: '2.0',
                HarvestAmountMultiplier: '2.0',
                EggHatchSpeedMultiplier: '2.0',
                BabyMatureSpeedMultiplier: '2.0',
            }
        }
    },
    {
        name: 'Boosted (5x)',
        description: 'Faster progression for casual play (5x rates)',
        settings: {
            ServerSettings: {
                XPMultiplier: '5.0',
                TamingSpeedMultiplier: '5.0',
                HarvestAmountMultiplier: '5.0',
                EggHatchSpeedMultiplier: '10.0',
                BabyMatureSpeedMultiplier: '10.0',
                MatingIntervalMultiplier: '0.5',
            }
        }
    },
    {
        name: 'Highly Boosted (10x)',
        description: 'Very fast progression (10x rates)',
        settings: {
            ServerSettings: {
                XPMultiplier: '10.0',
                TamingSpeedMultiplier: '10.0',
                HarvestAmountMultiplier: '10.0',
                EggHatchSpeedMultiplier: '20.0',
                BabyMatureSpeedMultiplier: '20.0',
                MatingIntervalMultiplier: '0.2',
            }
        }
    },
    {
        name: 'PvP Focused',
        description: 'Balanced for PvP with faster rebuilding',
        settings: {
            ServerSettings: {
                ServerPVE: 'False',
                XPMultiplier: '3.0',
                TamingSpeedMultiplier: '5.0',
                HarvestAmountMultiplier: '3.0',
                StructureDamageMultiplier: '1.5',
                AllowThirdPersonPlayer: 'False',
                EnablePvPGamma: 'False',
            }
        }
    },
    {
        name: 'PvE Relaxed',
        description: 'Casual PvE experience',
        settings: {
            ServerSettings: {
                ServerPVE: 'True',
                XPMultiplier: '5.0',
                TamingSpeedMultiplier: '7.0',
                HarvestAmountMultiplier: '3.0',
                EggHatchSpeedMultiplier: '15.0',
                BabyMatureSpeedMultiplier: '15.0',
                AllowThirdPersonPlayer: 'True',
            }
        }
    }
];
