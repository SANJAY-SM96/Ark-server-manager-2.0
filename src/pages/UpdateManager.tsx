import { useState, useEffect } from 'react';
import { CloudDownload, RefreshCw, AlertTriangle, Terminal } from 'lucide-react';
import { useServerStore } from '../stores/serverStore';
import { updateServer, getServerVersion } from '../utils/tauri';
import { cn } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function UpdateManager({ serverId }: { serverId?: number }) {
    const { servers, refreshServers } = useServerStore();
    const [internalServerId, setInternalServerId] = useState<number | null>(null);
    const selectedServerId = serverId || internalServerId;
    const [installedVersion, setInstalledVersion] = useState<string>('Unknown');
    const [isChecking, setIsChecking] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        if (selectedServerId) {
            checkVersion();
        } else {
            setInstalledVersion('Unknown');
        }
    }, [selectedServerId]);

    const checkVersion = async () => {
        if (!selectedServerId) return;
        setIsChecking(true);
        try {
            const version = await getServerVersion(selectedServerId);
            setInstalledVersion(version);
        } catch (error) {
            console.error('Failed to get version', error);
            setInstalledVersion('Error');
        } finally {
            setIsChecking(false);
        }
    };

    const handleUpdate = async () => {
        if (!selectedServerId) return;

        const confirm = await window.confirm('Updating the server involves stopping it if it is running. Continue?');
        if (!confirm) return;

        setIsUpdating(true);
        try {
            toast.loading('Update process started. Check terminal for progress.', { duration: 5000 });
            await updateServer(selectedServerId);
            toast.success('Update completed successfully!');
            await checkVersion();
            await refreshServers(); // Refresh status
        } catch (error) {
            toast.error('Update failed: ' + error);
        } finally {
            setIsUpdating(false);
        }
    };

    const selectedServer = servers.find(s => s.id === selectedServerId);

    return (
        <div className="space-y-8 animate-in fade-in duration-500 h-[calc(100vh-100px)] overflow-y-auto pr-2">
            {/* Header */}
            {!serverId && (
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-500">
                            Update Manager
                        </h1>
                        <p className="text-slate-400 mt-2 text-lg">Version Control & SteamCMD Updates</p>
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
                <div className="flex flex-col items-center justify-center py-24 text-slate-500">
                    <CloudDownload className="w-16 h-16 mb-4 opacity-50" />
                    <p>Select a server to view version and update options</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* Version Status */}
                    <div className="glass-panel p-6 rounded-xl space-y-6">
                        <div className="flex items-center space-x-3 text-white mb-4">
                            <Terminal className="w-6 h-6 text-emerald-400" />
                            <h2 className="text-xl font-bold">Current Installation</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 flex items-center justify-between">
                                <span className="text-slate-400">Build ID</span>
                                <div className="flex items-center space-x-2">
                                    {isChecking ? (
                                        <RefreshCw className="w-4 h-4 text-emerald-500 animate-spin" />
                                    ) : (
                                        <span className="text-white font-mono font-bold text-lg">{installedVersion}</span>
                                    )}
                                    <button onClick={checkVersion} className="p-1 hover:bg-slate-700 rounded transition-colors">
                                        <RefreshCw className="w-4 h-4 text-slate-400" />
                                    </button>
                                </div>
                            </div>
                            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 flex items-center justify-between">
                                <span className="text-slate-400">Server Status</span>
                                <div className="flex items-center space-x-2">
                                    <div className={cn(
                                        "w-3 h-3 rounded-full",
                                        selectedServer?.status === 'running' ? "bg-green-500" :
                                            selectedServer?.status === 'stopped' ? "bg-red-500" : "bg-yellow-500"
                                    )} />
                                    <span className="text-white capitalize">{selectedServer?.status || 'Unknown'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Update Action */}
                    <div className="glass-panel p-6 rounded-xl space-y-6 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center space-x-3 text-white mb-4">
                                <CloudDownload className="w-6 h-6 text-emerald-400" />
                                <h2 className="text-xl font-bold">Update Server</h2>
                            </div>

                            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 text-sm text-yellow-200 flex items-start space-x-3 mb-6">
                                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                                <p>
                                    Updates will force validation of local files. This process may take time depending on your download speed and disk I/O.
                                    The server will be stopped automatically.
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={handleUpdate}
                            disabled={isUpdating || !selectedServer}
                            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-lg transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3"
                        >
                            {isUpdating ? (
                                <>
                                    <RefreshCw className="w-6 h-6 animate-spin" />
                                    <span>Updating... (Check Console)</span>
                                </>
                            ) : (
                                <>
                                    <CloudDownload className="w-6 h-6" />
                                    <span>Update & Validate Now</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
