import { useState, useEffect } from 'react';
import { Save, Key, Lock, CheckCircle, AlertCircle, ExternalLink, Github, Download, Bot, Power, Zap, Puzzle, Settings2, Boxes } from 'lucide-react';
import { getSetting, setSetting, startDiscordBot, stopDiscordBot, getDiscordBotStatus, getDiscordBotConfig } from '../utils/tauri';
import toast from 'react-hot-toast';
import { invoke } from '@tauri-apps/api/core';

type TabId = 'integrations' | 'api-keys' | 'mods' | 'application';

interface Tab {
    id: TabId;
    label: string;
    icon: React.ReactNode;
}

const tabs: Tab[] = [
    { id: 'integrations', label: 'Integrations', icon: <Bot className="w-4 h-4" /> },
    { id: 'api-keys', label: 'API Keys', icon: <Key className="w-4 h-4" /> },
    { id: 'mods', label: 'Mod Settings', icon: <Boxes className="w-4 h-4" /> },
    { id: 'application', label: 'Application', icon: <Settings2 className="w-4 h-4" /> },
];

export default function Settings() {
    const [activeTab, setActiveTab] = useState<TabId>('integrations');
    const [curseforgeApiKey, setCurseforgeApiKey] = useState('');
    const [steamApiKey, setSteamApiKey] = useState('');
    const [githubRepo, setGithubRepo] = useState('');
    const [forceModDownload, setForceModDownload] = useState(false);
    const [forceModCopy, setForceModCopy] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showCurseforgeKey, setShowCurseforgeKey] = useState(false);
    const [showSteamKey, setShowSteamKey] = useState(false);

    // Discord Bot state
    const [discordBotToken, setDiscordBotToken] = useState('');
    const [discordGuildId, setDiscordGuildId] = useState('');
    const [showBotToken, setShowBotToken] = useState(false);
    const [botRunning, setBotRunning] = useState(false);
    const [botStarting, setBotStarting] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const openUrl = async (url: string) => {
        try {
            await invoke('plugin:opener|open_url', { url });
        } catch (error) {
            console.error('Failed to open URL:', error);
            toast.error('Failed to open link');
        }
    };

    const loadSettings = async () => {
        try {
            const [curseforgeKey, steamKey, repo, forceDownload, forceCopy] = await Promise.all([
                getSetting('curseforge_api_key'),
                getSetting('steam_api_key'),
                getSetting('github_repo'),
                getSetting('force_mod_download'),
                getSetting('force_mod_copy')
            ]);
            if (curseforgeKey) setCurseforgeApiKey(curseforgeKey);
            if (steamKey) setSteamApiKey(steamKey);
            if (repo) setGithubRepo(repo);
            setForceModDownload(forceDownload === 'true');
            setForceModCopy(forceCopy === 'true');

            // Load Discord Bot config
            try {
                const botConfig = await getDiscordBotConfig();
                setDiscordBotToken(botConfig.token || '');
                setDiscordGuildId(botConfig.guild_id || '');

                const botStatus = await getDiscordBotStatus();
                setBotRunning(botStatus.is_running);
            } catch (e) {
                console.error('Failed to load Discord bot config:', e);
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
            toast.error('Failed to load settings');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await Promise.all([
                setSetting('curseforge_api_key', curseforgeApiKey),
                setSetting('steam_api_key', steamApiKey),
                setSetting('github_repo', githubRepo),
                setSetting('force_mod_download', String(forceModDownload)),
                setSetting('force_mod_copy', String(forceModCopy))
            ]);
            toast.success('Settings saved successfully!');
        } catch (error) {
            console.error('Failed to save settings:', error);
            toast.error('Failed to save settings');
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggleBot = async () => {
        if (botStarting) return;

        if (botRunning) {
            try {
                await stopDiscordBot();
                setBotRunning(false);
                toast.success('Discord bot stopped');
            } catch (error) {
                console.error('Failed to stop bot:', error);
                toast.error('Failed to stop Discord bot');
            }
        } else {
            if (!discordBotToken) {
                toast.error('Please enter a Discord bot token');
                return;
            }

            setBotStarting(true);
            try {
                await startDiscordBot(discordBotToken, discordGuildId || undefined);
                setBotRunning(true);
                toast.success('Discord bot started! Commands will be registered shortly.');
            } catch (error: any) {
                console.error('Failed to start bot:', error);
                toast.error(error?.message || 'Failed to start Discord bot');
            } finally {
                setBotStarting(false);
            }
        }
    };

    const renderIntegrationsTab = () => (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Discord Bot */}
            <div className="glass-panel rounded-2xl p-6">
                <div className="flex items-start justify-between mb-6">
                    <div className="flex items-start space-x-4">
                        <div className={`p-3 rounded-xl border ${botRunning ? 'bg-green-500/20 border-green-500/30' : 'bg-indigo-500/10 border-indigo-500/20'}`}>
                            <Bot className={`w-6 h-6 ${botRunning ? 'text-green-400' : 'text-indigo-400'}`} />
                        </div>
                        <div>
                            <div className="flex items-center space-x-3">
                                <h2 className="text-xl font-bold text-white">Discord Bot</h2>
                                {botRunning && (
                                    <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded-full flex items-center gap-1">
                                        <Zap className="w-3 h-3" /> Online
                                    </span>
                                )}
                            </div>
                            <p className="text-slate-400 text-sm mt-1">
                                Control your ARK servers from Discord using slash commands.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleToggleBot}
                        disabled={botStarting}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${botRunning
                            ? 'bg-red-600 hover:bg-red-500 text-white'
                            : 'bg-green-600 hover:bg-green-500 text-white'
                            } disabled:opacity-50`}
                    >
                        <Power className={`w-4 h-4 ${botStarting ? 'animate-spin' : ''}`} />
                        <span>{botStarting ? 'Starting...' : botRunning ? 'Stop' : 'Start'}</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Bot Token</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                                type={showBotToken ? 'text' : 'password'}
                                value={discordBotToken}
                                onChange={(e) => setDiscordBotToken(e.target.value)}
                                placeholder="Enter bot token"
                                disabled={botRunning}
                                className="w-full pl-10 pr-16 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono text-sm disabled:opacity-50"
                            />
                            <button
                                type="button"
                                onClick={() => setShowBotToken(!showBotToken)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors text-xs"
                            >
                                {showBotToken ? 'Hide' : 'Show'}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Guild ID <span className="text-slate-500">(Optional)</span>
                        </label>
                        <input
                            type="text"
                            value={discordGuildId}
                            onChange={(e) => setDiscordGuildId(e.target.value)}
                            placeholder="For instant command registration"
                            disabled={botRunning}
                            className="w-full px-3 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono text-sm disabled:opacity-50"
                        />
                    </div>
                </div>

                <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4">
                        <p className="text-sm text-slate-300 font-medium mb-2">Need a bot token?</p>
                        <button
                            onClick={() => openUrl('https://discord.com/developers/applications')}
                            className="flex items-center space-x-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors text-sm w-full justify-center"
                        >
                            <ExternalLink className="w-4 h-4" />
                            <span>Discord Developer Portal</span>
                        </button>
                    </div>
                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                        <p className="text-sm text-slate-300 font-medium mb-2">Commands:</p>
                        <div className="grid grid-cols-2 gap-1.5 text-xs text-slate-400">
                            <code className="bg-slate-900 px-2 py-1 rounded">/servers list</code>
                            <code className="bg-slate-900 px-2 py-1 rounded">/servers start</code>
                            <code className="bg-slate-900 px-2 py-1 rounded">/servers stop</code>
                            <code className="bg-slate-900 px-2 py-1 rounded">/backups create</code>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderApiKeysTab = () => (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Steam API Key */}
            <div className="glass-panel rounded-2xl p-6">
                <div className="flex items-start space-x-4 mb-4">
                    <div className="p-3 bg-sky-500/10 rounded-xl border border-sky-500/20">
                        <Key className="w-5 h-5 text-sky-400" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-white">Steam Web API Key</h2>
                        <p className="text-slate-400 text-sm">Optional for enhanced ASE mod searching.</p>
                    </div>
                    {steamApiKey ? (
                        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 text-green-400 text-xs font-medium rounded-full border border-green-500/20">
                            <CheckCircle className="w-3.5 h-3.5" /> Configured
                        </span>
                    ) : (
                        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-500/10 text-slate-400 text-xs font-medium rounded-full border border-slate-500/20">
                            <AlertCircle className="w-3.5 h-3.5" /> Optional
                        </span>
                    )}
                </div>

                <div className="flex gap-4">
                    <div className="flex-1 relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type={showSteamKey ? 'text' : 'password'}
                            value={steamApiKey}
                            onChange={(e) => setSteamApiKey(e.target.value)}
                            placeholder="Enter your Steam Web API key"
                            className="w-full pl-10 pr-16 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all font-mono text-sm"
                        />
                        <button
                            type="button"
                            onClick={() => setShowSteamKey(!showSteamKey)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors text-xs"
                        >
                            {showSteamKey ? 'Hide' : 'Show'}
                        </button>
                    </div>
                    <button
                        onClick={() => openUrl('https://steamcommunity.com/dev/apikey')}
                        className="flex items-center space-x-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors text-sm whitespace-nowrap"
                    >
                        <ExternalLink className="w-4 h-4" />
                        <span>Get Key</span>
                    </button>
                </div>
            </div>

            {/* CurseForge API Key */}
            <div className="glass-panel rounded-2xl p-6">
                <div className="flex items-start space-x-4 mb-4">
                    <div className="p-3 bg-violet-500/10 rounded-xl border border-violet-500/20">
                        <Key className="w-5 h-5 text-violet-400" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-white">CurseForge API Key</h2>
                        <p className="text-slate-400 text-sm">Required for ASA mod searching.</p>
                    </div>
                    {curseforgeApiKey ? (
                        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 text-green-400 text-xs font-medium rounded-full border border-green-500/20">
                            <CheckCircle className="w-3.5 h-3.5" /> Configured
                        </span>
                    ) : (
                        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 text-amber-400 text-xs font-medium rounded-full border border-amber-500/20">
                            <AlertCircle className="w-3.5 h-3.5" /> Required
                        </span>
                    )}
                </div>

                <div className="flex gap-4">
                    <div className="flex-1 relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type={showCurseforgeKey ? 'text' : 'password'}
                            value={curseforgeApiKey}
                            onChange={(e) => setCurseforgeApiKey(e.target.value)}
                            placeholder="Enter your CurseForge API key"
                            className="w-full pl-10 pr-16 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all font-mono text-sm"
                        />
                        <button
                            type="button"
                            onClick={() => setShowCurseforgeKey(!showCurseforgeKey)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors text-xs"
                        >
                            {showCurseforgeKey ? 'Hide' : 'Show'}
                        </button>
                    </div>
                    <button
                        onClick={() => openUrl('https://console.curseforge.com')}
                        className="flex items-center space-x-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors text-sm whitespace-nowrap"
                    >
                        <ExternalLink className="w-4 h-4" />
                        <span>Get Key</span>
                    </button>
                </div>
            </div>

            {/* Info */}
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 border-dashed">
                <p className="text-sm text-slate-400">
                    <strong className="text-slate-300">Security:</strong> API keys are stored locally and only sent to their respective official APIs.
                </p>
            </div>
        </div>
    );

    const renderModsTab = () => (
        <div className="space-y-4 animate-in fade-in duration-300">
            <div className="glass-panel rounded-2xl p-6">
                <div className="flex items-start space-x-4 mb-6">
                    <div className="p-3 bg-slate-700/50 rounded-xl border border-slate-600/50">
                        <Download className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Mod Installation</h2>
                        <p className="text-slate-400 text-sm">Configure how mods are downloaded and installed.</p>
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700 cursor-pointer hover:bg-slate-800/70 transition-colors">
                        <div>
                            <span className="font-semibold text-white block">Force SteamCMD Validation</span>
                            <span className="text-xs text-slate-400">Forces SteamCMD to validate mod files during download (slower but safer).</span>
                        </div>
                        <div className="relative inline-block w-11 h-6 align-middle select-none">
                            <input
                                type="checkbox"
                                checked={forceModDownload}
                                onChange={(e) => setForceModDownload(e.target.checked)}
                                className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer peer checked:right-0 right-6 top-0.5"
                            />
                            <div className="toggle-label block overflow-hidden h-6 rounded-full bg-slate-700 cursor-pointer peer-checked:bg-sky-500"></div>
                        </div>
                    </label>

                    <label className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700 cursor-pointer hover:bg-slate-800/70 transition-colors">
                        <div>
                            <span className="font-semibold text-white block">Force Mod Copy</span>
                            <span className="text-xs text-slate-400">Always overwrite existing mod files in the server directory.</span>
                        </div>
                        <div className="relative inline-block w-11 h-6 align-middle select-none">
                            <input
                                type="checkbox"
                                checked={forceModCopy}
                                onChange={(e) => setForceModCopy(e.target.checked)}
                                className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer peer checked:right-0 right-6 top-0.5"
                            />
                            <div className="toggle-label block overflow-hidden h-6 rounded-full bg-slate-700 cursor-pointer peer-checked:bg-sky-500"></div>
                        </div>
                    </label>
                </div>
            </div>
        </div>
    );

    const renderApplicationTab = () => (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* GitHub Repository */}
            <div className="glass-panel rounded-2xl p-6">
                <div className="flex items-start space-x-4 mb-4">
                    <div className="p-3 bg-slate-700/50 rounded-xl border border-slate-600/50">
                        <Github className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">GitHub Repository</h2>
                        <p className="text-slate-400 text-sm">Configure the repository for application auto-updates.</p>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Repository (owner/name)</label>
                    <input
                        type="text"
                        value={githubRepo}
                        onChange={(e) => setGithubRepo(e.target.value)}
                        placeholder="e.g. yourname/ark-server-manager"
                        className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all font-mono text-sm"
                    />
                    <p className="text-xs text-slate-500 mt-2">New releases will be checked against this repository.</p>
                </div>
            </div>

            {/* About */}
            <div className="glass-panel rounded-2xl p-6">
                <div className="flex items-start space-x-4 mb-4">
                    <div className="p-3 bg-gradient-to-br from-sky-500/20 to-violet-500/20 rounded-xl border border-sky-500/20">
                        <Puzzle className="w-5 h-5 text-sky-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">About ARK Server Manager</h2>
                        <p className="text-slate-400 text-sm">A premium server management solution.</p>
                    </div>
                </div>
                <div className="space-y-2 text-sm text-slate-400">
                    <p>• Manage multiple ARK: Survival Evolved & Ascended servers</p>
                    <p>• Integrated mod management with Steam Workshop & CurseForge</p>
                    <p>• Automated backups, updates, and scheduling</p>
                    <p>• Discord bot integration for remote management</p>
                </div>
            </div>
        </div>
    );

    const renderTabContent = () => {
        switch (activeTab) {
            case 'integrations': return renderIntegrationsTab();
            case 'api-keys': return renderApiKeysTab();
            case 'mods': return renderModsTab();
            case 'application': return renderApplicationTab();
            default: return null;
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-violet-400">
                        Settings
                    </h1>
                    <p className="text-slate-400 mt-2 text-lg">Configure ARK Server Manager preferences</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center space-x-2 px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white rounded-xl transition-colors shadow-lg shadow-sky-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Save className={`w-5 h-5 ${isSaving ? 'animate-spin' : ''}`} />
                    <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
                </button>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full"></div>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Tab Navigation */}
                    <div className="glass-panel rounded-xl p-1.5 inline-flex gap-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                                        ? 'bg-gradient-to-r from-sky-500 to-violet-500 text-white shadow-lg'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                                    }`}
                            >
                                {tab.icon}
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div key={activeTab}>
                        {renderTabContent()}
                    </div>
                </div>
            )}
        </div>
    );
}
