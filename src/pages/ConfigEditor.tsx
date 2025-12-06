import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Save, Loader2, FileText, Settings, Database, Shield, Globe, Search, RotateCcw, Package, X, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { cn } from '../utils/helpers';
import { readConfig, saveConfig, setCrossplayEnabled, setBattlEye, getConfigModifiedTime } from '../utils/tauri';
import toast from 'react-hot-toast';
import { useServerStore } from '../stores/serverStore';
import { useUIStore } from '../stores/uiStore';
import { useLocation } from 'react-router-dom';
import {
    ASE_GAME_USER_SETTINGS_SCHEMA,
    ASA_GAME_USER_SETTINGS_SCHEMA,
    ASE_GAME_INI_SCHEMA,
    ASA_GAME_INI_SCHEMA,
    ConfigGroup,
    CONFIG_PRESETS,
    ConfigPreset
} from '../data/configMappings';
import LevelGenerator from '../components/config/LevelGenerator';
import CodeEditor from '../components/config/CodeEditor';
import ModSettings from '../components/config/ModSettings';

// Simple INI parser/serializer
const parseIni = (content: string) => {
    const config: Record<string, Record<string, string>> = {};
    let currentSection = '';

    content.split('\n').forEach(line => {
        line = line.trim();
        if (line.startsWith('[') && line.endsWith(']')) {
            currentSection = line.slice(1, -1);
            config[currentSection] = {};
        } else if (line.includes('=') && currentSection) {
            const [key, ...valueParts] = line.split('=');
            const value = valueParts.join('=');
            config[currentSection][key.trim()] = value.trim();
        }
    });

    return config;
};

const stringifyIni = (config: Record<string, Record<string, string>>) => {
    let content = '';
    for (const [section, settings] of Object.entries(config)) {
        content += `[${section}]\n`;
        for (const [key, value] of Object.entries(settings)) {
            content += `${key}=${value}\n`;
        }
        content += '\n';
    }
    return content;
};

export default function ConfigEditor() {
    const location = useLocation();
    const [activeTab, setActiveTab] = useState<'visual' | 'raw' | 'levels' | 'mods'>('visual');
    const [configContent, setConfigContent] = useState('');
    const [parsedConfig, setParsedConfig] = useState<Record<string, Record<string, string>>>({});
    const [originalConfig, setOriginalConfig] = useState<Record<string, Record<string, string>>>({});
    const [configFile, setConfigFile] = useState<string>('General');
    const [isLoading, setIsLoading] = useState(false);
    const { servers, refreshServers } = useServerStore();
    const { gameMode } = useUIStore();
    const [selectedServerId, setSelectedServerId] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredServers = servers.filter(s => s.serverType === gameMode);
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
    const [showPresetDialog, setShowPresetDialog] = useState(false);
    const [showModifiedOnly, setShowModifiedOnly] = useState(false);

    // Get selected server object
    const selectedServer = servers.find(s => s.id === selectedServerId);

    // Initialize from navigation state if available
    useEffect(() => {
        if (location.state?.serverId) {
            setSelectedServerId(location.state.serverId);
        }
    }, [location.state]);

    // Select first server by default
    // Select first server by default
    useEffect(() => {
        if (filteredServers.length > 0) {
            if (!selectedServerId || !filteredServers.find(s => s.id === selectedServerId)) {
                setSelectedServerId(filteredServers[0].id);
            }
        } else {
            if (selectedServerId && !filteredServers.find(s => s.id === selectedServerId)) {
                setSelectedServerId(null);
            }
        }
    }, [filteredServers, selectedServerId]);

    // Load config
    const loadConfigRef = useRef<((showLoading?: boolean) => Promise<void>) | null>(null);
    const lastModifiedRef = useRef<number>(0);
    const [autoSyncEnabled] = useState(true);

    const loadConfig = useCallback(async (showLoading = true) => {
        if (!selectedServerId) return;

        if (configFile === 'General') {
            setIsLoading(false);
            return;
        }

        if (showLoading) setIsLoading(true);
        try {
            const content = await readConfig(selectedServerId, configFile);
            setConfigContent(content);
            const parsed = parseIni(content);
            setParsedConfig(parsed);
            setOriginalConfig(JSON.parse(JSON.stringify(parsed))); // Deep copy

            // Update last modified time
            const modTime = await getConfigModifiedTime(selectedServerId, configFile);
            lastModifiedRef.current = modTime;
        } catch (error) {
            console.error('Failed to load config:', error);
            if (showLoading) toast.error('Failed to load config');
        } finally {
            if (showLoading) setIsLoading(false);
        }
    }, [selectedServerId, configFile]);

    loadConfigRef.current = loadConfig;

    useEffect(() => {
        loadConfig();
    }, [loadConfig]);

    // Real-time sync: poll for config file changes every 3 seconds
    useEffect(() => {
        if (!selectedServerId || configFile === 'General' || !autoSyncEnabled) return;

        const checkForChanges = async () => {
            try {
                const modTime = await getConfigModifiedTime(selectedServerId, configFile);
                if (modTime > 0 && modTime !== lastModifiedRef.current) {
                    // File has been modified externally
                    lastModifiedRef.current = modTime;
                    toast.success('Config file updated externally - reloading...', { duration: 2000 });
                    if (loadConfigRef.current) {
                        await loadConfigRef.current(false); // Don't show loading spinner
                    }
                }
            } catch (error) {
                console.error('Failed to check config modification time:', error);
            }
        };

        const intervalId = setInterval(checkForChanges, 3000); // Poll every 3 seconds

        return () => clearInterval(intervalId);
    }, [selectedServerId, configFile, autoSyncEnabled]);

    const handleSave = async () => {
        if (!selectedServerId) return;

        if (configFile === 'General') {
            toast.success('General settings are saved automatically.');
            return;
        }

        try {
            const contentToSave = activeTab === 'visual' ? stringifyIni(parsedConfig) : configContent;
            await saveConfig(selectedServerId, configFile, contentToSave);
            toast.success('Configuration saved successfully');

            // Reload to ensure sync
            const content = await readConfig(selectedServerId, configFile);
            setConfigContent(content);
            const parsed = parseIni(content);
            setParsedConfig(parsed);
            setOriginalConfig(JSON.parse(JSON.stringify(parsed)));
        } catch (error) {
            console.error('Failed to save config:', error);
            toast.error('Failed to save config');
        }
    };

    const updateSetting = (section: string, key: string, value: string) => {
        setParsedConfig(prev => {
            const newState = { ...prev };
            if (!newState[section]) {
                newState[section] = {};
            }
            newState[section] = {
                ...newState[section],
                [key]: value
            };
            return newState;
        });
    };

    // Helper to safely get a setting
    const getSetting = (section: string, key: string, defaultValue: string = '') => {
        return parsedConfig[section]?.[key] || defaultValue;
    };

    // Check if a setting is modified
    const isModified = (section: string, key: string) => {
        return getSetting(section, key) !== (originalConfig[section]?.[key] || '');
    };

    const getSchemaForFile = (): ConfigGroup[] | null => {
        const isASA = selectedServer?.serverType === 'ASA';

        switch (configFile) {
            case 'GameUserSettings':
                return isASA ? ASA_GAME_USER_SETTINGS_SCHEMA : ASE_GAME_USER_SETTINGS_SCHEMA;
            case 'Game':
                return isASA ? ASA_GAME_INI_SCHEMA : ASE_GAME_INI_SCHEMA;
            default:
                return null;
        }
    };

    // Apply preset
    const applyPreset = (preset: ConfigPreset) => {
        setParsedConfig(prev => {
            const newState = { ...prev };
            for (const [section, settings] of Object.entries(preset.settings)) {
                if (!newState[section]) {
                    newState[section] = {};
                }
                for (const [key, value] of Object.entries(settings)) {
                    newState[section][key] = value;
                }
            }
            return newState;
        });
        setShowPresetDialog(false);
        toast.success(`Applied preset: ${preset.name}\nDon't forget to click Save to persist changes!`, {
            duration: 5000,
        });
    };

    // Reset group to defaults
    const resetGroupToDefaults = (group: ConfigGroup) => {
        setParsedConfig(prev => {
            const newState = { ...prev };
            group.fields.forEach(field => {
                if (field.defaultValue) {
                    if (!newState[field.section]) {
                        newState[field.section] = {};
                    }
                    newState[field.section][field.key] = field.defaultValue;
                }
            });
            return newState;
        });
        toast.success(`Reset ${group.title} to defaults`);
    };

    // Filter schema based on search and modified only
    const filteredSchema = useMemo(() => {
        const schema = getSchemaForFile();
        if (!schema) return null;

        if (!searchQuery && !showModifiedOnly) return schema;

        return schema.map(group => ({
            ...group,
            fields: group.fields.filter(field => {
                const matchesSearch = !searchQuery ||
                    field.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    field.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    field.key.toLowerCase().includes(searchQuery.toLowerCase());

                const matchesModified = !showModifiedOnly || isModified(field.section, field.key);

                return matchesSearch && matchesModified;
            })
        })).filter(group => group.fields.length > 0);
    }, [searchQuery, showModifiedOnly, parsedConfig, originalConfig, configFile, selectedServer]);

    const renderVisualEditor = () => {
        const schema = filteredSchema;

        if (!schema) {
            return (
                <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-800/30 rounded-2xl border border-slate-700/50">
                    <FileText className="w-16 h-16 text-slate-600 mb-4" />
                    <h3 className="text-xl font-medium text-white mb-2">Visual Editor Not Available</h3>
                    <p className="text-slate-400 max-w-md">
                        The visual editor is not yet available for {configFile}.ini.
                        Please use the Raw Text mode to edit this configuration file.
                    </p>
                    <button
                        onClick={() => setActiveTab('raw')}
                        className="mt-6 px-6 py-2 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/30 rounded-lg transition-colors"
                    >
                        Switch to Raw Text
                    </button>
                </div>
            );
        }

        if (schema.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                    <Search className="w-16 h-16 text-slate-600 mb-4" />
                    <h3 className="text-xl font-medium text-white mb-2">No Settings Found</h3>
                    <p className="text-slate-400 max-w-md">
                        No settings match your current filters. Try adjusting your search or filters.
                    </p>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 gap-6">
                {schema.map((group, groupIdx) => {
                    const isCollapsed = collapsedGroups.has(group.title);

                    return (
                        <div key={groupIdx} className="bg-slate-800/30 rounded-xl border border-slate-700/50 overflow-hidden">
                            <div
                                className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-800/50 transition-colors"
                                onClick={() => {
                                    setCollapsedGroups(prev => {
                                        const next = new Set(prev);
                                        if (next.has(group.title)) {
                                            next.delete(group.title);
                                        } else {
                                            next.add(group.title);
                                        }
                                        return next;
                                    });
                                }}
                            >
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-white flex items-center">
                                        <span className={`w-1 h-6 rounded-full mr-3 ${groupIdx % 3 === 0 ? 'bg-emerald-500' : groupIdx % 3 === 1 ? 'bg-cyan-500' : 'bg-purple-500'}`}></span>
                                        {group.title}
                                        <span className="ml-2 text-xs text-slate-500">({group.fields.length} settings)</span>
                                    </h3>
                                    {group.description && (
                                        <p className="text-slate-400 text-sm mt-1 ml-4">{group.description}</p>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            resetGroupToDefaults(group);
                                        }}
                                        className="px-3 py-1 text-xs bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors flex items-center gap-1"
                                        title="Reset to defaults"
                                    >
                                        <RotateCcw className="w-3 h-3" />
                                        Reset
                                    </button>
                                    {isCollapsed ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronUp className="w-5 h-5 text-slate-400" />}
                                </div>
                            </div>

                            {!isCollapsed && (
                                <div className="p-6 pt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {group.fields.map((field) => {
                                        const modified = isModified(field.section, field.key);
                                        return (
                                            <div
                                                key={`${field.section}.${field.key}`}
                                                className={cn(
                                                    "space-y-2 p-3 rounded-lg transition-colors",
                                                    modified && "bg-emerald-500/5 border border-emerald-500/20"
                                                )}
                                            >
                                                <label className="text-sm font-medium text-slate-300 flex items-start justify-between">
                                                    <span className="flex-1">
                                                        {field.label}
                                                        {modified && <span className="ml-2 text-emerald-400 text-xs">●</span>}
                                                    </span>
                                                </label>
                                                {field.description && (
                                                    <p className="text-xs text-slate-500 leading-relaxed">{field.description}</p>
                                                )}

                                                {field.type === 'boolean' ? (
                                                    <div className="flex items-center space-x-3 mt-2">
                                                        <button
                                                            onClick={() => updateSetting(field.section, field.key, getSetting(field.section, field.key, field.defaultValue?.toLowerCase()) === 'True' ? 'False' : 'True')}
                                                            className={cn(
                                                                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900",
                                                                getSetting(field.section, field.key, field.defaultValue?.toLowerCase()) === 'True' ? "bg-emerald-500" : "bg-slate-700"
                                                            )}
                                                        >
                                                            <span
                                                                className={cn(
                                                                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                                                                    getSetting(field.section, field.key, field.defaultValue?.toLowerCase()) === 'True' ? "translate-x-6" : "translate-x-1"
                                                                )}
                                                            />
                                                        </button>
                                                        <span className="text-sm text-slate-400">
                                                            {getSetting(field.section, field.key, field.defaultValue?.toLowerCase()) === 'True' ? 'Enabled' : 'Disabled'}
                                                        </span>
                                                    </div>
                                                ) : field.type === 'select' && field.options ? (
                                                    <select
                                                        value={getSetting(field.section, field.key, field.defaultValue)}
                                                        onChange={(e) => updateSetting(field.section, field.key, e.target.value)}
                                                        className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                                    >
                                                        {field.options.map(opt => (
                                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <div className="space-y-1">
                                                        <input
                                                            type={field.type === 'number' ? 'number' : 'text'}
                                                            step={field.step}
                                                            min={field.min}
                                                            max={field.max}
                                                            value={getSetting(field.section, field.key, field.defaultValue)}
                                                            onChange={(e) => updateSetting(field.section, field.key, e.target.value)}
                                                            className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-sm"
                                                            placeholder={field.defaultValue}
                                                        />
                                                        {field.type === 'number' && (field.min !== undefined || field.max !== undefined) && (
                                                            <div className="flex justify-between text-xs text-slate-600">
                                                                <span>Min: {field.min ?? '—'}</span>
                                                                <span>Max: {field.max ?? '—'}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    const handleCrossplayToggle = async () => {
        if (!selectedServer) return;
        await setCrossplayEnabled(selectedServer.id, !selectedServer.config.crossplayEnabled);
        refreshServers();
    };

    const handleBattlEyeToggle = async () => {
        if (!selectedServer) return;
        await setBattlEye(selectedServer.id, !selectedServer.config.battleyeEnabled);
        refreshServers();
    };

    const renderGeneralSettings = () => {
        if (!selectedServer) return null;
        return (
            <div className="space-y-6">
                <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
                    <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                        <Globe className="w-5 h-5 mr-2 text-emerald-400" />
                        Crossplay & Network
                    </h3>
                    <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700/50 mb-4">
                        <div>
                            <div className="font-medium text-white">Crossplay Support</div>
                            <div className="text-sm text-slate-400">
                                {selectedServer.serverType === 'ASE'
                                    ? 'Enables -crossplay launch argument (PC/Xbox/PS/WindowsStore compatibility).'
                                    : 'Enables cross-platform compatibility for ASA.'}
                            </div>
                        </div>
                        <button
                            onClick={handleCrossplayToggle}
                            className={cn(
                                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900",
                                selectedServer.config.crossplayEnabled ? "bg-emerald-500" : "bg-slate-700"
                            )}
                        >
                            <span className={cn(
                                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                                selectedServer.config.crossplayEnabled ? "translate-x-6" : "translate-x-1"
                            )} />
                        </button>
                    </div>
                </div>

                <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
                    <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                        <Shield className="w-5 h-5 mr-2 text-rose-400" />
                        Security
                    </h3>
                    <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700/50">
                        <div>
                            <div className="font-medium text-white">BattlEye Anti-Cheat</div>
                            <div className="text-sm text-slate-400">Enables BattlEye protection. Required for some Official lists.</div>
                        </div>
                        <button
                            onClick={handleBattlEyeToggle}
                            className={cn(
                                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 focus:ring-offset-slate-900",
                                selectedServer.config.battleyeEnabled ? "bg-rose-500" : "bg-slate-700"
                            )}
                        >
                            <span className={cn(
                                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                                selectedServer.config.battleyeEnabled ? "translate-x-6" : "translate-x-1"
                            )} />
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // Count modified settings
    const modifiedCount = useMemo(() => {
        let count = 0;
        const schema = getSchemaForFile();
        if (!schema) return 0;

        schema.forEach(group => {
            group.fields.forEach(field => {
                if (isModified(field.section, field.key)) count++;
            });
        });
        return count;
    }, [parsedConfig, originalConfig, configFile, selectedServer]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Preset Dialog */}
            {showPresetDialog && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 rounded-2xl border border-slate-700 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                    <Package className="w-6 h-6 text-emerald-400" />
                                    Choose a Preset
                                </h2>
                                <p className="text-slate-400 text-sm mt-1">Quick configurations for common server types</p>
                            </div>
                            <button
                                onClick={() => setShowPresetDialog(false)}
                                className="text-slate-400 hover:text-white transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {CONFIG_PRESETS.map((preset) => (
                                <button
                                    key={preset.name}
                                    onClick={() => applyPreset(preset)}
                                    className="p-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 hover:border-emerald-500/50 rounded-xl transition-all text-left group"
                                >
                                    <h3 className="font-semibold text-white group-hover:text-emerald-400 transition-colors">{preset.name}</h3>
                                    <p className="text-sm text-slate-400 mt-1">{preset.description}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                            Config Editor
                        </h1>
                        {selectedServer && (
                            <span className={cn(
                                "px-2 py-0.5 rounded text-xs font-bold border",
                                selectedServer.serverType === 'ASA'
                                    ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                                    : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                            )}>
                                {selectedServer.serverType === 'ASA' ? 'ASCENDED' : 'EVOLVED'}
                            </span>
                        )}
                        {modifiedCount > 0 && (
                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                {modifiedCount} modified
                            </span>
                        )}
                    </div>
                    <p className="text-slate-400 mt-1">Manage server settings and rules</p>
                </div>

                <div className="flex bg-slate-800/50 p-1 rounded-xl border border-slate-700/50">
                    <button
                        onClick={() => setActiveTab('visual')}
                        className={cn(
                            'px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
                            activeTab === 'visual'
                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                                : 'text-slate-400 hover:text-white'
                        )}
                    >
                        <Settings className="w-4 h-4" />
                        Visual
                    </button>
                    <button
                        onClick={() => setActiveTab('levels')}
                        className={cn(
                            'px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
                            activeTab === 'levels'
                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                                : 'text-slate-400 hover:text-white'
                        )}
                    >
                        <Zap className="w-4 h-4" />
                        Levels
                    </button>
                    <button
                        onClick={() => setActiveTab('raw')}
                        className={cn(
                            'px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
                            activeTab === 'raw'
                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                                : 'text-slate-400 hover:text-white'
                        )}
                    >
                        <FileText className="w-4 h-4" />
                        Raw
                    </button>
                    <button
                        onClick={() => setActiveTab('mods')}
                        className={cn(
                            'px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
                            activeTab === 'mods'
                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                                : 'text-slate-400 hover:text-white'
                        )}
                    >
                        <Package className="w-4 h-4" />
                        Mods
                    </button>
                </div>
            </div>

            {/* Controls Bar */}
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4 items-center bg-slate-800/30 p-4 rounded-xl border border-slate-700/50 backdrop-blur-sm">
                    <div className="flex md:flex-1 items-center gap-4 w-full">
                        <div className="relative min-w-[200px]">
                            <Database className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <select
                                value={selectedServerId || ''}
                                onChange={(e) => setSelectedServerId(Number(e.target.value))}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none"
                            >
                                {filteredServers.map(server => (
                                    <option key={server.id} value={server.id}>{server.name} ({server.serverType})</option>
                                ))}
                            </select>
                        </div>

                        <div className="h-8 w-px bg-slate-700 mx-2 hidden md:block" />

                        <div className="flex items-center gap-2 flex-1 overflow-x-auto no-scrollbar">
                            {['General', 'GameUserSettings', 'Game', 'Engine', 'Scaling', 'Custom'].map((file) => (
                                <button
                                    key={file}
                                    onClick={() => setConfigFile(file)}
                                    className={cn(
                                        "px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors border",
                                        configFile === file
                                            ? "bg-slate-700 border-emerald-500/50 text-white"
                                            : "bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-slate-700/50"
                                    )}
                                >
                                    {file}.ini
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-2 flex-shrink-0 w-full md:w-auto">
                        {configFile !== 'General' && activeTab === 'visual' && (
                            <button
                                onClick={() => setShowPresetDialog(true)}
                                className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 rounded-lg transition-colors border border-purple-500/30"
                            >
                                <Package className="w-4 h-4" />
                                Presets
                            </button>
                        )}
                        <button
                            onClick={handleSave}
                            className="flex-1 md:flex-initial flex items-center justify-center space-x-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors shadow-lg shadow-emerald-500/20 font-medium"
                        >
                            <Save className="w-4 h-4" />
                            <span>Save</span>
                        </button>
                    </div>
                </div>

                {/* Search and Filters */}
                {configFile !== 'General' && activeTab === 'visual' && (
                    <div className="flex flex-col sm:flex-row gap-3 bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search settings..."
                                className="w-full pl-10 pr-10 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
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
                        <button
                            onClick={() => setShowModifiedOnly(!showModifiedOnly)}
                            className={cn(
                                "px-4 py-2 rounded-lg text-sm font-medium transition-colors border whitespace-nowrap",
                                showModifiedOnly
                                    ? "bg-emerald-600/20 text-emerald-400 border-emerald-500/30"
                                    : "bg-slate-900/50 text-slate-400 border-slate-700 hover:text-white"
                            )}
                        >
                            Modified Only
                        </button>
                        <button
                            onClick={() => {
                                if (collapsedGroups.size > 0) {
                                    setCollapsedGroups(new Set());
                                } else {
                                    const schema = getSchemaForFile();
                                    if (schema) {
                                        setCollapsedGroups(new Set(schema.map(g => g.title)));
                                    }
                                }
                            }}
                            className="px-4 py-2 bg-slate-900/50 hover:bg-slate-900 text-slate-400 hover:text-white border border-slate-700 rounded-lg transition-colors text-sm whitespace-nowrap"
                        >
                            {collapsedGroups.size > 0 ? 'Expand All' : 'Collapse All'}
                        </button>
                    </div>
                )}
            </div>

            {/* Editor Content */}
            <div className="glass-panel rounded-2xl p-6 min-h-[500px]">
                {isLoading ? (
                    <div className="flex flex-col justify-center items-center h-full py-32">
                        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
                        <p className="text-slate-400">Loading configuration...</p>
                    </div>
                ) : configFile === 'General' ? (
                    renderGeneralSettings()
                ) : activeTab === 'visual' ? (
                    renderVisualEditor()
                ) : activeTab === 'levels' ? (
                    <LevelGenerator
                        onApplyToConfig={(iniCode) => {
                            // Append level config to Game.ini content
                            setConfigFile('Game');
                            setConfigContent(prev => prev + '\n\n' + iniCode);
                            toast.success('Level configuration added to Game.ini');
                        }}
                    />
                ) : activeTab === 'mods' ? (
                    <ModSettings
                        onApplySettings={(settings) => {
                            // Append mod settings to Game.ini content
                            setConfigFile('Game');
                            setConfigContent(prev => prev + '\n\n' + settings);
                            toast.success('Mod settings added to Game.ini');
                        }}
                    />
                ) : (
                    <CodeEditor
                        value={configContent}
                        onChange={setConfigContent}
                        language="ini"
                        placeholder="Enter INI configuration..."
                    />
                )}
            </div>
        </div>
    );
}
