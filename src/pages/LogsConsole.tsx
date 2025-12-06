import { useState, useEffect, useRef } from 'react';
import { Filter, Send, Terminal, Server as ServerIcon } from 'lucide-react';
import { cn } from '../utils/helpers';
import { listen } from '@tauri-apps/api/event';
import { useServerStore } from '../stores/serverStore';
import { useUIStore } from '../stores/uiStore';
import { invoke } from '@tauri-apps/api/core';

interface LogEntry {
    time: string;
    level: 'info' | 'warning' | 'error';
    message: string;
    serverId: number;
}

interface LogEvent {
    serverId: number;
    line: string;
    type: 'stdout' | 'stderr';
}

export default function LogsConsole() {
    const [command, setCommand] = useState('');
    const [filter, setFilter] = useState('all');
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [selectedServerId, setSelectedServerId] = useState<number | null>(null);
    const logsEndRef = useRef<HTMLDivElement>(null);

    const { servers, activeServer } = useServerStore();
    const { gameMode } = useUIStore();

    // Initialize selected server
    useEffect(() => {
        if (activeServer) {
            setSelectedServerId(activeServer.id);
        } else if (servers.length > 0) {
            setSelectedServerId(servers[0].id);
        }
    }, [servers, activeServer]);

    // Scroll to bottom on new logs
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs, filter]);

    // Listen for server logs
    useEffect(() => {
        const unlisten = listen<LogEvent>('server-console-output', (event) => {
            const { serverId, line, type } = event.payload;
            const now = new Date();
            const timeStr = now.toLocaleTimeString('en-US', { hour12: false });

            let level: 'info' | 'warning' | 'error' = 'info';
            const lowerLine = line.toLowerCase();

            if (type === 'stderr' || lowerLine.includes('error') || lowerLine.includes('failed') || lowerLine.includes('exception')) {
                level = 'error';
            } else if (lowerLine.includes('warning') || lowerLine.includes('warn')) {
                level = 'warning';
            }

            setLogs((prev) => {
                const newLog = {
                    time: timeStr,
                    level,
                    message: line,
                    serverId
                };
                // Keep last 1000 logs
                const newLogs = [...prev, newLog];
                if (newLogs.length > 1000) return newLogs.slice(newLogs.length - 1000);
                return newLogs;
            });
        });

        return () => {
            unlisten.then((f) => f());
        };
    }, []);

    const sendCommand = async () => {
        if (!selectedServerId || !command.trim()) return;

        try {
            await invoke('send_rcon_command', {
                serverId: selectedServerId,
                command: command
            });

            // Add command execution log locally
            const now = new Date();
            setLogs(prev => [...prev, {
                time: now.toLocaleTimeString('en-US', { hour12: false }),
                level: 'info',
                message: `> ${command}`,
                serverId: selectedServerId
            }]);

            setCommand('');
        } catch (error) {
            console.error('Failed to send command:', error);
            const now = new Date();
            setLogs(prev => [...prev, {
                time: now.toLocaleTimeString('en-US', { hour12: false }),
                level: 'error',
                message: `Failed to send command: ${error}`,
                serverId: selectedServerId
            }]);
        }
    };

    // Filter logs for display
    const visibleLogs = logs.filter(log => {
        const matchesServer = selectedServerId ? log.serverId === selectedServerId : true;
        const matchesFilter = filter === 'all' || log.level === filter;
        return matchesServer && matchesFilter;
    });

    return (
        <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
            <div className="flex items-center justify-between shrink-0">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Terminal className="w-8 h-8 text-primary-500" />
                        Logs Console
                    </h1>
                    <p className="text-dark-400 mt-1">Real-time server output and RCON commands</p>
                </div>

                <div className="flex items-center space-x-3">
                    {/* Server Selector */}
                    <div className="flex items-center space-x-2 bg-dark-800 rounded-lg px-3 py-2 border border-dark-700">
                        <ServerIcon className="w-4 h-4 text-dark-400" />
                        <select
                            value={selectedServerId || ''}
                            onChange={(e) => setSelectedServerId(Number(e.target.value))}
                            className="bg-transparent text-white focus:outline-none text-sm min-w-[150px]"
                        >
                            <option value="" disabled>Select Server</option>
                            {servers.filter(s => s.serverType === gameMode).map((server) => (
                                <option key={server.id} value={server.id}>
                                    {server.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="h-8 w-px bg-dark-700 mx-2" />

                    <Filter className="w-5 h-5 text-dark-500" />
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-600 text-sm"
                    >
                        <option value="all">All Logs</option>
                        <option value="info">Info</option>
                        <option value="warning">Warnings</option>
                        <option value="error">Errors</option>
                    </select>
                </div>
            </div>

            {/* Logs Area */}
            <div className="flex-1 bg-dark-950 border border-dark-800 rounded-xl p-4 font-mono text-sm overflow-hidden flex flex-col shadow-inner">
                <div className="flex-1 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                    {visibleLogs.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-dark-500 space-y-3">
                            <Terminal className="w-12 h-12 opacity-20" />
                            <p>No logs available for this server yet...</p>
                        </div>
                    ) : (
                        visibleLogs.map((log, index) => (
                            <div key={index} className="flex hover:bg-dark-900/50 -mx-2 px-2 rounded">
                                <span className="text-dark-500 shrink-0 w-24">[{log.time}]</span>
                                <span className={cn(
                                    'shrink-0 w-20 font-bold',
                                    log.level === 'info' && 'text-blue-400',
                                    log.level === 'warning' && 'text-yellow-400',
                                    log.level === 'error' && 'text-red-400'
                                )}>
                                    [{log.level.toUpperCase()}]
                                </span>
                                <span className="text-dark-300 break-all whitespace-pre-wrap">{log.message}</span>
                            </div>
                        ))
                    )}
                    <div ref={logsEndRef} />
                </div>
            </div>

            {/* Console Input */}
            <div className="flex space-x-2 shrink-0">
                <input
                    type="text"
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendCommand()}
                    placeholder={selectedServerId ? "Enter RCON command..." : "Select a server to send commands"}
                    disabled={!selectedServerId}
                    className="flex-1 px-4 py-3 bg-dark-900 border border-dark-800 rounded-lg text-white font-mono focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                />
                <button
                    onClick={sendCommand}
                    disabled={!selectedServerId || !command.trim()}
                    className="flex items-center space-x-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-dark-700 disabled:text-dark-500 text-white rounded-lg transition-colors"
                >
                    <Send className="w-4 h-4" />
                    <span>Send</span>
                </button>
            </div>
        </div>
    );
}
