import { useState, useEffect } from 'react';
import { Network as NetworkIcon, Globe, Shield, Copy, Check, Info } from 'lucide-react';
import { useServerStore } from '../stores/serverStore';
import { getLocalIps, setNetworkSettings } from '../utils/tauri';

import toast from 'react-hot-toast';

export default function NetworkManager({ serverId }: { serverId?: number }) {
    const { servers } = useServerStore();
    const [internalServerId, setInternalServerId] = useState<number | null>(null);
    const selectedServerId = serverId || internalServerId;
    const [localIps, setLocalIps] = useState<string[]>([]);
    const [selectedIp, setSelectedIp] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Copy feedback state
    const [copiedPort, setCopiedPort] = useState<string | null>(null);

    useEffect(() => {
        loadIps();
    }, []);

    useEffect(() => {
        if (selectedServerId) {
            const server = servers.find(s => s.id === selectedServerId);
            if (server) {
                setSelectedIp(server.config.multihomeIp || '');
            }
        }
    }, [selectedServerId, servers]);

    const loadIps = async () => {
        try {
            const ips = await getLocalIps();
            setLocalIps(ips);
        } catch (error) {
            console.error('Failed to load IPs', error);
        }
    };

    const handleSave = async () => {
        if (!selectedServerId) return;
        setIsLoading(true);
        try {
            await setNetworkSettings(selectedServerId, selectedIp);
            toast.success('Network settings saved. Restart server to apply.');
        } catch (error) {
            toast.error('Failed to save settings');
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        setCopiedPort(label);
        toast.success(`Copied ${label} to clipboard`);
        setTimeout(() => setCopiedPort(null), 2000);
    };

    const selectedServer = servers.find(s => s.id === selectedServerId);

    return (
        <div className="space-y-8 animate-in fade-in duration-500 h-[calc(100vh-100px)] overflow-y-auto pr-2">
            {/* Header */}
            {!serverId && (
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-500">
                            Network Control
                        </h1>
                        <p className="text-slate-400 mt-2 text-lg">Port Forwarding & Interface Binding</p>
                    </div>

                    <div className="flex items-center space-x-3">
                        <span className="text-slate-400 text-sm">Target Server:</span>
                        <select
                            value={selectedServerId || ''}
                            onChange={(e) => setInternalServerId(Number(e.target.value))}
                            className="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]"
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
                    <NetworkIcon className="w-16 h-16 mb-4 opacity-50" />
                    <p>Select a server to configure network settings</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* MultiHome Configuration */}
                    <div className="glass-panel p-6 rounded-xl space-y-6">
                        <div className="flex items-center space-x-3 text-white mb-4">
                            <Globe className="w-6 h-6 text-blue-400" />
                            <h2 className="text-xl font-bold">MultiHome Binding</h2>
                        </div>

                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-sm text-blue-200 flex items-start space-x-3">
                            <Info className="w-5 h-5 shrink-0 mt-0.5" />
                            <p>
                                By default, ARK listens on all available network interfaces (0.0.0.0).
                                Use MultiHome to bind the server to a specific local IP address, useful for strict firewall rules or multiple NICs.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <label className="block text-sm font-medium text-slate-400">Bind to Network Interface</label>
                            <select
                                value={selectedIp}
                                onChange={(e) => setSelectedIp(e.target.value)}
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            >
                                <option value="">All Interfaces (0.0.0.0)</option>
                                {localIps.map(ip => (
                                    <option key={ip} value={ip}>{ip}</option>
                                ))}
                            </select>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <button
                                onClick={handleSave}
                                disabled={isLoading}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center space-x-2"
                            >
                                {isLoading ? <span>Saving...</span> : <span>Save Configuration</span>}
                            </button>
                        </div>
                    </div>

                    {/* Port Forwarding Guide */}
                    <div className="glass-panel p-6 rounded-xl space-y-6">
                        <div className="flex items-center space-x-3 text-white mb-4">
                            <Shield className="w-6 h-6 text-emerald-400" />
                            <h2 className="text-xl font-bold">Port Forwarding Guide</h2>
                        </div>

                        <div className="text-slate-400 text-sm mb-4">
                            Ensure these ports are forwarded in your router and allowed in Windows Firewall for external players to connect.
                        </div>

                        <div className="space-y-3">
                            {[
                                { name: 'Game Port', port: selectedServer?.ports?.gamePort, proto: 'UDP' },
                                { name: 'Query Port', port: selectedServer?.ports?.queryPort, proto: 'UDP' },
                                { name: 'RCON Port', port: selectedServer?.ports?.rconPort, proto: 'TCP' },
                            ].map((rule, idx) => (
                                <div key={idx} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 flex items-center justify-between group">
                                    <div className="flex items-center space-x-4">
                                        <div className="p-2 bg-slate-700 rounded text-slate-300 font-mono font-bold">
                                            {rule.proto}
                                        </div>
                                        <div>
                                            <div className="text-white font-medium">{rule.name}</div>
                                            <div className="text-slate-500 text-xs">Allow traffic on port {rule.port}</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <div className="text-xl font-mono text-emerald-400 font-bold px-3">
                                            {rule.port}
                                        </div>
                                        <button
                                            onClick={() => rule.port && copyToClipboard(rule.port.toString(), rule.name)}
                                            className="p-2 text-slate-500 hover:text-white transition-colors"
                                            title="Copy Port"
                                        >
                                            {copiedPort === rule.name ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg text-sm text-orange-200">
                            <strong>Note:</strong> If you change these ports in the Config Editor, remember to update your router's forwarding rules matching the new values.
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
