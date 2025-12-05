

const AI_RECOMMENDATIONS_CONFIG = {
    pve: [
        { setting: 'XPMultiplier', value: 2, reason: 'Faster progression for casual players' },
        { setting: 'TamingSpeedMultiplier', value: 3, reason: 'Reduced taming time' },
        { setting: 'HarvestAmountMultiplier', value: 2, reason: 'More resources per gather' },
        { setting: 'ServerPVE', value: true, reason: 'No player combat' },
    ],
    pvp: [
        { setting: 'XPMultiplier', value: 1, reason: 'Balanced PvP experience' },
        { setting: 'TamingSpeedMultiplier', value: 1.5, reason: 'Moderate taming for PvP' },
        { setting: 'HarvestAmountMultiplier', value: 1.5, reason: 'Competitive resources' },
        { setting: 'ServerPVE', value: false, reason: 'PvP enabled' },
    ],
};

export { AI_RECOMMENDATIONS_CONFIG };
