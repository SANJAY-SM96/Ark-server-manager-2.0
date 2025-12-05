import { useState, useEffect } from 'react';
import { Shield, Lock, UserPlus, Trash2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { cn } from '../utils/helpers';
import { getWhitelist, addToWhitelist, removeFromWhitelist, setBattlEye } from '../utils/tauri';
import toast from 'react-hot-toast';
import { useServerStore } from '../stores/serverStore';

export default function SecurityManager({ serverId }: { serverId?: number }) {
    const { servers } = useServerStore();
    const [internalServerId, setInternalServerId] = useState<number | null>(null);
    const selectedServerId = serverId || internalServerId;
    const [whitelist, setWhitelist] = useState<string[]>([]);
    const [newSteamId, setNewSteamId] = useState('');
    const [battlEyeEnabled, setBattlEyeEnabled] = useState(true);

    useEffect(() => {
        if (selectedServerId) {
            loadData();
        } else {
            setWhitelist([]);
        }
    }, [selectedServerId]);

    const loadData = async () => {
        if (!selectedServerId) return;
        try {
            const list = await getWhitelist(selectedServerId);
            setWhitelist(list);

            // TODO: Fetch BattlEye status from server config if possible
        } catch (error) {
            console.error('Failed to load security data:', error);
            toast.error('Failed to load security settings');
        }
    };

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedServerId || !newSteamId.trim()) return;

        try {
            await addToWhitelist(selectedServerId, newSteamId.trim());
            toast.success('User added to whitelist');
            setNewSteamId('');
            loadData();
        } catch (error) {
            toast.error(`Failed to add user: ${error}`);
        }
    };

    const handleRemoveUser = async (steamId: string) => {
        if (!selectedServerId) return;
        if (!confirm(`Remove ${steamId} from whitelist?`)) return;

        try {
            await removeFromWhitelist(selectedServerId, steamId);
            toast.success('User removed');
            loadData();
        } catch (error) {
            toast.error(`Failed to remove user: ${error}`);
        }
    };

    const handleToggleBattlEye = async (enabled: boolean) => {
        if (!selectedServerId) return;
        try {
            await setBattlEye(selectedServerId, enabled);
            setBattlEyeEnabled(enabled);
            toast.success(`BattlEye ${enabled ? 'Enabled' : 'Disabled'} (Effect takes place on restart)`);
        } catch (error) {
            toast.error(`Failed to toggle BattlEye: ${error}`);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 h-[calc(100vh-100px)] flex flex-col">
            {/* Header */}
            {!serverId && (
                <div className="flex items-center justify-between shrink-0">
                    <div>
                        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">
                            Security Control
                        </h1>
                        <p className="text-slate-400 mt-2 text-lg">Anti-Cheat and Access Management</p>
                    </div>

                    <div className="flex items-center space-x-3">
                        <span className="text-slate-400 text-sm">Target Server:</span>
                        <select
                            value={selectedServerId || ''}
                            onChange={(e) => setInternalServerId(Number(e.target.value))}
                            className="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 min-w-[200px]"
                        >
                            <option value="">Select Server...</option>
                            {servers.map(server => (
                                <option key={server.id} value={server.id}>{server.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            {!selectedServerId ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                    <Shield className="w-16 h-16 mb-4 opacity-50" />
                    <p>Select a server to manage security</p>
                </div>
            ) : (
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 overflow-hidden">

                    {/* BattlEye Panel */}
                    <div className="glass-panel p-6 rounded-2xl flex flex-col space-y-6">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3">
                                <div className={cn("p-3 rounded-xl", battlEyeEnabled ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500")}>
                                    <ShieldCheck className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">BattlEye Anti-Cheat</h3>
                                    <p className="text-xs text-slate-400">Industry standard protection</p>
                                </div>
                            </div>

                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={battlEyeEnabled}
                                    onChange={(e) => handleToggleBattlEye(e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                            </label>
                        </div>

                        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                            <div className="flex items-center space-x-2 text-amber-400 mb-2">
                                <AlertTriangle className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase">Restart Required</span>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Toggling BattlEye requires a server restart to take effect. Ensure your server is stopped before changing this setting for best results.
                            </p>
                        </div>
                    </div>

                    {/* Whitelist Panel */}
                    <div className="glass-panel p-0 rounded-2xl lg:col-span-2 flex flex-col">
                        <div className="p-6 border-b border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center space-x-3">
                                <Lock className="w-5 h-5 text-sky-400" />
                                <h3 className="text-lg font-bold text-white">Whitelist Access</h3>
                            </div>

                            <form onSubmit={handleAddUser} className="flex items-center space-x-2">
                                <input
                                    type="text"
                                    placeholder="Steam ID (64-bit)"
                                    value={newSteamId}
                                    onChange={(e) => setNewSteamId(e.target.value)}
                                    className="bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-sky-500 w-48"
                                />
                                <button
                                    type="submit"
                                    disabled={!newSteamId}
                                    className="p-2 bg-sky-500/10 text-sky-400 hover:bg-sky-500 hover:text-white rounded-lg transition-colors disabled:opacity-50"
                                >
                                    <UserPlus className="w-4 h-4" />
                                </button>
                            </form>
                        </div>

                        <div className="flex-1 overflow-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-800/50 sticky top-0 backdrop-blur-md">
                                    <tr>
                                        <th className="p-4 text-slate-400 font-medium text-sm">Steam ID</th>
                                        <th className="p-4 text-slate-400 font-medium text-sm text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700/50">
                                    {whitelist.length === 0 ? (
                                        <tr>
                                            <td colSpan={2} className="p-8 text-center text-slate-500">
                                                Whitelist is empty (Server is public)
                                            </td>
                                        </tr>
                                    ) : (
                                        whitelist.map((id) => (
                                            <tr key={id} className="group hover:bg-slate-700/20 transition-colors">
                                                <td className="p-4 text-white font-mono text-sm">{id}</td>
                                                <td className="p-4 text-right">
                                                    <button
                                                        onClick={() => handleRemoveUser(id)}
                                                        className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-3 bg-slate-800/30 text-center text-xs text-slate-500 border-t border-slate-700/50">
                            Modifies PlayersExclusiveJoinList.txt
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
}
