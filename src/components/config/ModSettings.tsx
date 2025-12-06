import { useState, useEffect } from 'react';
import {
    Package, Settings, Plus, Trash2, Save, RotateCcw,
    ChevronDown, ChevronUp, Search, X, Info, AlertCircle
} from 'lucide-react';
import { cn } from '../../utils/helpers';
import toast from 'react-hot-toast';

// Popular mod configurations with their common settings
export interface ModConfig {
    id: string;
    name: string;
    steamId?: string;
    description: string;
    settings: ModSetting[];
}

export interface ModSetting {
    key: string;
    label: string;
    type: 'number' | 'boolean' | 'string' | 'select';
    defaultValue: string;
    description: string;
    options?: { label: string; value: string }[];
    min?: number;
    max?: number;
    step?: number;
}

// Popular mod configurations
export const POPULAR_MODS: ModConfig[] = [
    {
        id: 'structures_plus',
        name: 'Structures Plus (S+)',
        steamId: '731604991',
        description: 'Advanced building mod with enhanced structures',
        settings: [
            {
                key: 'StructurePickupTime',
                label: 'Structure Pickup Time',
                type: 'number',
                defaultValue: '30',
                description: 'Seconds allowed to pick up placed structures (0 = disabled)',
                min: 0,
                max: 3600
            },
            {
                key: 'DisablePickupWhenDamaged',
                label: 'Disable Pickup When Damaged',
                type: 'boolean',
                defaultValue: 'True',
                description: 'Prevent picking up damaged structures'
            },
            {
                key: 'AllowIntegratedSPlusandVanilla',
                label: 'Allow Integrated S+ and Vanilla',
                type: 'boolean',
                defaultValue: 'True',
                description: 'Allow both S+ and vanilla structure types'
            },
            {
                key: 'StackSizeMultiplier',
                label: 'Stack Size Multiplier',
                type: 'number',
                defaultValue: '1',
                description: 'Multiplier for item stack sizes',
                min: 1,
                max: 100
            }
        ]
    },
    {
        id: 'awesome_spyglass',
        name: 'Awesome Spyglass',
        steamId: '1404697612',
        description: 'Enhanced spyglass showing dino stats',
        settings: [
            {
                key: 'AwesomeSpyglassRange',
                label: 'Spyglass Range',
                type: 'number',
                defaultValue: '10000',
                description: 'Maximum range for spyglass detection',
                min: 1000,
                max: 50000
            },
            {
                key: 'ShowWildStats',
                label: 'Show Wild Dino Stats',
                type: 'boolean',
                defaultValue: 'True',
                description: 'Display stats for wild dinosaurs'
            },
            {
                key: 'ShowTamedStats',
                label: 'Show Tamed Dino Stats',
                type: 'boolean',
                defaultValue: 'True',
                description: 'Display stats for tamed dinosaurs'
            }
        ]
    },
    {
        id: 'super_spyglass',
        name: 'Super Spyglass',
        steamId: '793605978',
        description: 'View dino levels, stats, and colors',
        settings: [
            {
                key: 'SuperSpyglassShowLevel',
                label: 'Show Level',
                type: 'boolean',
                defaultValue: 'True',
                description: 'Display creature level'
            },
            {
                key: 'SuperSpyglassShowColors',
                label: 'Show Colors',
                type: 'boolean',
                defaultValue: 'True',
                description: 'Display creature color regions'
            }
        ]
    },
    {
        id: 'dino_storage',
        name: 'Dino Storage v2',
        steamId: '1609138312',
        description: 'Store dinos as soul balls',
        settings: [
            {
                key: 'DinoStorageSoulTrapMaxLevel',
                label: 'Max Trap Level',
                type: 'number',
                defaultValue: '450',
                description: 'Maximum dino level that can be stored',
                min: 1,
                max: 1000
            },
            {
                key: 'DinoStorageAllowWild',
                label: 'Allow Wild Capture',
                type: 'boolean',
                defaultValue: 'False',
                description: 'Allow capturing wild dinosaurs'
            },
            {
                key: 'DinoStorageCooldown',
                label: 'Release Cooldown',
                type: 'number',
                defaultValue: '0',
                description: 'Cooldown in seconds after releasing a dino',
                min: 0,
                max: 3600
            }
        ]
    },
    {
        id: 'kraken_better_dinos',
        name: "Kraken's Better Dinos",
        steamId: '1565015734',
        description: 'Enhanced dino abilities and behaviors',
        settings: [
            {
                key: 'KBDDinoHarvestMultiplier',
                label: 'Dino Harvest Multiplier',
                type: 'number',
                defaultValue: '1.0',
                description: 'Multiplier for dino harvesting',
                min: 0.1,
                max: 10,
                step: 0.1
            },
            {
                key: 'KBDDamageMultiplier',
                label: 'Dino Damage Multiplier',
                type: 'number',
                defaultValue: '1.0',
                description: 'Multiplier for dino damage',
                min: 0.1,
                max: 10,
                step: 0.1
            }
        ]
    },
    {
        id: 'stack_mod',
        name: 'ARK Additions: Stacking Mod',
        steamId: '1998020277',
        description: 'Configurable stack sizes for items',
        settings: [
            {
                key: 'ConfigOverrideItemMaxQuantity',
                label: 'Global Stack Multiplier',
                type: 'number',
                defaultValue: '1',
                description: 'Global multiplier for all stack sizes',
                min: 1,
                max: 1000
            },
            {
                key: 'ResourceStackMultiplier',
                label: 'Resource Stack Multiplier',
                type: 'number',
                defaultValue: '1',
                description: 'Multiplier for resource stack sizes',
                min: 1,
                max: 1000
            }
        ]
    },
    {
        id: 'hg_stacking',
        name: 'HG Stacking Mod 10000-90',
        steamId: '849985737',
        description: 'Increased stack sizes with weight reduction',
        settings: [
            {
                key: 'HGStackingEnabled',
                label: 'Stacking Enabled',
                type: 'boolean',
                defaultValue: 'True',
                description: 'Enable the stacking modifications'
            },
            {
                key: 'HGWeightMultiplier',
                label: 'Weight Reduction',
                type: 'number',
                defaultValue: '0.1',
                description: 'Weight multiplier for stacked items',
                min: 0.01,
                max: 1,
                step: 0.01
            }
        ]
    },
    {
        id: 'custom',
        name: 'Custom Mod Settings',
        description: 'Add your own custom mod settings',
        settings: []
    }
];

export default function ModSettings({ onApplySettings }: { onApplySettings: (settings: string) => void }) {
    const [modSettings, setModSettings] = useState<Record<string, Record<string, string>>>({});
    const [expandedMods, setExpandedMods] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [customSettings, setCustomSettings] = useState<{ key: string; value: string }[]>([]);
    const [showAddCustom, setShowAddCustom] = useState(false);
    const [newCustomKey, setNewCustomKey] = useState('');
    const [newCustomValue, setNewCustomValue] = useState('');

    // Initialize settings with defaults
    useEffect(() => {
        const initialSettings: Record<string, Record<string, string>> = {};
        POPULAR_MODS.forEach(mod => {
            initialSettings[mod.id] = {};
            mod.settings.forEach(setting => {
                initialSettings[mod.id][setting.key] = setting.defaultValue;
            });
        });
        setModSettings(initialSettings);
    }, []);

    const toggleModExpanded = (modId: string) => {
        setExpandedMods(prev => {
            const next = new Set(prev);
            if (next.has(modId)) {
                next.delete(modId);
            } else {
                next.add(modId);
            }
            return next;
        });
    };

    const updateModSetting = (modId: string, key: string, value: string) => {
        setModSettings(prev => ({
            ...prev,
            [modId]: {
                ...prev[modId],
                [key]: value
            }
        }));
    };

    const addCustomSetting = () => {
        if (!newCustomKey.trim()) {
            toast.error('Setting key is required');
            return;
        }
        setCustomSettings(prev => [...prev, { key: newCustomKey, value: newCustomValue }]);
        setNewCustomKey('');
        setNewCustomValue('');
        setShowAddCustom(false);
        toast.success('Custom setting added');
    };

    const removeCustomSetting = (index: number) => {
        setCustomSettings(prev => prev.filter((_, i) => i !== index));
    };

    const resetModSettings = (modId: string) => {
        const mod = POPULAR_MODS.find(m => m.id === modId);
        if (mod) {
            const defaults: Record<string, string> = {};
            mod.settings.forEach(setting => {
                defaults[setting.key] = setting.defaultValue;
            });
            setModSettings(prev => ({
                ...prev,
                [modId]: defaults
            }));
            toast.success(`Reset ${mod.name} to defaults`);
        }
    };

    const generateINICode = (): string => {
        const lines: string[] = [
            '[/script/shootergame.shootergamemode]',
            '',
            '; === Mod Settings ==='
        ];

        // Add settings from configured mods
        Object.entries(modSettings).forEach(([modId, settings]) => {
            const mod = POPULAR_MODS.find(m => m.id === modId);
            if (mod && Object.keys(settings).length > 0) {
                lines.push(`; --- ${mod.name} ---`);
                Object.entries(settings).forEach(([key, value]) => {
                    if (value !== '') {
                        lines.push(`${key}=${value}`);
                    }
                });
                lines.push('');
            }
        });

        // Add custom settings
        if (customSettings.length > 0) {
            lines.push('; --- Custom Settings ---');
            customSettings.forEach(({ key, value }) => {
                lines.push(`${key}=${value}`);
            });
        }

        return lines.join('\n');
    };

    const handleApplySettings = () => {
        const iniCode = generateINICode();
        onApplySettings(iniCode);
        toast.success('Mod settings applied to Game.ini');
    };

    const filteredMods = POPULAR_MODS.filter(mod =>
        mod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mod.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderSettingInput = (mod: ModConfig, setting: ModSetting) => {
        const value = modSettings[mod.id]?.[setting.key] ?? setting.defaultValue;

        switch (setting.type) {
            case 'boolean':
                return (
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => updateModSetting(mod.id, setting.key, value === 'True' ? 'False' : 'True')}
                            className={cn(
                                "relative w-12 h-6 rounded-full transition-colors",
                                value === 'True' ? "bg-emerald-500" : "bg-slate-600"
                            )}
                        >
                            <div className={cn(
                                "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                                value === 'True' ? "translate-x-7" : "translate-x-1"
                            )} />
                        </button>
                        <span className={cn(
                            "text-sm",
                            value === 'True' ? "text-emerald-400" : "text-slate-400"
                        )}>
                            {value}
                        </span>
                    </div>
                );

            case 'number':
                return (
                    <input
                        type="number"
                        value={value}
                        onChange={(e) => updateModSetting(mod.id, setting.key, e.target.value)}
                        min={setting.min}
                        max={setting.max}
                        step={setting.step || 1}
                        className="w-32 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                );

            case 'select':
                return (
                    <select
                        value={value}
                        onChange={(e) => updateModSetting(mod.id, setting.key, e.target.value)}
                        className="w-48 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                        {setting.options?.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                );

            default:
                return (
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => updateModSetting(mod.id, setting.key, e.target.value)}
                        className="w-48 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                );
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Package className="w-5 h-5 text-purple-400" />
                        Mod Settings
                    </h3>
                    <button
                        onClick={handleApplySettings}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors flex items-center gap-2 font-medium"
                    >
                        <Save className="w-4 h-4" />
                        Apply to Game.ini
                    </button>
                </div>
                <p className="text-slate-400 text-sm mb-4">
                    Configure settings for popular ARK mods. These settings will be added to your Game.ini file under the appropriate section.
                </p>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search mods..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Mod List */}
            <div className="space-y-3">
                {filteredMods.map(mod => (
                    <div
                        key={mod.id}
                        className="bg-slate-800/30 rounded-xl border border-slate-700/50 overflow-hidden"
                    >
                        {/* Mod Header */}
                        <button
                            onClick={() => toggleModExpanded(mod.id)}
                            className="w-full flex items-center justify-between p-4 hover:bg-slate-700/20 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "w-10 h-10 rounded-lg flex items-center justify-center",
                                    mod.id === 'custom' ? "bg-amber-600/20" : "bg-purple-600/20"
                                )}>
                                    {mod.id === 'custom' ? (
                                        <Settings className="w-5 h-5 text-amber-400" />
                                    ) : (
                                        <Package className="w-5 h-5 text-purple-400" />
                                    )}
                                </div>
                                <div className="text-left">
                                    <h4 className="font-medium text-white">{mod.name}</h4>
                                    <p className="text-sm text-slate-400">{mod.description}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {mod.steamId && (
                                    <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded">
                                        ID: {mod.steamId}
                                    </span>
                                )}
                                {expandedMods.has(mod.id) ? (
                                    <ChevronUp className="w-5 h-5 text-slate-400" />
                                ) : (
                                    <ChevronDown className="w-5 h-5 text-slate-400" />
                                )}
                            </div>
                        </button>

                        {/* Mod Settings */}
                        {expandedMods.has(mod.id) && (
                            <div className="border-t border-slate-700/50 p-4 space-y-4">
                                {mod.settings.length > 0 ? (
                                    <>
                                        <div className="flex justify-end">
                                            <button
                                                onClick={() => resetModSettings(mod.id)}
                                                className="text-sm text-slate-400 hover:text-white flex items-center gap-1"
                                            >
                                                <RotateCcw className="w-3 h-3" />
                                                Reset to Defaults
                                            </button>
                                        </div>
                                        {mod.settings.map(setting => (
                                            <div
                                                key={setting.key}
                                                className="flex items-center justify-between py-2 border-b border-slate-700/30 last:border-0"
                                            >
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-white">{setting.label}</span>
                                                        <span className="text-xs text-slate-500 font-mono bg-slate-900 px-1.5 py-0.5 rounded">
                                                            {setting.key}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-400 mt-1">{setting.description}</p>
                                                </div>
                                                <div className="ml-4">
                                                    {renderSettingInput(mod, setting)}
                                                </div>
                                            </div>
                                        ))}
                                    </>
                                ) : mod.id === 'custom' ? (
                                    <div className="space-y-4">
                                        {/* Custom Settings List */}
                                        {customSettings.length > 0 && (
                                            <div className="space-y-2">
                                                {customSettings.map((setting, idx) => (
                                                    <div key={idx} className="flex items-center gap-2 p-2 bg-slate-900/50 rounded-lg">
                                                        <code className="flex-1 text-sm text-emerald-400">{setting.key}={setting.value}</code>
                                                        <button
                                                            onClick={() => removeCustomSetting(idx)}
                                                            className="p-1 hover:bg-red-600/20 rounded text-slate-400 hover:text-red-400"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Add Custom Setting Form */}
                                        {showAddCustom ? (
                                            <div className="flex items-end gap-2 p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                                                <div className="flex-1">
                                                    <label className="text-xs text-slate-400 block mb-1">Key</label>
                                                    <input
                                                        type="text"
                                                        value={newCustomKey}
                                                        onChange={(e) => setNewCustomKey(e.target.value)}
                                                        placeholder="SettingName"
                                                        className="w-full px-3 py-1.5 bg-slate-800 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-emerald-500"
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <label className="text-xs text-slate-400 block mb-1">Value</label>
                                                    <input
                                                        type="text"
                                                        value={newCustomValue}
                                                        onChange={(e) => setNewCustomValue(e.target.value)}
                                                        placeholder="Value"
                                                        className="w-full px-3 py-1.5 bg-slate-800 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-emerald-500"
                                                    />
                                                </div>
                                                <button
                                                    onClick={addCustomSetting}
                                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-sm"
                                                >
                                                    Add
                                                </button>
                                                <button
                                                    onClick={() => setShowAddCustom(false)}
                                                    className="p-1.5 hover:bg-slate-700 rounded text-slate-400"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setShowAddCustom(true)}
                                                className="w-full py-2 border-2 border-dashed border-slate-700 rounded-lg text-slate-400 hover:text-white hover:border-slate-600 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <Plus className="w-4 h-4" />
                                                Add Custom Setting
                                            </button>
                                        )}

                                        <div className="flex items-start gap-2 p-3 bg-amber-900/20 rounded-lg border border-amber-700/30">
                                            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                                            <p className="text-xs text-amber-200">
                                                Add custom settings in the format <code className="bg-amber-900/50 px-1 rounded">Key=Value</code>. 
                                                These will be added to your Game.ini file.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-4 text-slate-400">
                                        <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        <p>No configurable settings for this mod</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* INI Preview */}
            <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 overflow-hidden">
                <div className="p-4 bg-slate-900/50 border-b border-slate-700/50">
                    <h4 className="font-semibold text-white">Generated INI Settings</h4>
                </div>
                <pre className="p-4 text-xs font-mono text-emerald-400 overflow-x-auto max-h-64 overflow-y-auto">
                    {generateINICode()}
                </pre>
            </div>
        </div>
    );
}
