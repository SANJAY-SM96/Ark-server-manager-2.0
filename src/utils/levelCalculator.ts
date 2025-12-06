// Level Calculator Utilities for ARK Server Configuration
// Generates XP curves, level progression, and engram points

export interface LevelPreset {
    name: string;
    description: string;
    maxWildLevel: number;
    maxTamedLevels: number; // Additional levels after taming
    maxPlayerLevel: number;
    difficultyOffset: number;
    overrideOfficialDifficulty: number;
}

export interface XPEntry {
    level: number;
    xpForLevel: number;
    totalXP: number;
}

export interface GeneratedLevelConfig {
    playerLevels: XPEntry[];
    dinoLevels: XPEntry[];
    overrideMaxExperiencePointsPlayer: number;
    overrideMaxExperiencePointsDino: number;
    engramPoints: number[];
    iniCode: string;
}

// Standard level presets
export const LEVEL_PRESETS: LevelPreset[] = [
    {
        name: 'Default (150)',
        description: 'Official ARK settings with max wild level 150',
        maxWildLevel: 150,
        maxTamedLevels: 88,
        maxPlayerLevel: 105,
        difficultyOffset: 1.0,
        overrideOfficialDifficulty: 5.0
    },
    {
        name: 'Boosted (200)',
        description: 'Slightly boosted with max wild level 200',
        maxWildLevel: 200,
        maxTamedLevels: 88,
        maxPlayerLevel: 135,
        difficultyOffset: 1.0,
        overrideOfficialDifficulty: 6.67
    },
    {
        name: 'High (300)',
        description: 'High difficulty with max wild level 300',
        maxWildLevel: 300,
        maxTamedLevels: 100,
        maxPlayerLevel: 155,
        difficultyOffset: 1.0,
        overrideOfficialDifficulty: 10.0
    },
    {
        name: 'Extreme (600)',
        description: 'Extreme difficulty with max wild level 600',
        maxWildLevel: 600,
        maxTamedLevels: 150,
        maxPlayerLevel: 200,
        difficultyOffset: 1.0,
        overrideOfficialDifficulty: 20.0
    },
    {
        name: 'Ultra (800)',
        description: 'Ultra difficulty with max wild level 800',
        maxWildLevel: 800,
        maxTamedLevels: 180,
        maxPlayerLevel: 250,
        difficultyOffset: 1.0,
        overrideOfficialDifficulty: 26.67
    },
    {
        name: 'Maximum (1000)',
        description: 'Maximum difficulty with max wild level 1000',
        maxWildLevel: 1000,
        maxTamedLevels: 200,
        maxPlayerLevel: 300,
        difficultyOffset: 1.0,
        overrideOfficialDifficulty: 33.34
    }
];

export type XPCurveType = 'linear' | 'exponential' | 'official' | 'flat';

// Base XP values for official ARK progression (first 30 levels as reference)
const OFFICIAL_PLAYER_XP = [
    0, 5, 20, 40, 70, 120, 190, 270, 380, 530,
    700, 900, 1150, 1450, 1800, 2200, 2650, 3150, 3700, 4350,
    5050, 5800, 6600, 7500, 8500, 9600, 10800, 12100, 13500, 15000
];

/**
 * Calculate XP required for a specific level using different curve types
 */
export function calculateXPForLevel(
    level: number,
    curveType: XPCurveType,
    baseXPMultiplier: number = 1.0
): number {
    switch (curveType) {
        case 'linear':
            // Linear progression: XP = level * 100 * multiplier
            return Math.floor(level * 100 * baseXPMultiplier);

        case 'exponential':
            // Exponential curve: XP = (level^2.1) * 10 * multiplier
            return Math.floor(Math.pow(level, 2.1) * 10 * baseXPMultiplier);

        case 'flat':
            // Flat rate: same XP for each level
            return Math.floor(500 * baseXPMultiplier);

        case 'official':
        default:
            // Use official curve pattern, extrapolate beyond known values
            if (level < OFFICIAL_PLAYER_XP.length) {
                return Math.floor(OFFICIAL_PLAYER_XP[level] * baseXPMultiplier);
            }
            // Extrapolate for higher levels using a growth formula
            const lastKnown = OFFICIAL_PLAYER_XP[OFFICIAL_PLAYER_XP.length - 1];
            const growthRate = 1.12;
            const extraLevels = level - OFFICIAL_PLAYER_XP.length + 1;
            return Math.floor(lastKnown * Math.pow(growthRate, extraLevels) * baseXPMultiplier);
    }
}

/**
 * Generate full XP progression for player or dino
 */
export function generateXPProgression(
    maxLevel: number,
    curveType: XPCurveType,
    xpMultiplier: number = 1.0
): XPEntry[] {
    const entries: XPEntry[] = [];
    let totalXP = 0;

    for (let level = 1; level <= maxLevel; level++) {
        const xpForLevel = calculateXPForLevel(level, curveType, xpMultiplier);
        totalXP += xpForLevel;
        entries.push({
            level,
            xpForLevel,
            totalXP
        });
    }

    return entries;
}

/**
 * Generate engram points per level
 */
export function generateEngramPoints(
    maxLevel: number,
    startingPoints: number = 8,
    growthRate: number = 1.1
): number[] {
    const points: number[] = [];

    for (let level = 1; level <= maxLevel; level++) {
        if (level <= 10) {
            points.push(startingPoints);
        } else if (level <= 30) {
            points.push(Math.floor(startingPoints * 1.5));
        } else if (level <= 60) {
            points.push(Math.floor(startingPoints * 2));
        } else if (level <= 100) {
            points.push(Math.floor(startingPoints * 3));
        } else {
            points.push(Math.floor(startingPoints * 4 * Math.pow(growthRate, (level - 100) / 50)));
        }
    }

    return points;
}

/**
 * Generate complete level configuration based on preset
 */
export function generateLevelConfig(
    preset: LevelPreset,
    playerCurve: XPCurveType = 'official',
    dinoCurve: XPCurveType = 'official',
    xpMultiplier: number = 1.0
): GeneratedLevelConfig {
    const playerLevels = generateXPProgression(preset.maxPlayerLevel, playerCurve, xpMultiplier);
    const totalDinoLevels = preset.maxWildLevel + preset.maxTamedLevels;
    const dinoLevels = generateXPProgression(totalDinoLevels, dinoCurve, xpMultiplier);
    const engramPoints = generateEngramPoints(preset.maxPlayerLevel);

    const overrideMaxExperiencePointsPlayer = playerLevels[playerLevels.length - 1]?.totalXP || 0;
    const overrideMaxExperiencePointsDino = dinoLevels[dinoLevels.length - 1]?.totalXP || 0;

    const iniCode = generateINICode({
        playerLevels,
        dinoLevels,
        overrideMaxExperiencePointsPlayer,
        overrideMaxExperiencePointsDino,
        engramPoints,
        iniCode: ''
    }, preset);

    return {
        playerLevels,
        dinoLevels,
        overrideMaxExperiencePointsPlayer,
        overrideMaxExperiencePointsDino,
        engramPoints,
        iniCode
    };
}

/**
 * Generate INI code for level configuration
 */
export function generateINICode(
    config: GeneratedLevelConfig,
    preset: LevelPreset
): string {
    const lines: string[] = [
        '[/script/shootergame.shootergamemode]',
        '',
        '; === Max Level Settings ===',
        `OverrideMaxExperiencePointsPlayer=${config.overrideMaxExperiencePointsPlayer}`,
        `OverrideMaxExperiencePointsDino=${config.overrideMaxExperiencePointsDino}`,
        '',
        '; === Player Level XP Requirements ===',
    ];

    // Generate LevelExperienceRampOverrides for players
    config.playerLevels.forEach((entry) => {
        lines.push(`LevelExperienceRampOverrides=(ExperiencePointsForLevel=${entry.xpForLevel},Alpha=1.0)`);
    });

    lines.push('');
    lines.push('; === Dino Level XP Requirements ===');

    // Generate LevelExperienceRampOverrides for dinos
    config.dinoLevels.forEach((entry) => {
        lines.push(`LevelExperienceRampOverrides=(ExperiencePointsForLevel=${entry.xpForLevel},Alpha=1.0)`);
    });

    lines.push('');
    lines.push('; === Engram Points Per Level ===');

    // Generate engram points
    config.engramPoints.forEach(points => {
        lines.push(`OverridePlayerLevelEngramPoints=${points}`);
    });

    lines.push('');
    lines.push('; === GameUserSettings.ini Difficulty Settings ===');
    lines.push('; Add these to your GameUserSettings.ini under [ServerSettings]:');
    lines.push(`; DifficultyOffset=${preset.difficultyOffset}`);
    lines.push(`; OverrideOfficialDifficulty=${preset.overrideOfficialDifficulty}`);

    return lines.join('\n');
}

/**
 * Parse existing level entries from INI content
 */
export function parseLevelEntries(iniContent: string): XPEntry[] {
    const entries: XPEntry[] = [];
    const regex = /LevelExperienceRampOverrides=\(ExperiencePointsForLevel=(\d+)/g;
    let match;
    let level = 1;
    let totalXP = 0;

    while ((match = regex.exec(iniContent)) !== null) {
        const xpForLevel = parseInt(match[1], 10);
        totalXP += xpForLevel;
        entries.push({
            level: level++,
            xpForLevel,
            totalXP
        });
    }

    return entries;
}

/**
 * Format large numbers with commas
 */
export function formatNumber(num: number): string {
    return num.toLocaleString();
}

/**
 * Calculate difficulty offset for desired max wild level
 */
export function calculateDifficultyForLevel(desiredMaxLevel: number): {
    difficultyOffset: number;
    overrideOfficialDifficulty: number;
} {
    // Max wild level = 30 * OverrideOfficialDifficulty
    const overrideOfficialDifficulty = Math.ceil((desiredMaxLevel / 30) * 100) / 100;

    return {
        difficultyOffset: 1.0,
        overrideOfficialDifficulty: Math.max(1, overrideOfficialDifficulty)
    };
}
