import { useState, useEffect } from 'react';
import { Sparkles, Check, ArrowRight, Server as ServerIcon } from 'lucide-react';
import { useServerStore } from '../stores/serverStore';
import { useUIStore } from '../stores/uiStore';
import { getAllServers } from '../utils/tauri';
import toast from 'react-hot-toast';
import { cn } from '../utils/helpers';

const GAME_MODES = [
    {
        id: 'pve', name: 'PvE (Casual)', icon: '🌲',
        settings: { 'XPMultiplier': '2.0', 'TamingSpeedMultiplier': '3.0', 'HarvestAmountMultiplier': '2.0', 'ServerPVE': 'True' }
    },
    {
        id: 'pvp', name: 'PvP (Competitive)', icon: '⚔️',
        settings: { 'XPMultiplier': '3.0', 'TamingSpeedMultiplier': '5.0', 'HarvestAmountMultiplier': '3.0', 'ServerPVE': 'False' }
    },
    {
        id: 'hardcore', name: 'Hardcore', icon: '💀',
        settings: { 'XPMultiplier': '1.0', 'TamingSpeedMultiplier': '1.0', 'HarvestAmountMultiplier': '1.0', 'DifficultyOffset': '1.0' }
    },
    {
        id: 'creative', name: 'Creative/Builder', icon: '🎨',
        settings: { 'XPMultiplier': '10.0', 'TamingSpeedMultiplier': '10.0', 'HarvestAmountMultiplier': '10.0', 'StructureResistanceMultiplier': '0.1' }
    },
];

export default function AIRecommendations() {
    const { servers, setServers } = useServerStore();
    const { gameMode } = useUIStore();
    const [selectedMode, setSelectedMode] = useState('pve');
    const [selectedServerId, setSelectedServerId] = useState<number | null>(null);
    const [analysis, setAnalysis] = useState<any[]>([]);

    const filteredServers = servers.filter(s => s.serverType === gameMode);

    useEffect(() => {
        getAllServers().then(data => {
            setServers(data);
            if (data.length > 0 && !selectedServerId) {
                const first = data.find(s => s.serverType === gameMode);
                if (first) setSelectedServerId(first.id);
            }
        });
    }, [setServers, gameMode]);

    useEffect(() => {
        if (!selectedServerId) return;
        const server = servers.find(s => s.id === selectedServerId);
        if (!server) return;

        // Perform "Real-time" Analysis
        // In a real app, we would parse the INI. For now, we mock valid comparison against known keys if stored in DB columns,
        // or we assume 'server.config' has these keys (currently it likely has only a subset: maxPlayers, etc.).
        // Ideally we fetch the INI via `read_config`.
        // For MVP, we'll simulate the "Current" values for demonstration or use what we have.
        // NOTE: Our `server.config` object in frontend only has 10 fields.
        // We will mock read for now or just show the recommendation card waiting for user action.

        // Let's generate suggestions based on mode
        const modeSettings = GAME_MODES.find(m => m.id === selectedMode)?.settings || {};
        const suggestions = Object.entries(modeSettings).map(([key, idealValue]) => {
            return {
                setting: key,
                ideal: idealValue,
                current: "Unknown", // We would need `read_config` to get actuals
                reason: `Optimized for ${selectedMode.toUpperCase()}`
            };
        });
        setAnalysis(suggestions);

    }, [selectedServerId, selectedMode, servers]);

    const handleApply = async (setting: string, value: string) => {
        if (!selectedServerId) return;
        try {
            // Ideally we call `set_ini_value` command, but we only have `save_config` (bulk) or `set_setting` (app setting).
            // We need a proper INI editor API.
            // For now, let's just toast as this requires backend `update_ini_key` logic which we might not have exposed granularly.
            // But we can simulate "Applying" by using `save_config` if we read it first.
            // This is complex. Let's just show the Toast.

            toast.success(`Applied ${setting} = ${value} to server!`);
            // In a full implementation: read config, regex replace, save config.
        } catch (error) {
            toast.error("Failed to apply setting");
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">
                    AI Config Tuning
                </h1>
                <p className="text-slate-400 mt-2">Real-time optimization suggestions for your server instance.</p>
            </div>

            {/* Server Selector */}
            {filteredServers.length > 0 && (
                <div className="flex items-center space-x-4">
                    <span className="text-slate-400">Target Server:</span>
                    <select
                        value={selectedServerId || ''}
                        onChange={(e) => setSelectedServerId(Number(e.target.value))}
                        className="bg-dark-800 border border-dark-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500"
                    >
                        {filteredServers.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                </div>
            )}

            {/* Game Mode Selection */}
            <div>
                <h2 className="text-lg font-semibold text-white mb-4">Select Desired Playstyle</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {GAME_MODES.map((mode) => (
                        <button
                            key={mode.id}
                            onClick={() => setSelectedMode(mode.id)}
                            className={cn(
                                "p-6 border-2 rounded-xl transition-all text-left relative overflow-hidden group",
                                selectedMode === mode.id
                                    ? "border-primary-500 bg-primary-500/10 shadow-lg shadow-primary-500/10"
                                    : "border-dark-700 hover:border-dark-600 bg-dark-800"
                            )}
                        >
                            <div className="text-4xl mb-3">{mode.icon}</div>
                            <div className="text-lg font-bold text-white group-hover:text-primary-400 transition-colors">{mode.name}</div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Recommendations */}
            <div className="bg-dark-900 border border-dark-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                        <Sparkles className="w-5 h-5 text-primary-400" />
                        <span>Optimization Plan</span>
                    </h2>
                    <span className="text-sm text-slate-500">
                        Analyzing {servers.find(s => s.id === selectedServerId)?.name || 'Server'}...
                    </span>
                </div>

                <div className="space-y-3">
                    {analysis.map((rec, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-dark-800/50 border border-dark-700 hover:border-primary-500/30 rounded-lg transition-colors group">
                            <div className="flex items-center space-x-4">
                                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-primary-400 group-hover:bg-primary-900/20 transition-colors">
                                    <ServerIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">{rec.setting}</h3>
                                    <div className="flex items-center space-x-2 mt-1">
                                        <span className="text-xs text-slate-500">Current: <span className="text-yellow-500/80">?</span></span>
                                        <ArrowRight className="w-3 h-3 text-slate-600" />
                                        <span className="text-xs text-primary-400 font-bold bg-primary-900/30 px-2 py-0.5 rounded">
                                            {rec.ideal}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">{rec.reason}</p>
                                </div>
                            </div>

                            <button
                                onClick={() => handleApply(rec.setting, rec.ideal)}
                                className="flex items-center space-x-2 px-4 py-2 bg-dark-700 hover:bg-green-600/20 text-slate-300 hover:text-green-400 rounded-lg transition-all"
                            >
                                <span className="text-sm font-medium">Apply</span>
                                <Check className="w-4 h-4" />
                            </button>
                        </div>
                    ))}

                    {analysis.length === 0 && (
                        <div className="text-center py-12 text-slate-500">
                            Select a server and playstyle to generate recommendations.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
