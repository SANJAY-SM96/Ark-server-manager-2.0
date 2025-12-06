import { useState, useEffect } from 'react';
import { Search, Download, X, Loader2, ExternalLink, ShoppingCart, Trash2, CheckCircle2 } from 'lucide-react';
import { cn } from '../utils/helpers';
import { searchMods, getInstalledMods, updateActiveMods, installModsBatch, uninstallMod } from '../utils/tauri';
import { ModInfo } from '../types';
import toast from 'react-hot-toast';
import { useServerStore } from '../stores/serverStore';
import { listen } from '@tauri-apps/api/event';

interface InstallProgress {
    modId: string;
    progress: number;
    status: 'pending' | 'downloading' | 'installed' | 'error';
}

export default function ModManager() {
    const [searchQuery, setSearchQuery] = useState('');
    const [serverType, setServerType] = useState<'ASE' | 'ASA'>('ASE');
    const [activeTab, setActiveTab] = useState<'available' | 'installed'>('available');
    const [mods, setMods] = useState<ModInfo[]>([]);
    const [cart, setCart] = useState<ModInfo[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { servers } = useServerStore();
    const [selectedServerId, setSelectedServerId] = useState<number | null>(null);
    const [installProgress, setInstallProgress] = useState<Record<string, InstallProgress>>({});
    const [isInstalling, setIsInstalling] = useState(false);

    // Auto-load popular mods or search
    // Auto-select first server
    useEffect(() => {
        if (servers.length > 0 && !selectedServerId) {
            setSelectedServerId(servers[0].id);
        }
    }, [servers, selectedServerId]);

    // Search mods when query changes
    useEffect(() => {
        const fetchMods = async () => {
            const searchTerm = searchQuery.trim();
            setIsLoading(true);
            try {
                const results = await searchMods(searchTerm, serverType);
                if (results.length === 1 && results[0].id === '0' && serverType === 'ASA') {
                    toast.error('CurseForge API Key required! Go to Settings to add it.', { duration: 5000 });
                    setMods([]);
                } else {
                    setMods(results);
                }
            } catch (error) {
                console.error('Failed to search mods:', error);
                setMods([]);
            } finally {
                setIsLoading(false);
            }
        };

        const timeoutId = setTimeout(() => {
            fetchMods();
        }, searchQuery.length > 0 ? 500 : 0);

        return () => clearTimeout(timeoutId);
    }, [searchQuery, serverType]);

    // Fetch installed mods when tab changes
    useEffect(() => {
        if (activeTab === 'installed' && selectedServerId) {
            loadInstalledMods();
        }
    }, [activeTab, selectedServerId]);

    const loadInstalledMods = async () => {
        if (!selectedServerId) return;
        setIsLoading(true);
        try {
            const results = await getInstalledMods(selectedServerId);
            setMods(results);
        } catch (error) {
            toast.error('Failed to load installed mods');
        } finally {
            setIsLoading(false);
        }
    };

    // Listen for install progress
    useEffect(() => {
        const unlistenStart = listen<string>('mod-download-start', (event) => {
            const modId = event.payload;
            setInstallProgress(prev => ({
                ...prev,
                [modId]: { modId, progress: 0, status: 'downloading' }
            }));
        });

        const unlistenProgress = listen<{ modId: string, progress: number }>('mod-download-progress', (event) => {
            const { modId, progress } = event.payload;
            setInstallProgress(prev => ({
                ...prev,
                [modId]: { ...prev[modId], progress, status: 'downloading' }
            }));
        });

        return () => {
            unlistenStart.then(f => f());
            unlistenProgress.then(f => f());
        };
    }, []);

    const handleUninstallMod = async (modId: string) => {
        if (!selectedServerId || !confirm('Are you sure you want to uninstall this mod? This will delete the mod files.')) return;
        try {
            await uninstallMod(selectedServerId, modId);
            toast.success('Mod uninstalled');
            loadInstalledMods();
        } catch (error) {
            toast.error('Failed to uninstall mod: ' + error);
        }
    };

    const moveMod = async (index: number, direction: 'up' | 'down') => {
        if (!selectedServerId) return;
        const newMods = [...mods];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newMods.length) return;
        [newMods[index], newMods[targetIndex]] = [newMods[targetIndex], newMods[index]];
        setMods(newMods);
        try {
            await updateActiveMods(selectedServerId, newMods.map(m => m.id));
        } catch (error) {
            toast.error('Failed to reorder mods');
            loadInstalledMods();
        }
    };

    const addToCart = (mod: ModInfo) => {
        if (cart.some(m => m.id === mod.id)) {
            toast('Mod already in cart');
            return;
        }
        setCart([...cart, mod]);
        toast.success(`Added ${mod.name} to cart`);
        setIsCartOpen(true);
    };

    const removeFromCart = (modId: string) => {
        if (isInstalling) return;
        setCart(cart.filter(m => m.id !== modId));
    };

    const handleInstallBatch = async () => {
        if (!selectedServerId) {
            toast.error('No server selected');
            return;
        }
        if (cart.length === 0) return;

        setIsInstalling(true);
        // Initialize progress
        const initialProgress: Record<string, InstallProgress> = {};
        cart.forEach(m => {
            initialProgress[m.id] = { modId: m.id, progress: 0, status: 'pending' };
        });
        setInstallProgress(initialProgress);

        try {
            setIsLoading(true);
            await installModsBatch(selectedServerId, cart.map(m => m.id));

            // Mark all as installed on success if not already
            setInstallProgress(prev => {
                const next = { ...prev };
                Object.keys(next).forEach(key => {
                    next[key] = { ...next[key], progress: 100, status: 'installed' };
                });
                return next;
            });

            toast.success(`Successfully installed ${cart.length} mods!`);
            setTimeout(() => {
                setCart([]);
                setIsCartOpen(false);
                setIsInstalling(false);
                setInstallProgress({});
                if (activeTab === 'installed') loadInstalledMods();
            }, 2000);

        } catch (error) {
            toast.error(`Failed to install mods: ${error}`);
            setIsInstalling(false);
            // Mark pending as error? Or keep them to retry? 
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative h-full flex flex-col space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-violet-400">
                        Mod Manager
                    </h1>
                    <p className="text-slate-400 mt-2 text-lg">Browse and manage {serverType} Mods</p>
                </div>
                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => setIsCartOpen(!isCartOpen)}
                        className={cn(
                            "relative p-3 rounded-lg border transition-all",
                            isCartOpen ? "bg-sky-500/20 border-sky-500 text-sky-400" : "bg-slate-800/50 border-slate-700 text-slate-400 hover:text-white"
                        )}
                    >
                        <ShoppingCart className="w-6 h-6" />
                        {cart.length > 0 && (
                            <span className="absolute -top-2 -right-2 bg-sky-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-lg">
                                {cart.length}
                            </span>
                        )}
                    </button>

                    <div className="flex bg-slate-800/50 rounded-lg p-1 border border-slate-700 mr-4">
                        <button onClick={() => setServerType('ASE')} disabled={isInstalling} className={cn('px-4 py-1.5 rounded-md text-sm font-medium transition-all', serverType === 'ASE' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-white', isInstalling && 'opacity-50 cursor-not-allowed')}>ASE (Steam)</button>
                        <button onClick={() => setServerType('ASA')} disabled={isInstalling} className={cn('px-4 py-1.5 rounded-md text-sm font-medium transition-all', serverType === 'ASA' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-white', isInstalling && 'opacity-50 cursor-not-allowed')}>ASA (CF)</button>
                    </div>
                    <select
                        value={selectedServerId || ''}
                        disabled={isInstalling}
                        onChange={(e) => setSelectedServerId(Number(e.target.value))}
                        className="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50"
                    >
                        {servers.map(server => (
                            <option key={server.id} value={server.id}>{server.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Cart Drawer */}
            {isCartOpen && (
                <div className="fixed right-0 top-0 h-full w-96 bg-slate-900/95 backdrop-blur-xl border-l border-slate-700 shadow-2xl z-50 p-6 flex flex-col animate-in slide-in-from-right duration-300">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <ShoppingCart className="w-5 h-5 text-sky-400" />
                            Mod Cart ({cart.length})
                        </h2>
                        {!isInstalling && <button onClick={() => setIsCartOpen(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>}
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                        {cart.length === 0 ? (
                            <div className="text-center py-10 text-slate-500">
                                Your cart is empty. <br /> Add mods to install them in batch.
                            </div>
                        ) : (
                            cart.map(mod => {
                                const status = installProgress[mod.id];
                                return (
                                    <div key={mod.id} className="bg-slate-800/50 p-3 rounded-lg border border-slate-700 flex flex-col gap-2">
                                        <div className="flex gap-3">
                                            <img src={mod.thumbnailUrl || ''} alt="" className="w-12 h-12 rounded object-cover" />
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-slate-200 truncate">{mod.name}</div>
                                                <div className="text-xs text-slate-500">ID: {mod.id}</div>
                                            </div>
                                            {!isInstalling && <button onClick={() => removeFromCart(mod.id)} className="text-slate-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>}
                                            {status?.status === 'installed' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                                        </div>

                                        {status && (
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-xs text-slate-400">
                                                    <span>{status.status === 'downloading' ? 'Downloading...' : status.status === 'installed' ? 'Installed' : 'Pending'}</span>
                                                    <span>{status.progress.toFixed(1)}%</span>
                                                </div>
                                                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                                    <div
                                                        className={cn("h-full transition-all duration-300",
                                                            status.status === 'installed' ? "bg-green-500" : "bg-sky-500"
                                                        )}
                                                        style={{ width: `${status.progress}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-700">
                        <button
                            onClick={handleInstallBatch}
                            disabled={cart.length === 0 || isLoading || isInstalling}
                            className="w-full py-3 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-bold shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2 transition-all"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                            {isInstalling ? 'Installing...' : `Install ${cart.length} Mods`}
                        </button>
                    </div>
                </div>
            )}

            {/* Content Area */}
            <div className={`transition-all duration-300 ${isCartOpen ? 'pr-96' : ''}`}>
                {/* Search/Tabs */}
                <div className="flex flex-col md:flex-row gap-6 justify-between items-center mb-6">
                    {activeTab === 'available' ? (
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={`Search ${serverType === 'ASE' ? 'Steam Workshop' : 'CurseForge'} mods...`}
                                className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                            />
                        </div>
                    ) : (
                        <div className="text-slate-400 text-sm font-medium">Showing installed mods (ActiveMods)</div>
                    )}

                    <div className="flex p-1 bg-slate-800/50 rounded-xl border border-slate-700/50">
                        <button onClick={() => setActiveTab('available')} className={cn('px-6 py-2 rounded-lg text-sm font-medium transition-all', activeTab === 'available' ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-400 hover:text-white')}>Available</button>
                        <button onClick={() => setActiveTab('installed')} className={cn('px-6 py-2 rounded-lg text-sm font-medium transition-all', activeTab === 'installed' ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-400 hover:text-white')}>Installed</button>
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {isLoading && activeTab !== 'installed' ? (
                        <div className="col-span-full flex justify-center py-20"><Loader2 className="w-10 h-10 text-sky-500 animate-spin" /></div>
                    ) : mods.length === 0 ? (
                        <div className="col-span-full text-center py-20 text-slate-500">No mods found.</div>
                    ) : (
                        mods.map((mod) => (
                            <div key={mod.id} className="glass-panel rounded-2xl overflow-hidden group hover:border-sky-500/30 transition-all flex flex-col">
                                <div className="relative h-48">
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent z-10" />
                                    <img src={mod.thumbnailUrl || ''} alt={mod.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    <div className="absolute bottom-4 left-4 z-20">
                                        <h3 className="text-lg font-bold text-white leading-tight">{mod.name}</h3>
                                        <p className="text-xs text-slate-300 mt-1">by {mod.author}</p>
                                    </div>
                                </div>
                                <div className="p-4 flex-1 flex flex-col">
                                    <div className="flex items-center justify-between mt-auto">
                                        <a href={mod.workshopUrl} target="_blank" className="p-2 text-slate-400 hover:text-white bg-slate-800/50 rounded-lg"><ExternalLink className="w-4 h-4" /></a>
                                        {activeTab === 'available' ? (
                                            <button
                                                onClick={() => addToCart(mod)}
                                                className="flex items-center space-x-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-sm font-medium shadow-lg shadow-sky-500/20"
                                            >
                                                <ShoppingCart className="w-4 h-4" /><span>Add</span>
                                            </button>
                                        ) : (
                                            <div className="flex gap-2">
                                                <button onClick={() => moveMod(mods.indexOf(mod), 'up')} disabled={mods.indexOf(mod) === 0} className="p-2 bg-slate-800 text-slate-400 rounded">▲</button>
                                                <button onClick={() => moveMod(mods.indexOf(mod), 'down')} disabled={mods.indexOf(mod) === mods.length - 1} className="p-2 bg-slate-800 text-slate-400 rounded">▼</button>
                                                <button onClick={() => handleUninstallMod(mod.id)} className="px-3 py-2 bg-red-600/20 text-red-400 rounded hover:bg-red-600/30">Uninstall</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
