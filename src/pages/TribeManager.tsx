import { useState, useEffect } from 'react';
import { Trash2, ShieldAlert, FileText, RefreshCw } from 'lucide-react';
import { cn, formatBytes } from '../utils/helpers';
import { getTribeFiles, deleteTribe, TribeFile } from '../utils/tauri';
import toast from 'react-hot-toast';
import { useServerStore } from '../stores/serverStore';

export default function TribeManager({ serverId }: { serverId?: number }) {
    const { servers } = useServerStore();
    const [internalServerId, setInternalServerId] = useState<number | null>(null);
    const selectedServerId = serverId || internalServerId;
    const [files, setFiles] = useState<TribeFile[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!serverId && servers.length > 0 && !internalServerId) {
            // Optional: auto-select first if standalone
        }
    }, [servers, internalServerId, serverId]);

    useEffect(() => {
        if (selectedServerId) {
            loadFiles();
        } else {
            setFiles([]);
        }
    }, [selectedServerId]);

    const loadFiles = async () => {
        if (!selectedServerId) return;
        setIsLoading(true);
        try {
            const list = await getTribeFiles(selectedServerId);
            setFiles(list);
        } catch (error) {
            console.error('Failed to load tribe files:', error);
            toast.error('Failed to load tribe files');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (fileName: string) => {
        if (!selectedServerId) return;
        if (!confirm(`Are you sure you want to delete tribe file "${fileName}"? This will WIPE the tribe's structures/tames.`)) return;

        try {
            await deleteTribe(selectedServerId, fileName);
            toast.success('Tribe file deleted');
            loadFiles();
        } catch (error) {
            toast.error(`Failed to delete file: ${error}`);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            {!serverId && (
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-violet-400">
                            Tribe Management
                        </h1>
                        <p className="text-slate-400 mt-2 text-lg">Manage tribe data files (.arktribe)</p>
                    </div>

                    <div className="flex items-center space-x-3">
                        <span className="text-slate-400 text-sm">Target Server:</span>
                        <select
                            value={selectedServerId || ''}
                            onChange={(e) => setInternalServerId(Number(e.target.value))}
                            className="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 min-w-[200px]"
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
                <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                    <ShieldAlert className="w-16 h-16 mb-4 opacity-50" />
                    <p>Select a server to manage tribes</p>
                </div>
            ) : (
                <div className="glass-panel rounded-2xl overflow-hidden flex flex-col h-[calc(100vh-250px)]">
                    <div className="p-6 border-b border-slate-700/50 flex justify-between items-center">
                        <h3 className="text-xl font-bold text-white flex items-center">
                            <FileText className="w-5 h-5 mr-2 text-sky-400" />
                            Tribe Files ({files.length})
                        </h3>
                        <button
                            onClick={loadFiles}
                            disabled={isLoading}
                            className="p-2 hover:bg-slate-700/50 rounded-lg text-slate-400 hover:text-white transition-colors"
                        >
                            <RefreshCw className={cn("w-5 h-5", isLoading && "animate-spin")} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-800/50 sticky top-0 backdrop-blur-md">
                                <tr>
                                    <th className="p-4 text-slate-400 font-medium text-sm">File Name</th>
                                    <th className="p-4 text-slate-400 font-medium text-sm">Size</th>
                                    <th className="p-4 text-slate-400 font-medium text-sm">Last Modified</th>
                                    <th className="p-4 text-slate-400 font-medium text-sm text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50">
                                {files.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-slate-500">
                                            No .arktribe files found in SavedArks directory.
                                        </td>
                                    </tr>
                                ) : (
                                    files.map((file) => (
                                        <tr key={file.name} className="group hover:bg-slate-700/20 transition-colors">
                                            <td className="p-4 text-white font-mono text-sm">{file.name}</td>
                                            <td className="p-4 text-slate-300 text-sm">{formatBytes(file.size)}</td>
                                            <td className="p-4 text-slate-300 text-sm">{file.last_modified}</td>
                                            <td className="p-4 text-right">
                                                <button
                                                    onClick={() => handleDelete(file.name)}
                                                    className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors border border-red-500/20 opacity-0 group-hover:opacity-100"
                                                    title="Wipe Tribe (Delete File)"
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
                </div>
            )}
        </div>
    );
}
