import { useRef, useEffect, useState } from 'react';
import { X, Folder } from 'lucide-react';
import { useServerStore } from '../../stores/serverStore';
import { useUIStore } from '../../stores/uiStore';
import { installServer, InstallServerParams } from '../../utils/tauri';
import { cn } from '../../utils/helpers';
import toast from 'react-hot-toast';
import { listen } from '@tauri-apps/api/event';

interface Props {
    onClose: () => void;
}

const MAPS_ASE = [
    'TheIsland', 'TheCenter', 'ScorchedEarth_P', 'Ragnarok',
    'Aberration_P', 'Extinction', 'Valguero_P', 'Genesis',
    'CrystalIsles', 'Gen2', 'LostIsland', 'Fjordur'
];

const MAPS_ASA = [
    'TheIsland_WP', 'ScorchedEarth_WP', 'TheCenter_WP', 'Aberration_WP'
];

export default function InstallServerDialog({ onClose }: Props) {
    const { addServer } = useServerStore();
    const { gameMode } = useUIStore();
    const [step, setStep] = useState(1);
    const [isInstalling, setIsInstalling] = useState(false);
    const [isCustomMap, setIsCustomMap] = useState(false);
    const [installLogs, setInstallLogs] = useState<string[]>([]);
    const logsEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [installLogs]);

    useEffect(() => {
        let unlistenOutput: () => void;
        let unlistenComplete: () => void;

        async function setupListener() {
            unlistenOutput = await listen<string>('install-output', (event) => {
                setInstallLogs(prev => [...prev, event.payload]);
            });

            unlistenComplete = await listen<{ serverId: number, success: boolean, error?: string }>('server-install-complete', (event) => {
                if (event.payload.success) {
                    setIsInstalling(false);
                    setStep(3); // Success step (renumbered from 5)
                    toast.success("Server installed successfully!");
                } else {
                    setIsInstalling(false);
                    toast.error(`Installation error: ${event.payload.error}`);
                    // Stay on log step? Or show error?
                }
            });
        }
        setupListener();
        return () => {
            if (unlistenOutput) unlistenOutput();
            if (unlistenComplete) unlistenComplete();
        };
    }, []);

    const [formData, setFormData] = useState<InstallServerParams>({
        serverType: gameMode,
        installPath: 'C:\\ARKServers\\Server1',
        name: `My ${gameMode} Server`,
        mapName: gameMode === 'ASE' ? MAPS_ASE[0] : MAPS_ASA[0],
        gamePort: 7777,
        queryPort: 27015,
        rconPort: 32330,
    });

    const handleInstall = async () => {
        setIsInstalling(true);
        setStep(3); // Move to install view (renumbered)
        try {
            const server = await installServer(formData);
            addServer(server);
            toast.success(`Server "${server.name}" installation started!`);
            // Don't close immediately, let user watch logs or close manually
        } catch (error) {
            toast.error(`Installation failed: ${error}`);
            setIsInstalling(false);
            setStep(2); // Go back
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-dark-900 border border-dark-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-dark-800">
                    <h2 className="text-2xl font-bold text-white">Install New {gameMode} Server</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-dark-800 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-dark-400" />
                    </button>
                </div>

                {/* Steps Indicator */}
                <div className="flex items-center justify-center space-x-4 p-6 border-b border-dark-800">
                    {['Configure', 'Review', 'Install'].map((_, index) => {
                        const s = index + 1;
                        return (
                            <div key={s} className="flex items-center">
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${s === step
                                        ? 'bg-primary-600 text-white'
                                        : s < step || step === 4 // 4 is success/finished state basically
                                            ? 'bg-green-600 text-white'
                                            : 'bg-dark-800 text-dark-500'
                                        }`}
                                >
                                    {s}
                                </div>
                                {s < 3 && (
                                    <div className={`w-16 h-1 mx-2 ${s < step ? 'bg-green-600' : 'bg-dark-800'}`} />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Content */}
                <div className="p-6">
                    {step === 1 && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-white">Step 1: Configure Server</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-dark-300 mb-2">
                                        Server Name
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-600"
                                        placeholder="My ARK Server"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-dark-300 mb-2">
                                        Installation Path
                                    </label>
                                    <div className="flex space-x-2">
                                        <input
                                            type="text"
                                            value={formData.installPath}
                                            onChange={(e) => setFormData({ ...formData, installPath: e.target.value })}
                                            className="flex-1 px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-600 font-mono text-sm"
                                            placeholder="C:\ARKServers\Server1"
                                        />
                                        <button className="px-4 py-2 bg-dark-800 hover:bg-dark-700 border border-dark-700 rounded-lg transition-colors">
                                            <Folder className="w-5 h-5 text-dark-400" />
                                        </button>
                                    </div>
                                </div>


                                <div>
                                    <label className="block text-sm font-medium text-dark-300 mb-2">
                                        Map Selection
                                    </label>
                                    <div className="space-y-3">
                                        <div className="flex bg-dark-800 rounded-lg p-1 border border-dark-700">
                                            <button
                                                onClick={() => {
                                                    setIsCustomMap(false);
                                                    setFormData({
                                                        ...formData,
                                                        mapName: formData.serverType === 'ASE' ? MAPS_ASE[0] : MAPS_ASA[0]
                                                    });
                                                }}
                                                className={`flex-1 py-1.5 text-sm rounded-md transition-all ${!isCustomMap ? 'bg-dark-700 text-white shadow-sm' : 'text-dark-400 hover:text-dark-200'
                                                    }`}
                                            >
                                                Official Map
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setIsCustomMap(true);
                                                    setFormData({ ...formData, mapName: '' });
                                                }}
                                                className={`flex-1 py-1.5 text-sm rounded-md transition-all ${isCustomMap ? 'bg-dark-700 text-white shadow-sm' : 'text-dark-400 hover:text-dark-200'
                                                    }`}
                                            >
                                                Custom / Mod Map
                                            </button>
                                        </div>

                                        {!isCustomMap ? (
                                            <select
                                                value={formData.mapName}
                                                onChange={(e) => setFormData({ ...formData, mapName: e.target.value })}
                                                className="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-600"
                                            >
                                                {(formData.serverType === 'ASE' ? MAPS_ASE : MAPS_ASA).map(map => (
                                                    <option key={map} value={map}>{map}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <div>
                                                <input
                                                    type="text"
                                                    value={formData.mapName}
                                                    onChange={(e) => setFormData({ ...formData, mapName: e.target.value })}
                                                    className="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-600"
                                                    placeholder="e.g. ModMapName"
                                                />
                                                <p className="text-xs text-dark-400 mt-1">
                                                    Enter the exact map name as specified by the mod author.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-dark-300 mb-2">
                                            Game Port
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.gamePort}
                                            onChange={(e) => setFormData({ ...formData, gamePort: parseInt(e.target.value) })}
                                            className="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-600"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-dark-300 mb-2">
                                            Query Port
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.queryPort}
                                            onChange={(e) => setFormData({ ...formData, queryPort: parseInt(e.target.value) })}
                                            className="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-600"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-dark-300 mb-2">
                                            RCON Port
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.rconPort}
                                            onChange={(e) => setFormData({ ...formData, rconPort: parseInt(e.target.value) })}
                                            className="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-600"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-white">Step 2: Review & Install</h3>

                            <div className="bg-dark-800 rounded-lg p-6 space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-dark-400">Server Type:</span>
                                    <span className="text-white font-semibold">{formData.serverType}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-dark-400">Server Name:</span>
                                    <span className="text-white font-semibold">{formData.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-dark-400">Install Path:</span>
                                    <span className="text-white font-mono text-sm">{formData.installPath}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-dark-400">Map:</span>
                                    <span className="text-white font-semibold">{formData.mapName || 'Unknown'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-dark-400">Ports:</span>
                                    <span className="text-white font-mono">
                                        {formData.gamePort} / {formData.queryPort} / {formData.rconPort}
                                    </span>
                                </div>
                            </div>

                            <div className="bg-yellow-600/10 border border-yellow-600/30 rounded-lg p-4">
                                <p className="text-yellow-400 text-sm">
                                    ⚠️ This will download approximately 15-30 GB of data via SteamCMD. Make sure you have sufficient disk space.
                                </p>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-white flex items-center">
                                <span className="animate-spin mr-2">⏳</span> Installing Server...
                            </h3>
                            <div className="bg-black/50 border border-dark-700 rounded-lg p-4 h-[300px] overflow-y-auto font-mono text-xs text-slate-300">
                                {installLogs.map((log, i) => (
                                    <div key={i} className="whitespace-pre-wrap">{log}</div>
                                ))}
                                <div ref={logsEndRef} />
                            </div>
                            <p className="text-sm text-slate-400">
                                This process happens in the background. You can close this window, but the installation will continue. Check the server status for updates.
                            </p>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="text-center py-8 space-y-6">
                            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                                <span className="text-4xl">🎉</span>
                            </div>
                            <h3 className="text-2xl font-bold text-white">Installation Complete!</h3>
                            <p className="text-slate-300 max-w-md mx-auto">
                                Your server <strong>{formData.name}</strong> is installed and ready to launch.
                            </p>

                            <div className="bg-dark-800 p-4 rounded-lg text-left max-w-sm mx-auto space-y-2">
                                <h4 className="text-sm font-semibold text-white">Next Steps:</h4>
                                <ul className="text-sm text-slate-400 list-disc list-inside space-y-1">
                                    <li>Review Settings in Config Editor</li>
                                    <li>Install Mods (Optional)</li>
                                    <li>Start the Server</li>
                                </ul>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-dark-800">
                    <button
                        onClick={() => step > 1 && step !== 4 ? setStep(step - 1) : onClose()}
                        className={cn(
                            "px-6 py-2 bg-dark-800 hover:bg-dark-700 text-white rounded-lg transition-colors",
                            step === 3 && "hidden",
                            step === 4 && "hidden"
                        )}
                        disabled={isInstalling && step !== 3}
                    >
                        {step === 1 ? 'Cancel' : 'Back'}
                    </button>

                    {step === 3 || step === 4 ? (
                        <button
                            onClick={onClose}
                            className={cn(
                                "px-6 py-2 rounded-lg transition-colors text-white",
                                step === 4 ? "bg-primary-600 hover:bg-primary-700 w-full" : "bg-dark-700 hover:bg-dark-600"
                            )}
                        >
                            {step === 4 ? "Finish & Go to Dashboard" : "Close"}
                        </button>
                    ) : (
                        <button
                            onClick={() => step < 2 ? setStep(step + 1) : handleInstall()}
                            disabled={isInstalling}
                            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isInstalling ? 'Installing...' : step === 2 ? 'Install Server' : 'Next'}
                        </button>
                    )}
                </div>
            </div>
        </div>

    );
}
