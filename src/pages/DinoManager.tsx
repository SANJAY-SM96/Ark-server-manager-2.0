import { useState } from 'react';
import { Skull, ShieldAlert, Zap } from 'lucide-react';
import { cn } from '../utils/helpers';
import { destroyWildDinos } from '../utils/tauri';
import toast from 'react-hot-toast';
import { useServerStore } from '../stores/serverStore';

export default function DinoManager({ serverId }: { serverId?: number }) {
    const { servers } = useServerStore();
    const [internalServerId, setInternalServerId] = useState<number | null>(null);
    const selectedServerId = serverId || internalServerId;
    const [isExecuting, setIsExecuting] = useState(false);

    const handleWipeWildDinos = async () => {
        if (!selectedServerId) return;
        if (!confirm('DANGER: This will destroy ALL wild dinos on the map. \n\nThis is useful if spawns are broken or you want to refresh high-level dinos. \n\nTamed dinos are safe. Are you sure?')) return;

        setIsExecuting(true);
        try {
            const res = await destroyWildDinos(selectedServerId);
            toast.success(`Command sent! Spawns are resetting.\nResponse: ${res}`);
        } catch (error) {
            toast.error(`Failed to wipe dinos. Is RCON connected?\nError: ${error}`);
        } finally {
            setIsExecuting(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 h-[calc(100vh-100px)] flex flex-col">
            {/* Header */}
            {!serverId && (
                <div className="flex items-center justify-between shrink-0">
                    <div>
                        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
                            Dino Management
                        </h1>
                        <p className="text-slate-400 mt-2 text-lg">Manage wild dinosaur populations</p>
                    </div>

                    <div className="flex items-center space-x-3">
                        <span className="text-slate-400 text-sm">Target Server:</span>
                        <select
                            value={selectedServerId || ''}
                            onChange={(e) => setInternalServerId(Number(e.target.value))}
                            className="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 min-w-[200px]"
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
                    <ShieldAlert className="w-16 h-16 mb-4 opacity-50" />
                    <p>Select a server to manage dinos</p>
                </div>
            ) : (
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Wild Dino Wipe Card */}
                    <div className="glass-panel p-8 rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-500/5 to-orange-500/5 flex flex-col items-center text-center space-y-4 hover:border-red-500/40 transition-all group">
                        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                            <Skull className="w-8 h-8 text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white">Wipe Wild Dinos</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            Destroys all untamed dinosaurs on the map. This forces a respawn cycle, which is useful if you can't find high-level dinos or if spawns are bugged.
                        </p>

                        <div className="flex-1" />

                        <button
                            onClick={handleWipeWildDinos}
                            disabled={isExecuting}
                            className={cn(
                                "w-full py-3 rounded-xl font-bold transition-all shadow-lg",
                                isExecuting
                                    ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                                    : "bg-gradient-to-r from-red-500 to-orange-600 text-white hover:shadow-red-500/20 active:scale-95"
                            )}
                        >
                            {isExecuting ? (
                                <span className="flex items-center justify-center">
                                    <Zap className="w-4 h-4 mr-2 animate-spin" />
                                    Executing...
                                </span>
                            ) : (
                                "Execute Wipe"
                            )}
                        </button>
                    </div>

                    {/* Placeholder for future features */}
                    <div className="glass-panel p-8 rounded-2xl border border-dashed border-slate-700/50 flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                        <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-2">
                            <Zap className="w-8 h-8 text-slate-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-500">Spawn Dinos</h3>
                        <p className="text-slate-600 text-sm">Coming Soon</p>
                    </div>
                </div>
            )}
        </div>
    );
}
