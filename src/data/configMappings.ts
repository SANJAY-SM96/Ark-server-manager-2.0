
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
    { key: 'NewMaxStructuresInRange', label: 'Max Structures in Range', type: 'number', section: 'ServerSettings', min: 1000, max: 100000, defaultValue: '6000', description: 'Maximum structures within build radius' },
    { key: 'StructurePreventResourceRadiusMultiplier', label: 'Structure Resource Radius', type: 'number', section: 'ServerSettings', step: 0.1, min: 0.1, max: 3, defaultValue: '1.0', description: 'Radius around structures where resources don\'t spawn' },
    { key: 'PlatformSaddleBuildAreaBoundsMultiplier', label: 'Platform Build Area', type: 'number', section: 'ServerSettings', step: 0.1, min: 0.1, max: 10, defaultValue: '1.0', description: 'Platform saddle build area size' },
    { key: 'PerPlatformMaxStructuresMultiplier', label: 'Platform Max Structures', type: 'number', section: 'ServerSettings', step: 0.1, min: 0.1, max: 10, defaultValue: '1.0', description: 'Max structures per platform' },
    { key: 'TribeSlotReplicationLimit', label: 'Tribe Slot Limit', type: 'number', section: 'ServerSettings', min: 0, max: 500, defaultValue: '0', description: 'Maximum tribe slots (0 = no limit)' },
    { key: 'AutoDestroyDecayedDinos', label: 'Auto Destroy Decayed Dinos', type: 'boolean', section: 'ServerSettings', defaultValue: 'False', description: 'Automatically destroy unclaimed dinos' },
];

// PvP Specific Settings
const COMMON_PVP_SETTINGS: ConfigField[] = [
    { key: 'PreventOfflinePvP', label: 'Offline Raid Protection (ORP)', type: 'boolean', section: 'ServerSettings', defaultValue: 'False', description: 'Enable offline raid protection' },
    { key: 'PreventOfflinePvPInterval', label: 'ORP Activation Delay', type: 'number', section: 'ServerSettings', min: 0, max: 3600, defaultValue: '900', description: 'Seconds until ORP activates after logout' },
    { key: 'bPvPDinoDecay', label: 'PvP Dino Decay', type: 'boolean', section: 'ServerSettings', defaultValue: 'False', description: 'Enable dino decay in PvP' },
    { key: 'bPvPStructureDecay', label: 'PvP Structure Decay', type: 'boolean', section: 'ServerSettings', defaultValue: 'False', description: 'Enable structure decay in PvP' },
    { key: 'PvPZoneStructureDamageMultiplier', label: 'PvP Zone Structure Damage', type: 'number', section: 'ServerSettings', step: 0.1, min: 0.1, max: 10, defaultValue: '1.0', description: 'Structure damage multiplier in PvP zones' },
    { key: 'PreventTribeAlliances', label: 'Prevent Tribe Alliances', type: 'boolean', section: 'ServerSettings', defaultValue: 'False', description: 'Disable tribe alliance system' },
    { key: 'AllowRaidDinoFeeding', label: 'Allow Raid Dino Feeding', type: 'boolean', section: 'ServerSettings', defaultValue: 'False', description: 'Allow feeding of Titanosaur/Raid dinos' },
    { key: 'RaidDinoCharacterFoodDrainMultiplier', label: 'Raid Dino Food Drain', type: 'number', section: 'ServerSettings', step: 0.1, min: 0.1, max: 10, defaultValue: '1.0', description: 'Food drain for raid dinos' },
];

// Admin & Server Management
const COMMON_ADMIN_SETTINGS: ConfigField[] = [
    { key: 'AdminLogging', label: 'Admin Logging', type: 'boolean', section: 'ServerSettings', defaultValue: 'False', description: 'Log all admin commands' },
    { key: 'AutoSavePeriodMinutes', label: 'Auto Save Interval (minutes)', type: 'number', section: 'ServerSettings', min: 1, max: 120, defaultValue: '15', description: 'Minutes between auto-saves' },
    { key: 'AllowHideDamageSourceFromLogs', label: 'Hide Damage Source in Logs', type: 'boolean', section: 'ServerSettings', defaultValue: 'False', description: 'Hide damage source from tribe logs' },
    { key: 'ShowFloatingDamageText', label: 'Show Floating Damage Text', type: 'boolean', section: 'ServerSettings', defaultValue: 'False', description: 'Display damage numbers' },
    { key: 'EnableDeathTeamSpectator', label: 'Death Team Spectator', type: 'boolean', section: 'ServerSettings', defaultValue: 'False', description: 'Spectate tribe mates after death' },
    { key: 'bDisableGenesisMissions', label: 'Disable Genesis Missions', type: 'boolean', section: 'ServerSettings', defaultValue: 'False', description: 'Disable Genesis map missions' },
    { key: 'AllowHitMarkers', label: 'Allow Hit Markers', type: 'boolean', section: 'ServerSettings', defaultValue: 'True', description: 'Show hit marker indicators' },
];

// Supply Drops & Loot
const COMMON_LOOT_SETTINGS: ConfigField[] = [
    { key: 'SupplyCrateLootQualityMultiplier', label: 'Supply Crate Quality', type: 'number', section: 'ServerSettings', step: 0.1, min: 0.1, max: 10, defaultValue: '1.0', description: 'Quality of items in supply drops' },
    { key: 'FishingLootQualityMultiplier', label: 'Fishing Loot Quality', type: 'number', section: 'ServerSettings', step: 0.1, min: 0.1, max: 10, defaultValue: '1.0', description: 'Quality of fishing rewards' },
    { key: 'CraftingSkillBonusMultiplier', label: 'Crafting Skill Bonus', type: 'number', section: 'ServerSettings', step: 0.1, min: 0.1, max: 10, defaultValue: '1.0', description: 'Crafting skill effectiveness' },
    { key: 'ItemStackSizeMultiplier', label: 'Item Stack Size', type: 'number', section: 'ServerSettings', step: 0.1, min: 1, max: 100, defaultValue: '1.0', description: 'Multiplier for stack sizes' },
    { key: 'ResourceNoReplenishRadiusStructures', label: 'Resource No-Spawn Radius', type: 'number', section: 'ServerSettings', step: 0.1, min: 0, max: 5, defaultValue: '1.0', description: 'Radius where resources don\'t respawn near structures' },
    { key: 'RandomSupplyCratePoints', label: 'Random Supply Crate Points', type: 'boolean', section: 'ServerSettings', defaultValue: 'False', description: 'Randomize supply drop locations' },
];

// Spoiling & Decay Timers
const COMMON_TIMERS: ConfigField[] = [
    { key: 'GlobalSpoilingTimeMultiplier', label: 'Spoiling Time', type: 'number', section: 'ServerSettings', step: 0.1, min: 0.1, max: 100, defaultValue: '1.0', description: 'How long items take to spoil (higher = longer)' },
    { key: 'GlobalItemDecompositionTimeMultiplier', label: 'Item Decomposition Time', type: 'number', section: 'ServerSettings', step: 0.1, min: 0.1, max: 100, defaultValue: '1.0', description: 'How long dropped items last' },
    { key: 'GlobalCorpseDecompositionTimeMultiplier', label: 'Corpse Decomposition Time', type: 'number', section: 'ServerSettings', step: 0.1, min: 0.1, max: 100, defaultValue: '1.0', description: 'How long corpses last' },
    { key: 'CropDecaySpeedMultiplier', label: 'Crop Decay Speed', type: 'number', section: 'ServerSettings', step: 0.1, min: 0.1, max: 10, defaultValue: '1.0', description: 'Speed of crop decay' },
    { key: 'CropGrowthSpeedMultiplier', label: 'Crop Growth Speed', type: 'number', section: 'ServerSettings', step: 0.1, min: 0.1, max: 10, defaultValue: '1.0', description: 'Speed of crop growth' },
    { key: 'DinoDecayPeriodMultiplier', label: 'Dino Decay Period', type: 'number', section: 'ServerSettings', step: 0.1, min: 0.1, max: 100, defaultValue: '1.0', description: 'Time until unclaimed dinos decay' },
    { key: 'PoopIntervalMultiplier', label: 'Poop Interval', type: 'number', section: 'ServerSettings', step: 0.1, min: 0.1, max: 10, defaultValue: '1.0', description: 'Dino poop frequency (lower = more poop)' },
];

// Engram & Crafting
const COMMON_ENGRAMS: ConfigField[] = [
    { key: 'bAutoUnlockAllEngrams', label: 'Auto Unlock All Engrams', type: 'boolean', section: 'ServerSettings', defaultValue: 'False', description: 'Automatically unlock all engrams' },
    { key: 'bAllowUnlimitedRespecs', label: 'Unlimited Respecs', type: 'boolean', section: 'ServerSettings', defaultValue: 'False', description: 'Allow unlimited mindwipes' },
    { key: 'bOnlyAllowSpecifiedEngrams', label: 'Only Specified Engrams', type: 'boolean', section: 'ServerSettings', defaultValue: 'False', description: 'Restrict to specified engrams only' },
    { key: 'UseCorpseLocator', label: 'Use Corpse Locator', type: 'boolean', section: 'ServerSettings', defaultValue: 'False', description: 'Enable corpse locator beam' },
];

// Flyer Settings
const COMMON_FLYER_SETTINGS: ConfigField[] = [
    { key: 'bFlyerPlatformAllowUnalignedDinoBasing', label: 'Flyer Platform Allow Unaligned Dinos', type: 'boolean', section: 'ServerSettings', defaultValue: 'False', description: 'Allow dinos on flyer platforms while moving' },
    { key: 'bDisablePhotoMode', label: 'Disable Photo Mode', type: 'boolean', section: 'ServerSettings', defaultValue: 'False', description: 'Disable the photo mode feature' },
    { key: 'AllowFlyingStaminaRecovery', label: 'Flying Stamina Recovery', type: 'boolean', section: 'ServerSettings', defaultValue: 'False', description: 'Allow stamina recovery while flying' },
    { key: 'OxygenSwimSpeedStatMultiplier', label: 'Oxygen Swim Speed', type: 'number', section: 'ServerSettings', step: 0.1, min: 0, max: 10, defaultValue: '1.0', description: 'Effect of oxygen on swim speed' },
];

// Wild Dino Settings  
const COMMON_WILD_DINO: ConfigField[] = [
    { key: 'WildDinoCharacterFoodDrainMultiplier', label: 'Wild Dino Food Drain', type: 'number', section: 'ServerSettings', step: 0.1, min: 0.1, max: 10, defaultValue: '1.0', description: 'Wild dino food consumption rate' },
    { key: 'WildDinoTorporDrainMultiplier', label: 'Wild Dino Torpor Drain', type: 'number', section: 'ServerSettings', step: 0.1, min: 0.1, max: 10, defaultValue: '1.0', description: 'Wild dino torpor drain rate' },
    { key: 'PassiveDefensesDamageRiderlessDinos', label: 'Passive Defense vs Riderless Dinos', type: 'boolean', section: 'ServerSettings', defaultValue: 'False', description: 'Passive defenses damage riderless dinos' },
    { key: 'DestroyUnconnectedWaterPipes', label: 'Destroy Unconnected Pipes', type: 'boolean', section: 'ServerSettings', defaultValue: 'False', description: 'Auto-destroy unconnected water pipes' },
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
        title: 'PvP & Raid Settings',
        description: 'PvP combat rules and offline raid protection',
        icon: 'sword',
        fields: COMMON_PVP_SETTINGS
    },
    {
        title: 'Admin & Server Management',
        description: 'Admin tools, logging, and auto-save',
        icon: 'shield',
        fields: COMMON_ADMIN_SETTINGS
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
        title: 'Wild Dino Behavior',
        description: 'Wild dino stats and behaviors',
        icon: 'paw',
        fields: COMMON_WILD_DINO
    },
    {
        title: 'Flyers & Movement',
        description: 'Flying creature settings and movement',
        icon: 'feather',
        fields: COMMON_FLYER_SETTINGS
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
        description: 'Structure decay, damage, and platform limits',
        icon: 'building',
        fields: COMMON_STRUCTURE
    },
    {
        title: 'Supply Drops & Loot',
        description: 'Loot quality and crafting bonuses',
        icon: 'gift',
        fields: COMMON_LOOT_SETTINGS
    },
    {
        title: 'Spoiling & Decay Timers',
        description: 'Item spoiling, corpse decay, and crops',
        icon: 'clock',
        fields: COMMON_TIMERS
    },
    {
        title: 'Engrams & Crafting',
        description: 'Engram unlocks and mindwipe options',
        icon: 'book',
        fields: COMMON_ENGRAMS
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
        title: 'PvP & Raid Settings',
        description: 'PvP combat rules and offline raid protection',
        icon: 'sword',
        fields: COMMON_PVP_SETTINGS
    },
    {
        title: 'Admin & Server Management',
        description: 'Admin tools, logging, and auto-save',
        icon: 'shield',
        fields: COMMON_ADMIN_SETTINGS
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
        title: 'Wild Dino Behavior',
        description: 'Wild dino stats and behaviors',
        icon: 'paw',
        fields: COMMON_WILD_DINO
    },
    {
        title: 'Flyers & Movement',
        description: 'Flying creature settings and movement',
        icon: 'feather',
        fields: COMMON_FLYER_SETTINGS
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
        description: 'Structure decay, damage, and platform limits',
        icon: 'building',
        fields: [
            ...COMMON_STRUCTURE,
            { key: 'DisableStructureDecayPvE', label: 'Disable Structure Decay (PvE)', type: 'boolean', section: 'ServerSettings', defaultValue: 'False', description: 'Completely disable structure decay in PvE' },
            { key: 'ForceAllStructureLocking', label: 'Force Structure Locking', type: 'boolean', section: 'ServerSettings', defaultValue: 'False', description: 'Automatically lock all structures' },
        ]
    },
    {
        title: 'Supply Drops & Loot',
        description: 'Loot quality and crafting bonuses',
        icon: 'gift',
        fields: COMMON_LOOT_SETTINGS
    },
    {
        title: 'Spoiling & Decay Timers',
        description: 'Item spoiling, corpse decay, and crops',
        icon: 'clock',
        fields: COMMON_TIMERS
    },
    {
        title: 'Engrams & Crafting',
        description: 'Engram unlocks and mindwipe options',
        icon: 'book',
        fields: COMMON_ENGRAMS
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
    { key: 'KillXPMultiplier', label: 'Kill XP Multiplier', type: 'number', section: '/Script/ShooterGame.ShooterGameMode', step: 0.1, min: 0.1, max: 100, defaultValue: '1.0', description: 'XP gained from kills' },
    { key: 'HarvestXPMultiplier', label: 'Harvest XP Multiplier', type: 'number', section: '/Script/ShooterGame.ShooterGameMode', step: 0.1, min: 0.1, max: 100, defaultValue: '1.0', description: 'XP gained from harvesting' },
    { key: 'CraftXPMultiplier', label: 'Craft XP Multiplier', type: 'number', section: '/Script/ShooterGame.ShooterGameMode', step: 0.1, min: 0.1, max: 100, defaultValue: '1.0', description: 'XP gained from crafting' },
    { key: 'GenericXPMultiplier', label: 'Generic XP Multiplier', type: 'number', section: '/Script/ShooterGame.ShooterGameMode', step: 0.1, min: 0.1, max: 100, defaultValue: '1.0', description: 'XP from misc actions' },
    { key: 'SpecialXPMultiplier', label: 'Special XP Multiplier', type: 'number', section: '/Script/ShooterGame.ShooterGameMode', step: 0.1, min: 0.1, max: 100, defaultValue: '1.0', description: 'XP from explorer notes, etc.' },
];

const COMMON_GAME_BREEDING: ConfigField[] = [
    { key: 'MatingIntervalMultiplier', label: 'Mating Interval', type: 'number', section: '/Script/ShooterGame.ShooterGameMode', step: 0.1, min: 0.01, max: 100, defaultValue: '1.0', description: 'Cooldown between mating' },
    { key: 'EggHatchSpeedMultiplier', label: 'Egg Hatch Speed', type: 'number', section: '/Script/ShooterGame.ShooterGameMode', step: 0.1, min: 0.01, max: 100, defaultValue: '1.0', description: 'Egg incubation speed' },
    { key: 'BabyMatureSpeedMultiplier', label: 'Baby Mature Speed', type: 'number', section: '/Script/ShooterGame.ShooterGameMode', step: 0.1, min: 0.01, max: 100, defaultValue: '1.0', description: 'Baby growth rate' },
    { key: 'BabyCuddleIntervalMultiplier', label: 'Cuddle Interval', type: 'number', section: '/Script/ShooterGame.ShooterGameMode', step: 0.1, min: 0.01, max: 100, defaultValue: '1.0', description: 'Time between cuddles' },
    { key: 'BabyCuddleGracePeriodMultiplier', label: 'Cuddle Grace Period', type: 'number', section: '/Script/ShooterGame.ShooterGameMode', step: 0.1, min: 0.1, max: 10, defaultValue: '1.0', description: 'Time allowed for cuddle' },
    { key: 'BabyCuddleLoseImprintQualitySpeedMultiplier', label: 'Imprint Loss Speed', type: 'number', section: '/Script/ShooterGame.ShooterGameMode', step: 0.1, min: 0.1, max: 10, defaultValue: '1.0', description: 'Speed of losing imprint' },
    { key: 'BabyImprintingStatScaleMultiplier', label: 'Imprinting Stat Scale', type: 'number', section: '/Script/ShooterGame.ShooterGameMode', step: 0.1, min: 0.1, max: 10, defaultValue: '1.0', description: 'Stat bonus from imprinting' },
    { key: 'BabyFoodConsumptionSpeedMultiplier', label: 'Baby Food Consumption', type: 'number', section: '/Script/ShooterGame.ShooterGameMode', step: 0.1, min: 0.01, max: 10, defaultValue: '1.0', description: 'Baby food drain rate' },
];

// Player Per-Level Stat Multipliers
const GAME_PLAYER_STATS: ConfigField[] = [
    { key: 'PerLevelStatsMultiplier_Player[0]', label: 'Health per Level (Player)', type: 'number', section: '/Script/ShooterGame.ShooterGameMode', step: 0.1, min: 0.1, max: 10, defaultValue: '1.0', description: 'Health gained per level' },
    { key: 'PerLevelStatsMultiplier_Player[1]', label: 'Stamina per Level (Player)', type: 'number', section: '/Script/ShooterGame.ShooterGameMode', step: 0.1, min: 0.1, max: 10, defaultValue: '1.0', description: 'Stamina gained per level' },
    { key: 'PerLevelStatsMultiplier_Player[2]', label: 'Torpidity per Level (Player)', type: 'number', section: '/Script/ShooterGame.ShooterGameMode', step: 0.1, min: 0.1, max: 10, defaultValue: '1.0', description: 'Torpidity per level' },
    { key: 'PerLevelStatsMultiplier_Player[3]', label: 'Oxygen per Level (Player)', type: 'number', section: '/Script/ShooterGame.ShooterGameMode', step: 0.1, min: 0.1, max: 10, defaultValue: '1.0', description: 'Oxygen gained per level' },
    { key: 'PerLevelStatsMultiplier_Player[4]', label: 'Food per Level (Player)', type: 'number', section: '/Script/ShooterGame.ShooterGameMode', step: 0.1, min: 0.1, max: 10, defaultValue: '1.0', description: 'Food capacity per level' },
    { key: 'PerLevelStatsMultiplier_Player[5]', label: 'Water per Level (Player)', type: 'number', section: '/Script/ShooterGame.ShooterGameMode', step: 0.1, min: 0.1, max: 10, defaultValue: '1.0', description: 'Water capacity per level' },
    { key: 'PerLevelStatsMultiplier_Player[7]', label: 'Weight per Level (Player)', type: 'number', section: '/Script/ShooterGame.ShooterGameMode', step: 0.1, min: 0.1, max: 10, defaultValue: '1.0', description: 'Weight capacity per level' },
    { key: 'PerLevelStatsMultiplier_Player[8]', label: 'Melee per Level (Player)', type: 'number', section: '/Script/ShooterGame.ShooterGameMode', step: 0.1, min: 0.1, max: 10, defaultValue: '1.0', description: 'Melee damage per level' },
    { key: 'PerLevelStatsMultiplier_Player[9]', label: 'Speed per Level (Player)', type: 'number', section: '/Script/ShooterGame.ShooterGameMode', step: 0.1, min: 0.1, max: 10, defaultValue: '1.0', description: 'Speed increase per level' },
    { key: 'PerLevelStatsMultiplier_Player[10]', label: 'Fortitude per Level (Player)', type: 'number', section: '/Script/ShooterGame.ShooterGameMode', step: 0.1, min: 0.1, max: 10, defaultValue: '1.0', description: 'Fortitude per level' },
    { key: 'PerLevelStatsMultiplier_Player[11]', label: 'Crafting per Level (Player)', type: 'number', section: '/Script/ShooterGame.ShooterGameMode', step: 0.1, min: 0.1, max: 10, defaultValue: '1.0', description: 'Crafting skill per level' },
];

// Tamed Dino Per-Level Stat Multipliers
const GAME_DINO_TAMED_STATS: ConfigField[] = [
    { key: 'PerLevelStatsMultiplier_DinoTamed[0]', label: 'Health per Level (Tamed)', type: 'number', section: '/Script/ShooterGame.ShooterGameMode', step: 0.1, min: 0.1, max: 10, defaultValue: '1.0', description: 'Tamed dino health per level' },
    { key: 'PerLevelStatsMultiplier_DinoTamed[1]', label: 'Stamina per Level (Tamed)', type: 'number', section: '/Script/ShooterGame.ShooterGameMode', step: 0.1, min: 0.1, max: 10, defaultValue: '1.0', description: 'Tamed dino stamina per level' },
    { key: 'PerLevelStatsMultiplier_DinoTamed[3]', label: 'Oxygen per Level (Tamed)', type: 'number', section: '/Script/ShooterGame.ShooterGameMode', step: 0.1, min: 0.1, max: 10, defaultValue: '1.0', description: 'Tamed dino oxygen per level' },
    { key: 'PerLevelStatsMultiplier_DinoTamed[4]', label: 'Food per Level (Tamed)', type: 'number', section: '/Script/ShooterGame.ShooterGameMode', step: 0.1, min: 0.1, max: 10, defaultValue: '1.0', description: 'Tamed dino food per level' },
    { key: 'PerLevelStatsMultiplier_DinoTamed[7]', label: 'Weight per Level (Tamed)', type: 'number', section: '/Script/ShooterGame.ShooterGameMode', step: 0.1, min: 0.1, max: 10, defaultValue: '1.0', description: 'Tamed dino weight per level' },
    { key: 'PerLevelStatsMultiplier_DinoTamed[8]', label: 'Melee per Level (Tamed)', type: 'number', section: '/Script/ShooterGame.ShooterGameMode', step: 0.1, min: 0.1, max: 10, defaultValue: '1.0', description: 'Tamed dino melee per level' },
    { key: 'PerLevelStatsMultiplier_DinoTamed[9]', label: 'Speed per Level (Tamed)', type: 'number', section: '/Script/ShooterGame.ShooterGameMode', step: 0.1, min: 0.1, max: 10, defaultValue: '1.0', description: 'Tamed dino speed per level' },
];

// Wild Dino Per-Level Stat Multipliers
const GAME_DINO_WILD_STATS: ConfigField[] = [
    { key: 'PerLevelStatsMultiplier_DinoWild[0]', label: 'Health per Level (Wild)', type: 'number', section: '/Script/ShooterGame.ShooterGameMode', step: 0.1, min: 0.1, max: 10, defaultValue: '1.0', description: 'Wild dino health per level' },
    { key: 'PerLevelStatsMultiplier_DinoWild[1]', label: 'Stamina per Level (Wild)', type: 'number', section: '/Script/ShooterGame.ShooterGameMode', step: 0.1, min: 0.1, max: 10, defaultValue: '1.0', description: 'Wild dino stamina per level' },
    { key: 'PerLevelStatsMultiplier_DinoWild[3]', label: 'Oxygen per Level (Wild)', type: 'number', section: '/Script/ShooterGame.ShooterGameMode', step: 0.1, min: 0.1, max: 10, defaultValue: '1.0', description: 'Wild dino oxygen per level' },
    { key: 'PerLevelStatsMultiplier_DinoWild[4]', label: 'Food per Level (Wild)', type: 'number', section: '/Script/ShooterGame.ShooterGameMode', step: 0.1, min: 0.1, max: 10, defaultValue: '1.0', description: 'Wild dino food per level' },
    { key: 'PerLevelStatsMultiplier_DinoWild[7]', label: 'Weight per Level (Wild)', type: 'number', section: '/Script/ShooterGame.ShooterGameMode', step: 0.1, min: 0.1, max: 10, defaultValue: '1.0', description: 'Wild dino weight per level' },
    { key: 'PerLevelStatsMultiplier_DinoWild[8]', label: 'Melee per Level (Wild)', type: 'number', section: '/Script/ShooterGame.ShooterGameMode', step: 0.1, min: 0.1, max: 10, defaultValue: '1.0', description: 'Wild dino melee per level' },
];

// Advanced Game.ini Options
const GAME_ADVANCED_OPTIONS: ConfigField[] = [
    { key: 'bAllowCustomRecipes', label: 'Allow Custom Recipes', type: 'boolean', section: '/Script/ShooterGame.ShooterGameMode', defaultValue: 'True', description: 'Allow players to create custom recipes' },
    { key: 'bPassiveDefensesDamageRiderlessDinos', label: 'Turrets Damage Riderless Dinos', type: 'boolean', section: '/Script/ShooterGame.ShooterGameMode', defaultValue: 'False', description: 'Auto-turrets damage unclaimed dinos' },
    { key: 'bDisableFriendlyFire', label: 'Disable Friendly Fire', type: 'boolean', section: '/Script/ShooterGame.ShooterGameMode', defaultValue: 'False', description: 'Prevent damage to tribe mates' },
    { key: 'bPvEDisableFriendlyFire', label: 'PvE Disable Friendly Fire', type: 'boolean', section: '/Script/ShooterGame.ShooterGameMode', defaultValue: 'False', description: 'Prevent friendly fire in PvE' },
    { key: 'bAllowUnlimitedRespecs', label: 'Unlimited Respecs', type: 'boolean', section: '/Script/ShooterGame.ShooterGameMode', defaultValue: 'False', description: 'Allow unlimited mindwipes' },
    { key: 'MaxNumberOfPlayersInTribe', label: 'Max Players per Tribe', type: 'number', section: '/Script/ShooterGame.ShooterGameMode', min: 1, max: 500, defaultValue: '0', description: 'Max tribe size (0 = no limit)' },
    { key: 'GlobalPoweredBatteryDurabilityDecreasePerSecond', label: 'Battery Drain Rate', type: 'number', section: '/Script/ShooterGame.ShooterGameMode', step: 0.01, min: 0, max: 10, defaultValue: '4.0', description: 'Battery power drain per second' },
    { key: 'FuelConsumptionIntervalMultiplier', label: 'Fuel Consumption Rate', type: 'number', section: '/Script/ShooterGame.ShooterGameMode', step: 0.1, min: 0.1, max: 10, defaultValue: '1.0', description: 'Fuel consumption multiplier' },
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
    },
    {
        title: 'Player Stats Per Level',
        description: 'Stats gained per level for players',
        icon: 'user',
        fields: GAME_PLAYER_STATS
    },
    {
        title: 'Tamed Dino Stats Per Level',
        description: 'Stats gained per level for tamed dinos',
        icon: 'dragon',
        fields: GAME_DINO_TAMED_STATS
    },
    {
        title: 'Wild Dino Stats Per Level',
        description: 'Stats per level for wild dinos',
        icon: 'paw',
        fields: GAME_DINO_WILD_STATS
    },
    {
        title: 'Advanced Options',
        description: 'Friendly fire, recipes, and misc settings',
        icon: 'cog',
        fields: GAME_ADVANCED_OPTIONS
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
    },
    {
        title: 'Player Stats Per Level',
        description: 'Stats gained per level for players',
        icon: 'user',
        fields: GAME_PLAYER_STATS
    },
    {
        title: 'Tamed Dino Stats Per Level',
        description: 'Stats gained per level for tamed dinos',
        icon: 'dragon',
        fields: GAME_DINO_TAMED_STATS
    },
    {
        title: 'Wild Dino Stats Per Level',
        description: 'Stats per level for wild dinos',
        icon: 'paw',
        fields: GAME_DINO_WILD_STATS
    },
    {
        title: 'Advanced Options',
        description: 'Friendly fire, recipes, and misc settings',
        icon: 'cog',
        fields: GAME_ADVANCED_OPTIONS
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
