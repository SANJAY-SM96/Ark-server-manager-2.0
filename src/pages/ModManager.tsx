// ============================================================================
// SIMPLIFIED MOD MANAGER - CLEAN AND FUNCTIONAL
// ============================================================================

import { useState, useEffect } from 'react';
import { Loader2, Trash2, RefreshCw, FolderOpen, ExternalLink, AlertCircle } from 'lucide-react';
import { cn } from '../utils/helpers';
import { getInstalledMods, updateActiveMods, uninstallMod } from '../utils/tauri';
import { ModInfo } from '../types';
import toast from 'react-hot-toast';
import { useServerStore } from '../stores/serverStore';
import { useUIStore } from '../stores/uiStore';

export default function ModManager() {
    const { gameMode } = useUIStore();
    const { servers } = useServerStore();
    const [mods, setMods] = useState<ModInfo[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedServerId, setSelectedServerId] = useState<number | null>(null);

    // Filter servers by game mode
    const filteredServers = servers.filter(s => s.serverType === gameMode);

    // Auto-select first server when game mode changes
    useEffect(() => {
        if (filteredServers.length > 0) {
            setSelectedServerId(filteredServers[0].id);
        } else {
            setSelectedServerId(null);
            setMods([]);
        }
    }, [filteredServers.length, gameMode]);

    // Load mods when server selection changes
    useEffect(() => {
        if (selectedServerId) {
            loadMods();
        }
    }, [selectedServerId]);

    // Load installed mods from backend
    const loadMods = async () => {
        if (!selectedServerId) return;
        
        setIsLoading(true);
        try {
            const installedMods = await getInstalledMods(selectedServerId);
            setMods(installedMods);
            console.log('Loaded mods:', installedMods);
        } catch (error) {
            console.error('Failed to load mods:', error);
            toast.error(`Failed to load mods: ${error}`);
            setMods([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Uninstall a mod
    const handleUninstall = async (modId: string) => {
        if (!selectedServerId) return;
        
        if (!confirm(`Are you sure you want to uninstall mod ${modId}?`)) {
            return;
        }

        try {
            toast.loading('Uninstalling mod...', { id: 'uninstall' });
            await uninstallMod(selectedServerId, modId);
            toast.success('Mod uninstalled!', { id: 'uninstall' });
            
            // Refresh the mod list
            await loadMods();
        } catch (error) {
            console.error('Uninstall failed:', error);
            toast.error(`Failed to uninstall: ${error}`, { id: 'uninstall' });
        }
    };

    // Move mod up/down in load order
    const handleMove = async (index: number, direction: 'up' | 'down') => {
        if (!selectedServerId) return;
        
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= mods.length) return;

        const newMods = [...mods];
        [newMods[index], newMods[newIndex]] = [newMods[newIndex], newMods[index]];
        setMods(newMods);

        try {
            await updateActiveMods(selectedServerId, newMods.map(m => m.id));
            toast.success('Load order updated');
        } catch (error) {
            console.error('Failed to update order:', error);
            toast.error('Failed to save load order');
            await loadMods(); // Revert
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className={cn("text-4xl font-bold", gameMode === 'ASE' ? "gradient-text-sky" : "gradient-text-violet")}>
                        Mod Manager
                    </h1>
                    <p className="text-slate-400 mt-2">
                        Manage installed mods for your {gameMode} servers
                    </p>
                </div>
                
                <div className="flex items-center gap-3">
                    {/* Server Selector */}
                    <select
                        value={selectedServerId || ''}
                        onChange={(e) => setSelectedServerId(Number(e.target.value))}
                        disabled={filteredServers.length === 0}
                        className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-sky-500 disabled:opacity-50"
                    >
                        {filteredServers.length === 0 ? (
                            <option value="">No {gameMode} Servers</option>
                        ) : (
                            filteredServers.map(server => (
                                <option key={server.id} value={server.id}>{server.name}</option>
                            ))
                        )}
                    </select>
                    
                    {/* Refresh Button */}
                    <button
                        onClick={loadMods}
                        disabled={isLoading || !selectedServerId}
                        className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-50"
                    >
                        <RefreshCw className={cn("w-5 h-5", isLoading && "animate-spin")} />
                    </button>
                </div>
            </div>

            {/* No Server Warning */}
            {filteredServers.length === 0 && (
                <div className="glass-panel rounded-xl p-8">
                    <div className="text-center mb-6">
                        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">No {gameMode} Servers Found</h3>
                        <p className="text-slate-400">
                            Install a {gameMode} server first to manage mods.
                        </p>
                    </div>
                    
                    <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
                        <h4 className="text-lg font-bold text-white mb-4">📋 How to Get Started</h4>
                        <ol className="list-decimal list-inside text-slate-300 space-y-3">
                            <li>Go to <span className="text-sky-400 font-medium">Server Manager</span> in the sidebar</li>
                            <li>Click the <span className="text-sky-400 font-medium">"Deploy {gameMode} Server"</span> button</li>
                            <li>Choose your install path and configure the server</li>
                            <li>Wait for the server installation to complete</li>
                            <li>Come back here to manage mods for your server</li>
                        </ol>
                    </div>
                </div>
            )}

            {/* Loading State */}
            {isLoading && (
                <div className="flex justify-center py-16">
                    <Loader2 className="w-10 h-10 text-sky-500 animate-spin" />
                </div>
            )}

            {/* No Mods State */}
            {!isLoading && selectedServerId && mods.length === 0 && (
                <div className="glass-panel rounded-xl p-8 text-center">
                    <FolderOpen className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">No Mods Installed</h3>
                    <p className="text-slate-400 mb-4">
                        Subscribe to mods on Steam Workshop and restart the server.
                    </p>
                    <p className="text-slate-500 text-sm">
                        Mods should be in: <code className="bg-slate-800 px-2 py-1 rounded">ShooterGame/Content/Mods</code>
                    </p>
                </div>
            )}

            {/* Mod List */}
            {!isLoading && mods.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm text-slate-400 px-4">
                        <span>{mods.length} mod{mods.length !== 1 ? 's' : ''} installed</span>
                        <span>Drag to reorder load priority</span>
                    </div>
                    
                    {mods.map((mod, index) => (
                        <div 
                            key={mod.id}
                            className="glass-panel rounded-xl p-4 flex items-center gap-4 group hover:border-sky-500/30 transition-all"
                        >
                            {/* Order Number */}
                            <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 font-mono text-sm">
                                {index + 1}
                            </div>
                            
                            {/* Mod Info */}
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-white truncate">{mod.name}</h3>
                                <p className="text-sm text-slate-400 font-mono">{mod.id}</p>
                            </div>
                            
                            {/* Actions */}
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                {/* Move Up */}
                                <button
                                    onClick={() => handleMove(index, 'up')}
                                    disabled={index === 0}
                                    className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white disabled:opacity-30"
                                    title="Move Up"
                                >
                                    ▲
                                </button>
                                
                                {/* Move Down */}
                                <button
                                    onClick={() => handleMove(index, 'down')}
                                    disabled={index === mods.length - 1}
                                    className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white disabled:opacity-30"
                                    title="Move Down"
                                >
                                    ▼
                                </button>
                                
                                {/* Steam Link */}
                                {mod.workshopUrl && (
                                    <a
                                        href={mod.workshopUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-sky-400"
                                        title="View on Steam"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                )}
                                
                                {/* Uninstall */}
                                <button
                                    onClick={() => handleUninstall(mod.id)}
                                    className="p-2 bg-red-600/20 rounded-lg text-red-400 hover:bg-red-600/30"
                                    title="Uninstall"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Help Section */}
            <div className="glass-panel rounded-xl p-6 mt-8">
                <h3 className="text-lg font-bold text-white mb-3">How to Add Mods</h3>
                <ol className="list-decimal list-inside text-slate-400 space-y-2">
                    <li>Open Steam and go to the ARK Workshop</li>
                    <li>Subscribe to the mods you want</li>
                    <li>Start/restart your server - mods will download automatically</li>
                    <li>Click Refresh to see the installed mods here</li>
                </ol>
            </div>
        </div>
    );
}
