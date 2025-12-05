import { useState, useEffect } from 'react';
import {
    Folder, File as FileIcon, ArrowLeft, Trash2,
    FileText, HardDrive, RefreshCw, Archive, Loader2, X, Save
} from 'lucide-react';
import { cn } from '../utils/helpers';
import { useServerStore } from '../stores/serverStore';
import {
    listFiles, readFileContent, saveFileContent, deleteFilePath,
    zipDirectory, unzipFile, FileInfo
} from '../utils/tauri';
import toast from 'react-hot-toast';

const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default function FileManager() {
    const { servers } = useServerStore();
    const [selectedServerId, setSelectedServerId] = useState<number | null>(null);
    const [currentPath, setCurrentPath] = useState<string>('');
    const [files, setFiles] = useState<FileInfo[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [editorContent, setEditorContent] = useState<string | null>(null);
    const [editingFile, setEditingFile] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const selectedServer = servers.find(s => s.id === selectedServerId);

    // Initial load
    useEffect(() => {
        if (servers.length > 0 && !selectedServerId) {
            setSelectedServerId(servers[0].id);
        }
    }, [servers, selectedServerId]);

    // Update path when server changes
    useEffect(() => {
        if (selectedServer && !currentPath) {
            setCurrentPath(selectedServer.installPath);
        }
    }, [selectedServer, currentPath]);

    // Fetch files
    useEffect(() => {
        if (!currentPath) return;
        loadFiles(currentPath);

        // Auto-refresh every 5 seconds to keep "real-time" sync with server logs/files
        const interval = setInterval(() => {
            loadFiles(currentPath, true);
        }, 5000);

        return () => clearInterval(interval);
    }, [currentPath]);

    const loadFiles = async (path: string, silent = false) => {
        if (!silent) setIsLoading(true);
        try {
            const items = await listFiles(path);
            setFiles(items);
        } catch (error) {
            console.error(error);
            if (!silent) toast.error('Failed to list files');
        } finally {
            if (!silent) setIsLoading(false);
        }
    };

    const handleNavigate = (path: string) => {
        setCurrentPath(path);
    };

    const handleUpLevel = () => {
        // Simple string manipulation for now, ideally use path module
        // Windows/Linux separator handling
        const separator = currentPath.includes('\\') ? '\\' : '/';
        const parts = currentPath.split(separator);
        if (parts.length > 2) { // Determine a reasonable root?
            parts.pop();
            // Prevent going above drive root?
            // List files handles permission/existence.
            // If we go too far up, it's just system files.
            handleNavigate(parts.join(separator) || separator);
        } else if (parts.length === 2 && parts[1] === '') {
            // Root /
        } else {
            // Windows Drive letter ex: C:
            parts.pop();
            handleNavigate(parts.join(separator) + separator);
        }
    };

    const handleFileClick = async (file: FileInfo) => {
        if (file.is_dir) {
            handleNavigate(file.path);
        } else {
            // Check extension
            if (file.name.match(/\.(txt|ini|cfg|json|log|xml|bat|sh)$/i)) {
                setIsLoading(true);
                try {
                    const content = await readFileContent(file.path);
                    setEditorContent(content);
                    setEditingFile(file.path);
                } catch (e) {
                    toast.error('Failed to read file');
                } finally {
                    setIsLoading(false);
                }
            } else if (file.name.match(/\.zip$/i)) {
                if (confirm(`Unzip ${file.name} here?`)) {
                    const toastId = toast.loading('Unzipping...');
                    try {
                        await unzipFile(file.path, currentPath);
                        toast.success('Unzipped successfully', { id: toastId });
                        loadFiles(currentPath);
                    } catch (e) {
                        toast.error('Unzip failed', { id: toastId });
                    }
                }
            } else {
                toast('File preview not supported for this type.');
            }
        }
    };

    const handleSaveFile = async () => {
        if (!editingFile || editorContent === null) return;
        setIsSaving(true);
        try {
            await saveFileContent(editingFile, editorContent);
            toast.success('File saved');
            setEditingFile(null);
            setEditorContent(null);
            loadFiles(currentPath);
        } catch (e) {
            toast.error('Failed to save file');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (file: FileInfo) => {
        if (!confirm(`Are you sure you want to delete ${file.name}?`)) return;
        try {
            await deleteFilePath(file.path);
            toast.success('Deleted successfully');
            loadFiles(currentPath);
        } catch (e) {
            toast.error('Failed to delete');
        }
    };

    const handleZipFolder = async (folder: FileInfo) => {
        if (!folder.is_dir) return;
        const dest = `${folder.path}.zip`;
        const toastId = toast.loading('Zipping folder...');
        try {
            await zipDirectory(folder.path, dest);
            toast.success('Folder zipped', { id: toastId });
            loadFiles(currentPath);
        } catch (e) {
            toast.error('Failed to zip folder', { id: toastId });
        }
    };

    return (
        <div className="h-full flex flex-col space-y-4 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                        File Manager
                    </h1>
                    <p className="text-slate-400 mt-1">Manage server files and backups</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative min-w-[200px]">
                        <HardDrive className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <select
                            value={selectedServerId || ''}
                            onChange={(e) => {
                                const id = Number(e.target.value);
                                setSelectedServerId(id);
                                const s = servers.find(srv => srv.id === id);
                                if (s) setCurrentPath(s.installPath);
                            }}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none text-sm"
                        >
                            {servers.map(server => (
                                <option key={server.id} value={server.id}>{server.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Path Bar */}
            <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 flex items-center gap-3 overflow-hidden">
                <button onClick={handleUpLevel} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                    <ArrowLeft className="w-4 h-4 text-slate-300" />
                </button>
                <div className="flex-1 font-mono text-sm text-slate-300 truncate">
                    {currentPath || 'Select a server...'}
                </div>
                <button onClick={() => loadFiles(currentPath)} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                    <RefreshCw className={cn("w-4 h-4 text-slate-300", isLoading && "animate-spin")} />
                </button>
            </div>

            {/* File List */}
            <div className="flex-1 overflow-y-auto glass-panel rounded-xl custom-scrollbar p-2">
                {files.length === 0 && !isLoading && (
                    <div className="text-center py-20 text-slate-500">
                        Folder is empty
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {files.map((file) => (
                        <div
                            key={file.path}
                            className="group flex flex-col p-4 bg-slate-900/40 border border-slate-800 rounded-xl hover:bg-slate-800 hover:border-slate-600 transition-all cursor-pointer relative"
                            onClick={() => handleFileClick(file)}
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div className={cn(
                                    "p-2 rounded-lg",
                                    file.is_dir ? "bg-amber-500/10 text-amber-500" : "bg-blue-500/10 text-blue-500"
                                )}>
                                    {file.is_dir ? <Folder className="w-6 h-6" /> : <FileIcon className="w-6 h-6" />}
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                    {file.is_dir && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleZipFolder(file); }}
                                            className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white"
                                            title="Zip Folder"
                                        >
                                            <Archive className="w-4 h-4" />
                                        </button>
                                    )}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDelete(file); }}
                                        className="p-1.5 hover:bg-red-500/20 rounded text-slate-400 hover:text-red-400"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <div className="font-medium text-slate-200 truncate text-sm" title={file.name}>
                                {file.name}
                            </div>
                            <div className="text-xs text-slate-500 mt-1 flex justify-between">
                                <span>{file.is_dir ? 'Folder' : formatSize(file.size)}</span>
                                {file.modified && (
                                    <span>{new Date(file.modified * 1000).toLocaleDateString()}</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Editor Modal Overlay */}
            {editingFile && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-4 border-b border-slate-700 bg-slate-800/50 rounded-t-2xl">
                            <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5 text-emerald-400" />
                                <span className="font-mono text-sm text-slate-300 truncate max-w-md">{editingFile}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleSaveFile}
                                    disabled={isSaving}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center gap-2 text-sm font-medium transition-colors disabled:opacity-50"
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Save
                                </button>
                                <button
                                    onClick={() => { setEditingFile(null); setEditorContent(null); }}
                                    className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 p-0 relative">
                            <textarea
                                value={editorContent || ''}
                                onChange={(e) => setEditorContent(e.target.value)}
                                className="w-full h-full bg-slate-950 p-4 font-mono text-sm text-slate-300 focus:outline-none resize-none leading-relaxed custom-scrollbar"
                                spellCheck={false}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
