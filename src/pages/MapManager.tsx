
import { useState, useEffect } from 'react';
import { useServerStore } from '../stores/serverStore';
import {
    Map,
    Save,
    Trash2,
    Archive,
    RotateCcw,
    HardDrive,
    AlertTriangle,
    Loader2,
    CheckCircle2
} from 'lucide-react';
import { cn } from '../utils/helpers';
import toast from 'react-hot-toast';
import {
    updateServerMap,
    wipeServerSave,
    createBackup,
    getBackups,
    restoreBackup,
    deleteBackup
} from '../utils/tauri';
import { Backup } from '../types';

// Map Lists
const ASE_MAPS = [
    { name: 'The Island', id: 'TheIsland', image: 'https://ark.wiki.gg/images/thumb/e/e4/The_Island_Topographic_Map.jpg/300px-The_Island_Topographic_Map.jpg' },
    { name: 'The Center', id: 'TheCenter', image: 'https://ark.wiki.gg/images/thumb/0/0d/The_Center_Topographic_Map.jpg/300px-The_Center_Topographic_Map.jpg' },
    { name: 'Scorched Earth', id: 'ScorchedEarth_P', image: 'https://ark.wiki.gg/images/thumb/7/75/Scorched_Earth_Topographic_Map.jpg/300px-Scorched_Earth_Topographic_Map.jpg' },
    { name: 'Ragnarok', id: 'Ragnarok', image: 'https://ark.wiki.gg/images/thumb/4/43/Ragnarok_Map_Art.jpg/300px-Ragnarok_Map_Art.jpg' },
    { name: 'Aberration', id: 'Aberration_P', image: 'https://ark.wiki.gg/images/thumb/6/6f/Aberration_Map_Art.jpg/300px-Aberration_Map_Art.jpg' },
    { name: 'Extinction', id: 'Extinction', image: 'https://ark.wiki.gg/images/thumb/c/c2/Extinction_Map_Art.jpg/300px-Extinction_Map_Art.jpg' },
    { name: 'Valguero', id: 'Valguero_P', image: 'https://ark.wiki.gg/images/thumb/9/98/Valguero_Map_Art.jpg/300px-Valguero_Map_Art.jpg' },
    { name: 'Genesis Part 1', id: 'Genesis', image: 'https://ark.wiki.gg/images/thumb/9/90/Genesis_Part_1_Map_Art.jpg/300px-Genesis_Part_1_Map_Art.jpg' },
    { name: 'Crystal Isles', id: 'CrystalIsles', image: 'https://ark.wiki.gg/images/thumb/9/9d/Crystal_Isles_Map_Art.jpg/300px-Crystal_Isles_Map_Art.jpg' },
    { name: 'Genesis Part 2', id: 'Gen2', image: 'https://ark.wiki.gg/images/thumb/d/d4/Genesis_Part_2_Map_Art.jpg/300px-Genesis_Part_2_Map_Art.jpg' },
    { name: 'Lost Island', id: 'LostIsland', image: 'https://ark.wiki.gg/images/thumb/2/29/Lost_Island_Map_Art.jpg/300px-Lost_Island_Map_Art.jpg' },
    { name: 'Fjordur', id: 'Fjordur', image: 'https://ark.wiki.gg/images/thumb/a/aa/Fjordur_Map_Art.jpg/300px-Fjordur_Map_Art.jpg' },
];

const ASA_MAPS = [
    { name: 'The Island', id: 'TheIsland_WP', image: 'https://ark.wiki.gg/images/thumb/e/e4/The_Island_Topographic_Map.jpg/300px-The_Island_Topographic_Map.jpg' },
    { name: 'Scorched Earth', id: 'ScorchedEarth_WP', image: 'https://ark.wiki.gg/images/thumb/7/75/Scorched_Earth_Topographic_Map.jpg/300px-Scorched_Earth_Topographic_Map.jpg' },
    { name: 'The Center', id: 'TheCenter_WP', image: 'https://ark.wiki.gg/images/thumb/0/0d/The_Center_Topographic_Map.jpg/300px-The_Center_Topographic_Map.jpg' },
];

export default function MapManager({ serverId }: { serverId?: number }) {
    const { servers } = useServerStore();
    const [internalServerId, setInternalServerId] = useState<number | null>(null);
    const selectedServerId = serverId || internalServerId;

    const [backups, setBackups] = useState<Backup[]>([]);
    const [selectedMapId, setSelectedMapId] = useState<string>('');
    const [customMapName, setCustomMapName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [wipeConfirm, setWipeConfirm] = useState('');
    const [showWipeDialog, setShowWipeDialog] = useState(false);

    const selectedServer = servers.find(s => s.id === selectedServerId);

    // Initial server selection (only if not provided by prop)
    useEffect(() => {
        if (!serverId && servers.length > 0 && !internalServerId) {
            setInternalServerId(servers[0].id);
        }
    }, [servers, internalServerId, serverId]);

    // Load active map and backups when server changes
    useEffect(() => {
        if (selectedServer) {
            // Set current map ID (try to find in list, else set custom)
            // Note: server.config.mapName might be map internal name
            setSelectedMapId(selectedServer.config.mapName);
            loadBackups();
        }
    }, [selectedServer]);

    const loadBackups = async () => {
        if (!selectedServerId) return;
        try {
            const data = await getBackups(selectedServerId);
            setBackups(data);
        } catch (error) {
            console.error('Failed to load backups:', error);
            toast.error('Failed to load backups');
        }
    };

    const handleSetMap = async () => {
        if (!selectedServerId || !selectedMapId) return;

        // Use custom map name if "Custom" is selected (conceptually) or just allow mapId to be editable?
        // For now, if "Custom" isn't implemented in the grid, we assume selectedMapId is valid.
        // If we want custom input, let's check.

        let finalMapName = selectedMapId === 'Custom' ? customMapName : selectedMapId;
        if (!finalMapName) return;

        setIsLoading(true);
        try {
            await updateServerMap(selectedServerId, finalMapName);
            toast.success(`Map changed to ${finalMapName}`);
            // Ideally refetch server list or update local store
        } catch (error) {
            console.error('Failed to set map:', error);
            toast.error('Failed to update map setting');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateBackup = async () => {
        if (!selectedServerId) return;
        setIsLoading(true);
        try {
            await createBackup(selectedServerId, 'manual');
            toast.success('Backup created successfully');
            loadBackups();
        } catch (error) {
            console.error('Failed to create backup:', error);
            toast.error('Failed to create backup: ' + error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRestoreBackup = async (backupId: number) => {
        if (!confirm('Are you sure you want to restore this backup? Current save data will be overwritten.')) return;

        setIsLoading(true);
        try {
            // Check type match for restoreBackup (uses backupId which is number in model but i64 in backend)
            // our types.ts says number (good)
            await restoreBackup(backupId);
            toast.success('Backup restored successfully');
        } catch (error) {
            console.error('Failed to restore backup:', error);
            toast.error('Failed to restore backup');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteBackup = async (backupId: number) => {
        if (!confirm('Delete this backup?')) return;
        try {
            await deleteBackup(backupId);
            toast.success('Backup deleted');
            loadBackups();
        } catch (error) {
            toast.error('Failed to delete backup');
        }
    };

    const handleWipeSave = async () => {
        if (!selectedServerId) return;
        if (wipeConfirm !== 'DELETE') {
            toast.error('Please type DELETE to confirm');
            return;
        }

        setIsLoading(true);
        try {
            // Auto backup before wipe? Optional.
            await wipeServerSave(selectedServerId);
            toast.success('Server save data wiped');
            setShowWipeDialog(false);
            setWipeConfirm('');
        } catch (error) {
            console.error('Failed to wipe save:', error);
            toast.error('Failed to wipe save data');
        } finally {
            setIsLoading(false);
        }
    };

    const availableMaps = selectedServer?.serverType === 'ASA' ? ASA_MAPS : ASE_MAPS;

    return (
        <div className="space-y-6 pb-20 animate-in fade-in duration-500">
            {!serverId && (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                                Map Manager
                            </h1>
                            {selectedServer && (
                                <span className={cn(
                                    "px-2 py-0.5 rounded text-xs font-bold border",
                                    selectedServer.serverType === 'ASA'
                                        ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                                        : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                )}>
                                    {selectedServer.serverType === 'ASA' ? 'ASCENDED' : 'EVOLVED'}
                                </span>
                            )}
                        </div>
                        <p className="text-slate-400 mt-1">Change maps, manage saves, and handle backups</p>
                    </div>

                    <div className="bg-slate-800/50 p-1.5 rounded-xl border border-slate-700/50 min-w-[250px]">
                        <select
                            value={selectedServerId || ''}
                            onChange={(e) => setInternalServerId(Number(e.target.value))}
                            className="w-full bg-slate-900 border-none rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-emerald-500"
                        >
                            {servers.map(server => (
                                <option key={server.id} value={server.id}>{server.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left: Map Selection */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-6">
                        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                            <Map className="w-5 h-5 text-emerald-400" />
                            Select Map
                        </h2>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {availableMaps.map(map => (
                                <button
                                    key={map.id}
                                    onClick={() => setSelectedMapId(map.id)}
                                    className={cn(
                                        "group relative aspect-video rounded-xl overflow-hidden border-2 transition-all text-left",
                                        selectedMapId === map.id
                                            ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-lg shadow-emerald-900/20"
                                            : "border-slate-700/50 hover:border-slate-600 opacity-70 hover:opacity-100"
                                    )}
                                >
                                    <div className="absolute inset-0 bg-slate-900">
                                        {/* Placeholder image logic since real URLs might break or need proxy */}
                                        <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-600 font-bold text-2xl group-hover:bg-slate-700 transition-colors">
                                            {map.name.substring(0, 2)}
                                        </div>
                                    </div>
                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-4 pt-12">
                                        <p className="font-bold text-white text-sm">{map.name}</p>
                                        <p className="text-xs text-slate-400 font-mono opacity-0 group-hover:opacity-100 transition-opacity">{map.id}</p>
                                    </div>
                                    {selectedMapId === map.id && (
                                        <div className="absolute top-2 right-2 bg-emerald-500 rounded-full p-1 shadow-lg">
                                            <CheckCircle2 className="w-4 h-4 text-white" />
                                        </div>
                                    )}
                                </button>
                            ))}

                            {/* Custom Map Input Option */}
                            <div className="col-span-full mt-4 bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 flex items-center gap-4">
                                <div className="flex-1">
                                    <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Or Custom Map Name / Path</label>
                                    <input
                                        type="text"
                                        placeholder="Experimentation_P or /Game/Maps/MyMap"
                                        className="w-full bg-slate-800 border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-200 focus:ring-emerald-500 focus:border-emerald-500"
                                        value={customMapName}
                                        onChange={(e) => {
                                            setCustomMapName(e.target.value);
                                            if (e.target.value) setSelectedMapId('Custom');
                                        }}
                                        onClick={() => setSelectedMapId('Custom')}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={handleSetMap}
                                disabled={isLoading || (!selectedMapId && !customMapName)}
                                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-all shadow-lg shadow-emerald-900/20"
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Save Active Map
                            </button>
                        </div>
                    </div>

                    {/* Backups List */}
                    <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                                <Archive className="w-5 h-5 text-cyan-400" />
                                Backups
                            </h2>
                            <button
                                onClick={handleCreateBackup}
                                disabled={isLoading}
                                className="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg text-slate-300 transition-colors flex items-center gap-2"
                            >
                                <HardDrive className="w-3 h-3" />
                                Backup Now
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-400">
                                <thead className="text-xs uppercase bg-slate-900/50 text-slate-500">
                                    <tr>
                                        <th className="px-4 py-3 rounded-l-lg">Date</th>
                                        <th className="px-4 py-3">Type</th>
                                        <th className="px-4 py-3">Content</th>
                                        <th className="px-4 py-3 text-right rounded-r-lg">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {backups.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-8 text-center text-slate-600 italic">
                                                No backups found
                                            </td>
                                        </tr>
                                    ) : (
                                        backups.map((backup) => (
                                            <tr key={backup.id} className="hover:bg-slate-800/50 transition-colors">
                                                <td className="px-4 py-3 font-mono">
                                                    {new Date(backup.createdAt).toLocaleString()}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded text-[10px] uppercase font-bold border",
                                                        backup.backupType === 'auto' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                                                            backup.backupType === 'pre-update' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                                                                "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                                    )}>
                                                        {backup.backupType}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="flex items-center gap-2">
                                                        {backup.includesSaves && <span className="bg-slate-700 px-1.5 rounded textxs text-slate-300">Save</span>}
                                                        {backup.includesConfigs && <span className="bg-slate-700 px-1.5 rounded textxs text-slate-300">Cfg</span>}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right space-x-2">
                                                    <button
                                                        onClick={() => handleRestoreBackup(backup.id)}
                                                        className="text-cyan-400 hover:text-cyan-300 p-1 hover:bg-cyan-950/30 rounded"
                                                        title="Restore"
                                                    >
                                                        <RotateCcw className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteBackup(backup.id)}
                                                        className="text-red-400 hover:text-red-300 p-1 hover:bg-red-950/30 rounded"
                                                        title="Delete"
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
                </div>

                {/* Right: Dangerous Actions & Metadata */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">Current Status</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-slate-500 uppercase font-bold block mb-1">Active Map</label>
                                <div className="text-emerald-400 font-mono text-lg truncate" title={selectedServer?.config.mapName}>
                                    {selectedServer?.config.mapName || 'Unknown'}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 uppercase font-bold block mb-1">Cluster ID</label>
                                <div className="text-slate-300 font-mono text-sm">
                                    None
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-red-500/5 rounded-2xl border border-red-500/20 p-6">
                        <h2 className="text-lg font-semibold text-red-500 mb-4 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" />
                            Danger Zone
                        </h2>

                        <p className="text-sm text-red-400/80 mb-6">
                            Actions here are destructive and cannot be undone (mostly). proceed with caution.
                        </p>

                        <button
                            onClick={() => setShowWipeDialog(true)}
                            className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 font-medium px-4 py-3 rounded-xl transition-colors flex items-center justify-center gap-2 group"
                        >
                            <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            Wipe Save Data
                        </button>
                    </div>
                </div>
            </div>

            {/* Wipe Confirmation Dialog */}
            {showWipeDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
                        <h3 className="text-xl font-bold text-white mb-2">Confirm Wipe</h3>
                        <p className="text-slate-400 mb-6">
                            This will permanently delete the <code>SavedArks</code> directory for this server.
                            All player progress, structures, and tamed dinos will be lost.
                            <br /><br />
                            Type <strong>DELETE</strong> to confirm.
                        </p>

                        <input
                            type="text"
                            value={wipeConfirm}
                            onChange={(e) => setWipeConfirm(e.target.value)}
                            placeholder="DELETE"
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-red-500 font-bold mb-6 focus:ring-2 focus:ring-red-500/50 outline-none"
                        />

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => {
                                    setShowWipeDialog(false);
                                    setWipeConfirm('');
                                }}
                                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleWipeSave}
                                disabled={wipeConfirm !== 'DELETE' || isLoading}
                                className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                            >
                                {isLoading ? 'Wiping...' : 'Confirm Wipe'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
