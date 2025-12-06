import { useState, useEffect, useRef } from 'react';
import { Users, Terminal, RefreshCw, Send, ShieldAlert, LogOut, Ban, Map as MapIcon, Skull, Lock, Clock, Globe, FileText, CloudDownload } from 'lucide-react';
import { cn } from '../utils/helpers';
import { getOnlinePlayers, sendRconCommand, readFileContent, saveFileContent } from '../utils/tauri';
import toast from 'react-hot-toast';
import { useServerStore } from '../stores/serverStore';

import MapManager from './MapManager';
import TribeManager from './TribeManager';
import DinoManager from './DinoManager';
import SecurityManager from './SecurityManager';
import Automation from './Automation';
import NetworkManager from './NetworkManager';
import UpdateManager from './UpdateManager';

type Tab = 'players' | 'maps' | 'tribes' | 'dinos' | 'security' | 'automation' | 'network' | 'updates';

export default function PlayerManager() {
    const { servers } = useServerStore();
    const [selectedServerId, setSelectedServerId] = useState<number | null>(null);
    const [players, setPlayers] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>('players');

    // Console
    const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
    const [commandInput, setCommandInput] = useState('');

    const [isExecuting, setIsExecuting] = useState(false);
    const consoleEndRef = useRef<HTMLDivElement>(null);

    // Ban Manager State
    const [showBanManager, setShowBanManager] = useState(false);
    const [bannedPlayers, setBannedPlayers] = useState<string[]>([]);
    const [isLoadingBans, setIsLoadingBans] = useState(false);

    // Auto-scroll console
    useEffect(() => {
        consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [consoleOutput]);

    // Poll for players? Or manual refresh
    useEffect(() => {
        if (selectedServerId) {
            fetchPlayers();
        } else {
            setPlayers([]);
            setConsoleOutput([]);
        }
    }, [selectedServerId]);

    const fetchPlayers = async () => {
        if (!selectedServerId) return;
        setIsLoading(true);
        try {
            const list = await getOnlinePlayers(selectedServerId);
            setPlayers(list);
        } catch (error) {
            console.warn('RCON not connected or failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendCommand = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!selectedServerId || !commandInput.trim()) return;

        const cmd = commandInput.trim();
        setCommandInput('');
        setIsExecuting(true);

        // Add to log immediately
        setConsoleOutput(prev => [...prev, `> ${cmd}`]);

        try {
            const response = await sendRconCommand(selectedServerId, cmd);
            if (response) {
                setConsoleOutput(prev => [...prev, response]);
            } else {
                setConsoleOutput(prev => [...prev, '(No response)']);
            }
        } catch (error) {
            setConsoleOutput(prev => [...prev, `Error: ${error}`]);
        } finally {
            setIsExecuting(false);
        }
    };

    const handleKick = async (steamId: string) => {
        if (!selectedServerId) return;
        if (!confirm(`Kick player ${steamId}?`)) return;

        try {
            // ARK RCON: KickPlayer <SteamID>
            const res = await sendRconCommand(selectedServerId, `KickPlayer ${steamId}`);
            toast.success(`Kick command sent: ${res}`);
            setTimeout(fetchPlayers, 2000);
        } catch (e) {
            toast.error(`Failed to kick: ${e}`);
        }
    };



    const handleBan = async (steamId: string) => {
        if (!selectedServerId) return;
        if (!confirm(`Ban player ${steamId}?`)) return;

        try {
            // ARK RCON: BanPlayer <SteamID>
            const res = await sendRconCommand(selectedServerId, `BanPlayer ${steamId}`);
            toast.success(`Ban command sent: ${res}`);
            setTimeout(fetchPlayers, 2000);
            if (showBanManager) fetchBans(); // Refresh if open
        } catch (e) {
            toast.error(`Failed to ban: ${e}`);
        }
    };

    const fetchBans = async () => {
        if (!selectedServerId) return;
        const server = servers.find(s => s.id === selectedServerId);
        if (!server) return;

        setIsLoadingBans(true);
        try {
            // Helper to handle both slashes
            const path = `${server.installPath}/ShooterGame/Saved/BanList.txt`.replace(/\\/g, '/');
            const content = await readFileContent(path);
            const ids = content.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
            setBannedPlayers(ids);
        } catch (error) {
            console.error('Failed to read ban list:', error);
            // Don't toast error on common 'file not found' for new servers
            setBannedPlayers([]);
        } finally {
            setIsLoadingBans(false);
        }
    };

    const handleUnban = async (steamId: string) => {
        if (!selectedServerId) return;
        const server = servers.find(s => s.id === selectedServerId);
        if (!server) return;

        if (!confirm(`Unban player ${steamId}?`)) return;

        try {
            const path = `${server.installPath}/ShooterGame/Saved/BanList.txt`.replace(/\\/g, '/');
            const newContent = bannedPlayers.filter(id => id !== steamId).join('\n');
            await saveFileContent(path, newContent);

            // Also try RCON Unban if available/needed or just reload bans
            try {
                // Some servers support UnbanPlayer
                await sendRconCommand(selectedServerId, `UnbanPlayer ${steamId}`);
            } catch {
                // Ignore if unban command fail, file edit is primary
            }

            toast.success('Player unbanned (removed from BanList.txt)');
            fetchBans();
        } catch (error) {
            toast.error(`Failed to unban: ${error}`);
        }
    };

    // Auto-load bans when modal opens
    useEffect(() => {
        if (showBanManager) fetchBans();
    }, [showBanManager]);

    const tabs = [
        { id: 'players', name: 'Players & Console', icon: Users },
        { id: 'maps', name: 'Map Manager', icon: MapIcon },
        { id: 'updates', name: 'Update Manager', icon: CloudDownload },
        { id: 'tribes', name: 'Tribe Manager', icon: FileText },
        { id: 'dinos', name: 'Dino Manager', icon: Skull },
        { id: 'security', name: 'Security', icon: Lock },
        { id: 'automation', name: 'Automation', icon: Clock },
        { id: 'network', name: 'Network', icon: Globe },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500 h-[calc(100vh-100px)] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between shrink-0">
                <div>
                    <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-violet-400">
                        RCON Manager
                    </h1>
                    <p className="text-slate-400 mt-2 text-lg">Manage players, maps, tribes, and server automation</p>
                </div>

                <div className="flex items-center space-x-3">
                    <span className="text-slate-400 text-sm">Target Server:</span>
                    <select
                        value={selectedServerId || ''}
                        onChange={(e) => setSelectedServerId(Number(e.target.value))}
                        className="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 min-w-[200px]"
                    >
                        <option value="">Select Server...</option>
                        {servers.map(server => (
                            <option key={server.id} value={server.id}>{server.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center space-x-2 border-b border-slate-700/50 pb-px shrink-0 overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as Tab)}
                        className={cn(
                            "flex items-center space-x-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap",
                            activeTab === tab.id
                                ? "border-sky-500 text-sky-400"
                                : "border-transparent text-slate-400 hover:text-slate-200"
                        )}
                    >
                        <tab.icon className="w-4 h-4" />
                        <span className="font-medium text-sm">{tab.name}</span>
                    </button>
                ))}
            </div>

            {!selectedServerId ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                    <ShieldAlert className="w-16 h-16 mb-4 opacity-50" />
                    <p>Select a server to connect</p>
                </div>
            ) : (
                <div className="flex-1 min-h-0 overflow-hidden relative">
                    {/* Players Tab Content is custom, others are components */}
                    {activeTab === 'players' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full min-h-0 overflow-y-auto pr-2 pb-2">
                            {/* Player List */}
                            <div className="lg:col-span-2 glass-panel rounded-2xl flex flex-col min-h-[400px]">
                                <div className="p-6 border-b border-slate-700/50 flex justify-between items-center shrink-0">
                                    <h3 className="text-xl font-bold text-white flex items-center">
                                        <Users className="w-5 h-5 mr-2 text-sky-400" />
                                        Online Players ({players.length})
                                    </h3>
                                    <button
                                        onClick={fetchPlayers}
                                        disabled={isLoading}
                                        className="p-2 hover:bg-slate-700/50 rounded-lg text-slate-400 hover:text-white transition-colors"
                                    >
                                        <RefreshCw className={cn("w-5 h-5", isLoading && "animate-spin")} />
                                    </button>
                                    <button
                                        onClick={() => setShowBanManager(true)}
                                        className="ml-2 px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded hover:bg-red-500 hover:text-white transition-colors text-xs font-bold flex items-center"
                                    >
                                        <Ban className="w-3 h-3 mr-1" />
                                        MANAGE BANS
                                    </button>
                                </div>

                                <div className="flex-1 overflow-auto p-6">
                                    {players.length === 0 ? (
                                        <div className="text-center text-slate-500 py-10">
                                            No players connected or RCON failed to retrieve list.
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {players.map((line, i) => {
                                                const parts = line.split(',');
                                                const name = parts[0] || line;
                                                const id = parts[1] || 'Unknown ID';

                                                return (
                                                    <div key={i} className="bg-slate-800/50 rounded-xl p-4 flex items-center justify-between group hover:bg-slate-800 transition-colors border border-transparent hover:border-sky-500/20">
                                                        <div className="flex items-center space-x-4">
                                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-violet-500 flex items-center justify-center text-white font-bold text-lg">
                                                                {name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-white">{name}</div>
                                                                <div className="text-xs text-slate-400 font-mono">{id}</div>
                                                            </div>
                                                        </div>

                                                        <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => handleKick(id.trim())}
                                                                className="p-2 bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white rounded-lg transition-colors border border-amber-500/20"
                                                                title="Kick Player"
                                                            >
                                                                <LogOut className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleBan(id.trim())}
                                                                className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors border border-red-500/20"
                                                                title="Ban Player"
                                                            >
                                                                <Ban className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* RCON Console */}
                            <div className="glass-panel rounded-2xl flex flex-col min-h-[400px] border border-slate-700 shadow-2xl">
                                <div className="p-4 border-b border-slate-700/50 bg-slate-900/50 rounded-t-2xl">
                                    <h3 className="text-sm font-bold text-slate-300 flex items-center uppercase tracking-wider">
                                        <Terminal className="w-4 h-4 mr-2 text-violet-400" />
                                        RCON Console
                                    </h3>
                                </div>

                                <div className="flex-1 overflow-auto p-4 font-mono text-sm space-y-2 bg-black/40">
                                    {consoleOutput.length === 0 && (
                                        <div className="text-slate-600 italic">Ready for commands...</div>
                                    )}
                                    {consoleOutput.map((line, i) => (
                                        <div key={i} className={cn(
                                            "break-words",
                                            line.startsWith('>') ? "text-sky-400 font-bold" : "text-slate-300"
                                        )}>
                                            {line}
                                        </div>
                                    ))}
                                    <div ref={consoleEndRef} />
                                </div>

                                <div className="p-4 border-t border-slate-700/50 bg-slate-800/30 rounded-b-2xl">
                                    <form onSubmit={handleSendCommand} className="relative">
                                        <input
                                            type="text"
                                            value={commandInput}
                                            onChange={(e) => setCommandInput(e.target.value)}
                                            placeholder="Enter command (e.g. SaveWorld)..."
                                            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg pl-4 pr-12 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono text-sm"
                                            disabled={isExecuting}
                                        />
                                        <button
                                            type="submit"
                                            disabled={isExecuting || !commandInput.trim()}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-sky-500 hover:text-sky-300 disabled:opacity-30 disabled:hover:text-sky-500 transition-colors"
                                        >
                                            <Send className="w-4 h-4" />
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Component Tabs - Wrapped in div to manage overflow if needed, though most handle their own */}
                    {activeTab === 'maps' && <div className="h-full overflow-y-auto pr-2"><MapManager serverId={selectedServerId} /></div>}
                    {activeTab === 'tribes' && <div className="h-full overflow-y-auto pr-2"><TribeManager serverId={selectedServerId} /></div>}
                    {activeTab === 'dinos' && <div className="h-full overflow-y-auto pr-2"><DinoManager serverId={selectedServerId} /></div>}
                    {activeTab === 'security' && <div className="h-full overflow-y-auto pr-2"><SecurityManager serverId={selectedServerId} /></div>}
                    {activeTab === 'automation' && <div className="h-full overflow-y-auto pr-2"><Automation serverId={selectedServerId} /></div>}
                    {activeTab === 'network' && <div className="h-full overflow-y-auto pr-2"><NetworkManager serverId={selectedServerId} /></div>}
                    {activeTab === 'updates' && <div className="h-full overflow-y-auto pr-2"><UpdateManager serverId={selectedServerId} /></div>}
                </div>
            )}
            {/* Ban Manager Modal */}
            {showBanManager && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl relative">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                            <Ban className="w-5 h-5 mr-2 text-red-400" />
                            Manage Banned Players
                        </h3>

                        {isLoadingBans ? (
                            <div className="py-8 text-center text-slate-400">Loading ban list...</div>
                        ) : (
                            <div className="space-y-4">
                                <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
                                    {bannedPlayers.length === 0 ? (
                                        <p className="text-slate-500 text-center py-4">No banned players found in BanList.txt</p>
                                    ) : (
                                        bannedPlayers.map((id, i) => (
                                            <div key={i} className="flex items-center justify-between bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                                                <span className="text-slate-300 font-mono text-sm">{id}</span>
                                                <button
                                                    onClick={() => handleUnban(id)}
                                                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20 p-2 rounded transition-colors text-xs font-bold"
                                                >
                                                    UNBAN
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <div className="pt-4 border-t border-slate-700/50">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Steam ID to ban..."
                                            className="bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white flex-1 text-sm font-mono focus:outline-none focus:border-sky-500"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    const val = (e.target as HTMLInputElement).value;
                                                    if (val) handleBan(val);
                                                    (e.target as HTMLInputElement).value = '';
                                                }
                                            }}
                                        />
                                        <button className="bg-red-500/10 text-red-500 border border-red-500/20 px-4 py-2 rounded hover:bg-red-500 hover:text-white transition-colors text-sm font-bold">
                                            BAN
                                        </button>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2">
                                        Modifying: ShooterGame/Saved/BanList.txt
                                    </p>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={() => setShowBanManager(false)}
                            className="absolute top-4 right-4 text-slate-500 hover:text-white"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
