import { useState, useMemo } from 'react';
import {
    Zap, Settings, Copy, ChevronDown, ChevronUp,
    Play, RotateCcw, Plus, Trash2, Edit2, Check, X, Sparkles
} from 'lucide-react';
import { cn } from '../../utils/helpers';
import {
    LEVEL_PRESETS,
    LevelPreset,
    XPCurveType,
    generateLevelConfig,
    calculateDifficultyForLevel,
    formatNumber,
    XPEntry,
    GeneratedLevelConfig
} from '../../utils/levelCalculator';
import toast from 'react-hot-toast';

interface LevelGeneratorProps {
    onApplyToConfig: (iniCode: string) => void;
}

export default function LevelGenerator({ onApplyToConfig }: LevelGeneratorProps) {
    const [selectedPreset, setSelectedPreset] = useState<LevelPreset | null>(null);
    const [customPlayerLevel, setCustomPlayerLevel] = useState(105);
    const [customWildLevel, setCustomWildLevel] = useState(150);
    const [customTamedLevels, setCustomTamedLevels] = useState(88);
    const [playerCurve, setPlayerCurve] = useState<XPCurveType>('official');
    const [dinoCurve, setDinoCurve] = useState<XPCurveType>('official');
    const [xpMultiplier, setXpMultiplier] = useState(1.0);
    const [showPreview, setShowPreview] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [generatedConfig, setGeneratedConfig] = useState<GeneratedLevelConfig | null>(null);

    // Custom level entries for CRUD operations
    const [customPlayerLevels, setCustomPlayerLevels] = useState<XPEntry[]>([]);
    const [customDinoLevels, setCustomDinoLevels] = useState<XPEntry[]>([]);
    const [editingLevel, setEditingLevel] = useState<{ type: 'player' | 'dino'; index: number } | null>(null);
    const [editValue, setEditValue] = useState('');

    // Active preset from selection or custom
    const activePreset = useMemo((): LevelPreset => {
        if (selectedPreset) return selectedPreset;
        const difficulty = calculateDifficultyForLevel(customWildLevel);
        return {
            name: 'Custom',
            description: 'Custom level configuration',
            maxWildLevel: customWildLevel,
            maxTamedLevels: customTamedLevels,
            maxPlayerLevel: customPlayerLevel,
            ...difficulty
        };
    }, [selectedPreset, customPlayerLevel, customWildLevel, customTamedLevels]);

    const handleGenerateLevels = () => {
        const config = generateLevelConfig(
            activePreset,
            playerCurve,
            dinoCurve,
            xpMultiplier
        );
        setGeneratedConfig(config);
        setCustomPlayerLevels([...config.playerLevels]);
        setCustomDinoLevels([...config.dinoLevels]);
        setShowPreview(true);
        toast.success(`Generated ${config.playerLevels.length} player levels and ${config.dinoLevels.length} dino levels!`);
    };

    const handleApplyConfig = () => {
        if (generatedConfig) {
            onApplyToConfig(generatedConfig.iniCode);
            toast.success('Level configuration applied to Game.ini!');
        }
    };

    const handleCopyToClipboard = () => {
        if (generatedConfig) {
            navigator.clipboard.writeText(generatedConfig.iniCode);
            toast.success('INI code copied to clipboard!');
        }
    };

    const handleEditLevel = (type: 'player' | 'dino', index: number) => {
        const levels = type === 'player' ? customPlayerLevels : customDinoLevels;
        setEditingLevel({ type, index });
        setEditValue(levels[index].xpForLevel.toString());
    };

    const handleSaveEdit = () => {
        if (!editingLevel) return;
        const { type, index } = editingLevel;
        const newXP = parseInt(editValue, 10);

        if (isNaN(newXP) || newXP < 0) {
            toast.error('Invalid XP value');
            return;
        }

        if (type === 'player') {
            const newLevels = [...customPlayerLevels];
            let totalXP = index > 0 ? newLevels[index - 1].totalXP : 0;
            newLevels[index] = {
                ...newLevels[index],
                xpForLevel: newXP,
                totalXP: totalXP + newXP
            };
            // Recalculate total XP for subsequent levels
            for (let i = index + 1; i < newLevels.length; i++) {
                newLevels[i].totalXP = newLevels[i - 1].totalXP + newLevels[i].xpForLevel;
            }
            setCustomPlayerLevels(newLevels);
        } else {
            const newLevels = [...customDinoLevels];
            let totalXP = index > 0 ? newLevels[index - 1].totalXP : 0;
            newLevels[index] = {
                ...newLevels[index],
                xpForLevel: newXP,
                totalXP: totalXP + newXP
            };
            for (let i = index + 1; i < newLevels.length; i++) {
                newLevels[i].totalXP = newLevels[i - 1].totalXP + newLevels[i].xpForLevel;
            }
            setCustomDinoLevels(newLevels);
        }

        setEditingLevel(null);
        setEditValue('');
    };

    const handleAddLevel = (type: 'player' | 'dino') => {
        const levels = type === 'player' ? customPlayerLevels : customDinoLevels;
        const lastLevel = levels[levels.length - 1] || { level: 0, xpForLevel: 0, totalXP: 0 };
        const newEntry: XPEntry = {
            level: lastLevel.level + 1,
            xpForLevel: Math.floor(lastLevel.xpForLevel * 1.1) || 100,
            totalXP: lastLevel.totalXP + (Math.floor(lastLevel.xpForLevel * 1.1) || 100)
        };

        if (type === 'player') {
            setCustomPlayerLevels([...levels, newEntry]);
        } else {
            setCustomDinoLevels([...levels, newEntry]);
        }
        toast.success(`Added level ${newEntry.level}`);
    };

    const handleDeleteLevel = (type: 'player' | 'dino', index: number) => {
        if (type === 'player') {
            const newLevels = customPlayerLevels.filter((_, i) => i !== index);
            // Renumber and recalculate
            let totalXP = 0;
            newLevels.forEach((entry, i) => {
                entry.level = i + 1;
                totalXP += entry.xpForLevel;
                entry.totalXP = totalXP;
            });
            setCustomPlayerLevels(newLevels);
        } else {
            const newLevels = customDinoLevels.filter((_, i) => i !== index);
            let totalXP = 0;
            newLevels.forEach((entry, i) => {
                entry.level = i + 1;
                totalXP += entry.xpForLevel;
                entry.totalXP = totalXP;
            });
            setCustomDinoLevels(newLevels);
        }
        toast.success('Level removed');
    };

    const handleReset = () => {
        setSelectedPreset(null);
        setCustomPlayerLevel(105);
        setCustomWildLevel(150);
        setCustomTamedLevels(88);
        setPlayerCurve('official');
        setDinoCurve('official');
        setXpMultiplier(1.0);
        setGeneratedConfig(null);
        setCustomPlayerLevels([]);
        setCustomDinoLevels([]);
        setShowPreview(false);
        toast.success('Reset to defaults');
    };

    return (
        <div className="space-y-6">
            {/* Preset Selection */}
            <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    Level Presets
                </h3>
                <p className="text-slate-400 text-sm mb-4">
                    Quick-select common level configurations. These presets configure max wild dino levels,
                    player progression, and difficulty settings.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {LEVEL_PRESETS.map((preset) => (
                        <button
                            key={preset.name}
                            onClick={() => {
                                setSelectedPreset(preset);
                                setCustomPlayerLevel(preset.maxPlayerLevel);
                                setCustomWildLevel(preset.maxWildLevel);
                                setCustomTamedLevels(preset.maxTamedLevels);
                            }}
                            className={cn(
                                "p-4 rounded-xl border transition-all text-left",
                                selectedPreset?.name === preset.name
                                    ? "bg-emerald-600/20 border-emerald-500/50 text-white"
                                    : "bg-slate-900/50 border-slate-700/50 text-slate-300 hover:border-slate-600"
                            )}
                        >
                            <div className="text-xl font-bold text-center mb-1">
                                {preset.maxWildLevel}
                            </div>
                            <div className="text-xs text-center text-slate-400">
                                Max Wild Level
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Custom Configuration */}
            <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Settings className="w-5 h-5 text-cyan-400" />
                        Custom Configuration
                    </h3>
                    <button
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="text-sm text-slate-400 hover:text-white flex items-center gap-1"
                    >
                        {showAdvanced ? 'Hide' : 'Show'} Advanced
                        {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Max Player Level</label>
                        <input
                            type="number"
                            value={customPlayerLevel}
                            onChange={(e) => {
                                setCustomPlayerLevel(Number(e.target.value));
                                setSelectedPreset(null);
                            }}
                            min={1}
                            max={1000}
                            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-lg font-bold text-center"
                        />
                        <p className="text-xs text-slate-500">Maximum level players can reach</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Max Wild Dino Level</label>
                        <input
                            type="number"
                            value={customWildLevel}
                            onChange={(e) => {
                                setCustomWildLevel(Number(e.target.value));
                                setSelectedPreset(null);
                            }}
                            min={1}
                            max={1500}
                            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-lg font-bold text-center"
                        />
                        <p className="text-xs text-slate-500">Maximum level for wild dinos</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Tamed Bonus Levels</label>
                        <input
                            type="number"
                            value={customTamedLevels}
                            onChange={(e) => {
                                setCustomTamedLevels(Number(e.target.value));
                                setSelectedPreset(null);
                            }}
                            min={0}
                            max={500}
                            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-lg font-bold text-center"
                        />
                        <p className="text-xs text-slate-500">Additional levels after taming</p>
                    </div>
                </div>

                {showAdvanced && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-700/50">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Player XP Curve</label>
                            <select
                                value={playerCurve}
                                onChange={(e) => setPlayerCurve(e.target.value as XPCurveType)}
                                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                                <option value="official">Official (Recommended)</option>
                                <option value="linear">Linear</option>
                                <option value="exponential">Exponential</option>
                                <option value="flat">Flat</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Dino XP Curve</label>
                            <select
                                value={dinoCurve}
                                onChange={(e) => setDinoCurve(e.target.value as XPCurveType)}
                                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                                <option value="official">Official (Recommended)</option>
                                <option value="linear">Linear</option>
                                <option value="exponential">Exponential</option>
                                <option value="flat">Flat</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">XP Multiplier</label>
                            <input
                                type="number"
                                value={xpMultiplier}
                                onChange={(e) => setXpMultiplier(Number(e.target.value))}
                                step="0.1"
                                min={0.1}
                                max={10}
                                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-700/50">
                    <div className="text-sm text-slate-400">
                        <span className="text-emerald-400 font-semibold">Difficulty:</span>{' '}
                        {activePreset.overrideOfficialDifficulty.toFixed(2)} | {' '}
                        <span className="text-cyan-400 font-semibold">Total Dino Levels:</span>{' '}
                        {customWildLevel + customTamedLevels}
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleReset}
                            className="px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors flex items-center gap-2"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Reset
                        </button>
                        <button
                            onClick={handleGenerateLevels}
                            className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white rounded-lg transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 font-semibold"
                        >
                            <Zap className="w-4 h-4" />
                            Generate Levels
                        </button>
                    </div>
                </div>
            </div>

            {/* Level Tables with CRUD */}
            {showPreview && customPlayerLevels.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Player Levels */}
                    <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 overflow-hidden">
                        <div className="p-4 bg-slate-900/50 border-b border-slate-700/50 flex items-center justify-between">
                            <h4 className="font-semibold text-white flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                                Player Levels ({customPlayerLevels.length})
                            </h4>
                            <button
                                onClick={() => handleAddLevel('player')}
                                className="px-3 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-lg text-sm flex items-center gap-1"
                            >
                                <Plus className="w-3 h-3" />
                                Add Level
                            </button>
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                            <table className="w-full text-sm">
                                <thead className="sticky top-0 bg-slate-800">
                                    <tr className="text-slate-400">
                                        <th className="px-4 py-2 text-left">Level</th>
                                        <th className="px-4 py-2 text-right">XP Required</th>
                                        <th className="px-4 py-2 text-right">Total XP</th>
                                        <th className="px-4 py-2 text-center w-24">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700/30">
                                    {customPlayerLevels.slice(0, 50).map((entry, idx) => (
                                        <tr key={idx} className="text-slate-300 hover:bg-slate-700/20">
                                            <td className="px-4 py-2 font-medium">{entry.level}</td>
                                            <td className="px-4 py-2 text-right font-mono">
                                                {editingLevel?.type === 'player' && editingLevel.index === idx ? (
                                                    <input
                                                        type="number"
                                                        value={editValue}
                                                        onChange={(e) => setEditValue(e.target.value)}
                                                        className="w-24 px-2 py-1 bg-slate-900 border border-emerald-500 rounded text-right"
                                                        autoFocus
                                                    />
                                                ) : (
                                                    formatNumber(entry.xpForLevel)
                                                )}
                                            </td>
                                            <td className="px-4 py-2 text-right font-mono text-slate-500">
                                                {formatNumber(entry.totalXP)}
                                            </td>
                                            <td className="px-4 py-2 text-center">
                                                {editingLevel?.type === 'player' && editingLevel.index === idx ? (
                                                    <div className="flex justify-center gap-1">
                                                        <button onClick={handleSaveEdit} className="p-1 hover:bg-emerald-600/30 rounded text-emerald-400">
                                                            <Check className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => setEditingLevel(null)} className="p-1 hover:bg-red-600/30 rounded text-red-400">
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex justify-center gap-1">
                                                        <button onClick={() => handleEditLevel('player', idx)} className="p-1 hover:bg-slate-600 rounded text-slate-400">
                                                            <Edit2 className="w-3 h-3" />
                                                        </button>
                                                        <button onClick={() => handleDeleteLevel('player', idx)} className="p-1 hover:bg-red-600/30 rounded text-slate-400 hover:text-red-400">
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {customPlayerLevels.length > 50 && (
                                <div className="p-3 text-center text-slate-500 text-sm border-t border-slate-700/50">
                                    ... and {customPlayerLevels.length - 50} more levels
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Dino Levels */}
                    <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 overflow-hidden">
                        <div className="p-4 bg-slate-900/50 border-b border-slate-700/50 flex items-center justify-between">
                            <h4 className="font-semibold text-white flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                                Dino Levels ({customDinoLevels.length})
                            </h4>
                            <button
                                onClick={() => handleAddLevel('dino')}
                                className="px-3 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-lg text-sm flex items-center gap-1"
                            >
                                <Plus className="w-3 h-3" />
                                Add Level
                            </button>
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                            <table className="w-full text-sm">
                                <thead className="sticky top-0 bg-slate-800">
                                    <tr className="text-slate-400">
                                        <th className="px-4 py-2 text-left">Level</th>
                                        <th className="px-4 py-2 text-right">XP Required</th>
                                        <th className="px-4 py-2 text-right">Total XP</th>
                                        <th className="px-4 py-2 text-center w-24">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700/30">
                                    {customDinoLevels.slice(0, 50).map((entry, idx) => (
                                        <tr key={idx} className="text-slate-300 hover:bg-slate-700/20">
                                            <td className="px-4 py-2 font-medium">{entry.level}</td>
                                            <td className="px-4 py-2 text-right font-mono">
                                                {editingLevel?.type === 'dino' && editingLevel.index === idx ? (
                                                    <input
                                                        type="number"
                                                        value={editValue}
                                                        onChange={(e) => setEditValue(e.target.value)}
                                                        className="w-24 px-2 py-1 bg-slate-900 border border-emerald-500 rounded text-right"
                                                        autoFocus
                                                    />
                                                ) : (
                                                    formatNumber(entry.xpForLevel)
                                                )}
                                            </td>
                                            <td className="px-4 py-2 text-right font-mono text-slate-500">
                                                {formatNumber(entry.totalXP)}
                                            </td>
                                            <td className="px-4 py-2 text-center">
                                                {editingLevel?.type === 'dino' && editingLevel.index === idx ? (
                                                    <div className="flex justify-center gap-1">
                                                        <button onClick={handleSaveEdit} className="p-1 hover:bg-emerald-600/30 rounded text-emerald-400">
                                                            <Check className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => setEditingLevel(null)} className="p-1 hover:bg-red-600/30 rounded text-red-400">
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex justify-center gap-1">
                                                        <button onClick={() => handleEditLevel('dino', idx)} className="p-1 hover:bg-slate-600 rounded text-slate-400">
                                                            <Edit2 className="w-3 h-3" />
                                                        </button>
                                                        <button onClick={() => handleDeleteLevel('dino', idx)} className="p-1 hover:bg-red-600/30 rounded text-slate-400 hover:text-red-400">
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {customDinoLevels.length > 50 && (
                                <div className="p-3 text-center text-slate-500 text-sm border-t border-slate-700/50">
                                    ... and {customDinoLevels.length - 50} more levels
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Generated INI Preview */}
            {generatedConfig && showPreview && (
                <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 overflow-hidden">
                    <div className="p-4 bg-slate-900/50 border-b border-slate-700/50 flex items-center justify-between">
                        <h4 className="font-semibold text-white flex items-center gap-2">
                            Generated INI Code
                        </h4>
                        <div className="flex gap-2">
                            <button
                                onClick={handleCopyToClipboard}
                                className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg text-sm flex items-center gap-2"
                            >
                                <Copy className="w-4 h-4" />
                                Copy
                            </button>
                            <button
                                onClick={handleApplyConfig}
                                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm flex items-center gap-2 font-medium"
                            >
                                <Play className="w-4 h-4" />
                                Apply to Game.ini
                            </button>
                        </div>
                    </div>
                    <div className="max-h-80 overflow-auto">
                        <pre className="p-4 text-xs font-mono text-emerald-400 whitespace-pre-wrap leading-relaxed">
                            {generatedConfig.iniCode}
                        </pre>
                    </div>
                </div>
            )}
        </div>
    );
}
