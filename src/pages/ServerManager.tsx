import { useState, useEffect } from 'react';
import { Plus, Play, Square, RotateCw, Trash2, Download, Settings, Terminal, Globe, Shield } from 'lucide-react';
import { useServerStore } from '../stores/serverStore';
import { cn } from '../utils/helpers';
import InstallServerDialog from '../components/server/InstallServerDialog';
import { startServer, stopServer, restartServer, deleteServer, getAllServers, updateServerGraceful, setAutoRestart } from '../utils/tauri';
import toast from 'react-hot-toast';

import { useNavigate } from 'react-router-dom';

export default function ServerManager() {
    const navigate = useNavigate();
    const { servers, setServers, removeServer, updateServerStatus } = useServerStore();
    const [showInstallDialog, setShowInstallDialog] = useState(false);

    useEffect(() => {
        // Initial fetch
        getAllServers().then(setServers).catch(console.error);

        // Poll for updates
        const interval = setInterval(() => {
            getAllServers().then(setServers).catch(console.error);
        }, 5000);

        return () => clearInterval(interval);
    }, [setServers]);

    const handleStartServer = async (serverId: number) => {
        try {
            updateServerStatus(serverId, 'starting');
            await startServer(serverId);
            updateServerStatus(serverId, 'running');
            toast.success('Server started successfully');
        } catch (error) {
            updateServerStatus(serverId, 'stopped');
            toast.error(`Failed to start server: ${error}`);
        }
    };

    const handleStopServer = async (serverId: number) => {
        try {
            await stopServer(serverId);
            updateServerStatus(serverId, 'stopped');
            toast.success('Server stopped successfully');
        } catch (error) {
            toast.error(`Failed to stop server: ${error}`);
        }
    };

    const handleRestartServer = async (serverId: number) => {
        try {
            updateServerStatus(serverId, 'starting');
            await restartServer(serverId);
            updateServerStatus(serverId, 'running');
            toast.success('Server restarted successfully');
        } catch (error) {
            toast.error(`Failed to restart server: ${error}`);
        }
    };

    const handleDeleteServer = async (serverId: number) => {
        if (!confirm('Are you sure you want to delete this server? This action cannot be undone.')) {
            return;
        }

        try {
            await deleteServer(serverId);
            removeServer(serverId);
            toast.success('Server deleted successfully');
        } catch (error) {
            toast.error(`Failed to delete server: ${error}`);
        }
    };

    const handleUpdateServer = async (serverId: number) => {
        try {
            // Optimistic update
            updateServerStatus(serverId, 'updating');
            toast.loading('Starting Graceful Update (Notify -> Save -> Update)...', { duration: 5000 });

            await updateServerGraceful(serverId);

            toast.success('Update process initiated!');
        } catch (error) {
            updateServerStatus(serverId, 'stopped'); // or revert to previous
            toast.error(`Failed to update server: ${error}`);
        }
    };

    const handleToggleAutoRestart = async (serverId: number, enabled: boolean) => {
        try {
            // Optimistic update
            const updated = servers.map(s => {
                if (s.id === serverId) {
                    return { ...s, config: { ...s.config, autoRestart: enabled } };
                }
                return s;
            });
            setServers(updated);

            await setAutoRestart(serverId, enabled);
            toast.success(`Auto-Restart ${enabled ? 'Enabled' : 'Disabled'}`);
        } catch (error) {
            // Revert on failure involves refetching or complexity, keeping simple for mvp
            toast.error(`Failed to toggle auto-restart: ${error}`);
            getAllServers().then(setServers); // Revert by refetch
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-violet-400">
                        Server Manager
                    </h1>
                    <p className="text-slate-400 mt-2 text-lg">Deploy and manage your ARK instances</p>
                </div>
                <button
                    onClick={() => setShowInstallDialog(true)}
                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white rounded-xl transition-all shadow-lg shadow-sky-500/20 font-medium group"
                >
                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                    <span>Deploy Server</span>
                </button>
            </div>

            {/* Server List */}
            {servers.length === 0 ? (
                <div className="glass-panel rounded-2xl p-16 text-center border-2 border-dashed border-slate-700/50">
                    <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Plus className="w-10 h-10 text-slate-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">No Servers Installed</h3>
                    <p className="text-slate-400 mb-8 max-w-md mx-auto">
                        Your server fleet is currently empty. Launch your first ARK server to begin your journey.
                    </p>
                    <button
                        onClick={() => setShowInstallDialog(true)}
                        className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors border border-slate-700"
                    >
                        Install Your First Server
                    </button>
                </div>
            ) : (
                <div className="grid gap-6">
                    {servers.map((server) => (
                        <div
                            key={server.id}
                            className="glass-panel rounded-2xl p-6 hover:border-sky-500/30 transition-all group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-sky-500/5 to-transparent rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>

                            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                {/* Server Info */}
                                <div className="flex items-start space-x-6">
                                    <div className="relative mt-1">
                                        <div className={cn(
                                            'w-4 h-4 rounded-full',
                                            server.status === 'running' && 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]',
                                            server.status === 'stopped' && 'bg-slate-500',
                                            server.status === 'crashed' && 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]',
                                            server.status === 'starting' && 'bg-yellow-500 animate-pulse',
                                            server.status === 'updating' && 'bg-blue-500 animate-pulse'
                                        )} />
                                        {server.status === 'running' && (
                                            <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-20"></div>
                                        )}
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="text-xl font-bold text-white group-hover:text-sky-400 transition-colors">
                                                {server.name}
                                            </h3>
                                            <span className={cn(
                                                'px-2.5 py-0.5 rounded-md text-xs font-bold border',
                                                server.status === 'running' && 'bg-green-500/10 text-green-400 border-green-500/20',
                                                server.status === 'stopped' && 'bg-slate-500/10 text-slate-400 border-slate-500/20',
                                                server.status === 'crashed' && 'bg-red-500/10 text-red-400 border-red-500/20',
                                                server.status === 'starting' && 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
                                                server.status === 'updating' && 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                            )}>
                                                {server.status.toUpperCase()}
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                                            <div className="flex items-center gap-1.5">
                                                <Globe className="w-4 h-4 text-slate-500" />
                                                <span>{server.config.mapName}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Terminal className="w-4 h-4 text-slate-500" />
                                                <span className="font-mono">Port {server.ports.gamePort}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Shield className="w-4 h-4 text-slate-500" />
                                                <span>v32.1.0</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-3">
                                    {server.status === 'stopped' || server.status === 'crashed' ? (
                                        <button
                                            onClick={() => handleStartServer(server.id)}
                                            className="p-2.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 rounded-lg transition-all hover:scale-105 active:scale-95"
                                            title="Start Server"
                                        >
                                            <Play className="w-5 h-5 fill-current" />
                                        </button>
                                    ) : server.status === 'running' ? (
                                        <button
                                            onClick={() => handleStopServer(server.id)}
                                            className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg transition-all hover:scale-105 active:scale-95"
                                            title="Stop Server"
                                        >
                                            <Square className="w-5 h-5 fill-current" />
                                        </button>
                                    ) : null}

                                    <button
                                        onClick={() => handleRestartServer(server.id)}
                                        disabled={server.status === 'stopped'}
                                        className="p-2.5 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/20 rounded-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                        title="Restart Server"
                                    >
                                        <RotateCw className="w-5 h-5" />
                                    </button>

                                    <div className="w-px h-8 bg-slate-700/50 mx-1"></div>

                                    <button
                                        onClick={() => handleUpdateServer(server.id)}
                                        className="p-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-lg transition-all hover:scale-105 active:scale-95"
                                        title="Update Server"
                                    >
                                        <Download className="w-5 h-5" />
                                    </button>

                                    <button
                                        onClick={() => navigate('/config', { state: { serverId: server.id } })}
                                        className="p-2.5 bg-slate-700/30 hover:bg-slate-700/50 text-slate-300 border border-slate-600/30 rounded-lg transition-all hover:scale-105 active:scale-95"
                                        title="Server Settings"
                                    >
                                        <Settings className="w-5 h-5" />
                                    </button>

                                    <button
                                        onClick={() => handleDeleteServer(server.id)}
                                        className="p-2.5 bg-slate-700/30 hover:bg-red-500/20 text-slate-300 hover:text-red-400 border border-slate-600/30 hover:border-red-500/20 rounded-lg transition-all hover:scale-105 active:scale-95"
                                        title="Delete Server"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Server Details Footer */}
                            <div className="mt-6 pt-4 border-t border-slate-700/30 grid grid-cols-2 md:grid-cols-5 gap-6 text-sm">
                                <div>
                                    <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold mb-1">Install Path</p>
                                    <p className="text-slate-300 font-mono text-xs truncate" title={server.installPath}>{server.installPath}</p>
                                </div>
                                <div>
                                    <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold mb-1">Max Players</p>
                                    <p className="text-slate-300">{server.config.maxPlayers} Survivors</p>
                                </div>
                                <div>
                                    <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold mb-1">Session Name</p>
                                    <p className="text-slate-300 truncate">{server.config.sessionName}</p>
                                </div>
                                <div>
                                    <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold mb-1">Connection</p>
                                    <p className="text-slate-300 font-mono text-xs">
                                        {server.ports.gamePort} / {server.ports.queryPort}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold mb-1">Process</p>
                                    <div className="flex items-center justify-between">
                                        <p className="text-slate-300 font-mono text-xs">PID: {server.pid || 'N/A'}</p>
                                        <label className="flex items-center cursor-pointer ml-2" title="Toggle Auto-Restart on Crash">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={server.config.autoRestart || false}
                                                onChange={(e) => handleToggleAutoRestart(server.id, e.target.checked)}
                                            />
                                            <div className="w-7 h-4 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-green-500 relative"></div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Install Server Dialog */}
            {showInstallDialog && (
                <InstallServerDialog onClose={() => setShowInstallDialog(false)} />
            )}
        </div>
    );
}
