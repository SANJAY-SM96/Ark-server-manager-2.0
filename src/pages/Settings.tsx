import { useState, useEffect } from 'react';
import { Save, Key, Lock, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { getSetting, setSetting } from '../utils/tauri';
import toast from 'react-hot-toast';
import { invoke } from '@tauri-apps/api/core';

export default function Settings() {
    const [curseforgeApiKey, setCurseforgeApiKey] = useState('');
    const [steamApiKey, setSteamApiKey] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showCurseforgeKey, setShowCurseforgeKey] = useState(false);
    const [showSteamKey, setShowSteamKey] = useState(false);
    const [discordWebhook, setDiscordWebhook] = useState('');

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
            const [curseforgeKey, steamKey, discordWebhookUrl] = await Promise.all([
                getSetting('curseforge_api_key'),
                getSetting('steam_api_key'),
                getSetting('discord_webhook_url')
            ]);
            if (curseforgeKey) setCurseforgeApiKey(curseforgeKey);
            if (steamKey) setSteamApiKey(steamKey);
            if (discordWebhookUrl) setDiscordWebhook(discordWebhookUrl);
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
                setSetting('curseforge_api_key', curseforgeApiKey),
                setSetting('steam_api_key', steamApiKey),
                setSetting('discord_webhook_url', discordWebhook)
            ]);
            toast.success('Settings saved successfully!');
        } catch (error) {
            console.error('Failed to save settings:', error);
            toast.error('Failed to save settings');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
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
                    {/* Steam Web API Key */}
                    <div className="glass-panel rounded-2xl p-8">
                        <div className="flex items-start space-x-4 mb-6">
                            <div className="p-3 bg-sky-500/10 rounded-xl border border-sky-500/20">
                                <Key className="w-6 h-6 text-sky-400" />
                            </div>
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold text-white mb-2">Steam Web API Key</h2>
                                <p className="text-slate-400">
                                    Optional for enhanced ARK: Survival Evolved (ASE) mod searching via Steam's official API.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-3">
                                    API Key
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                    <input
                                        type={showSteamKey ? 'text' : 'password'}
                                        value={steamApiKey}
                                        onChange={(e) => setSteamApiKey(e.target.value)}
                                        placeholder="Enter your Steam Web API key (optional)"
                                        className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all font-mono"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowSteamKey(!showSteamKey)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors text-sm"
                                    >
                                        {showSteamKey ? 'Hide' : 'Show'}
                                    </button>
                                </div>
                            </div>

                            <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl p-4">
                                <p className="text-sm text-slate-300 font-medium mb-3">Need an API key?</p>
                                <button
                                    onClick={() => openUrl('https://steamcommunity.com/dev/apikey')}
                                    className="flex items-center space-x-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors shadow-lg shadow-sky-500/20 w-full justify-center"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    <span>Get Steam API Key</span>
                                </button>
                                <p className="text-xs text-slate-400 mt-3">
                                    Sign in with Steam → Enter domain name → Copy key
                                </p>
                            </div>

                            {steamApiKey && (
                                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                                    <div className="flex items-center space-x-2">
                                        <CheckCircle className="w-5 h-5 text-green-400" />
                                        <span className="text-green-400 font-medium">Steam API Key configured</span>
                                    </div>
                                </div>
                            )}

                            {!steamApiKey && (
                                <div className="bg-slate-500/10 border border-slate-500/20 rounded-xl p-4">
                                    <div className="flex items-center space-x-2">
                                        <AlertCircle className="w-5 h-5 text-slate-400" />
                                        <span className="text-slate-400 font-medium">Optional - ASE will use web scraping if not configured</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* CurseForge API Key */}
                    <div className="glass-panel rounded-2xl p-8">
                        <div className="flex items-start space-x-4 mb-6">
                            <div className="p-3 bg-violet-500/10 rounded-xl border border-violet-500/20">
                                <Key className="w-6 h-6 text-violet-400" />
                            </div>
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold text-white mb-2">CurseForge API Key</h2>
                                <p className="text-slate-400">
                                    Required for searching and installing ARK: Survival Ascended (ASA) mods from CurseForge.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-3">
                                    API Key
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                    <input
                                        type={showCurseforgeKey ? 'text' : 'password'}
                                        value={curseforgeApiKey}
                                        onChange={(e) => setCurseforgeApiKey(e.target.value)}
                                        placeholder="Enter your CurseForge API key"
                                        className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all font-mono"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurseforgeKey(!showCurseforgeKey)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors text-sm"
                                    >
                                        {showCurseforgeKey ? 'Hide' : 'Show'}
                                    </button>
                                </div>
                            </div>

                            <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl p-4">
                                <p className="text-sm text-slate-300 font-medium mb-3">Need an API key?</p>
                                <button
                                    onClick={() => openUrl('https://console.curseforge.com')}
                                    className="flex items-center space-x-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors shadow-lg shadow-violet-500/20 w-full justify-center"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    <span>Get CurseForge API Key</span>
                                </button>
                                <p className="text-xs text-slate-400 mt-3">
                                    Sign in → Create/Copy API key → Paste above
                                </p>
                            </div>

                            {curseforgeApiKey && (
                                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                                    <div className="flex items-center space-x-2">
                                        <CheckCircle className="w-5 h-5 text-green-400" />
                                        <span className="text-green-400 font-medium">API Key configured</span>
                                    </div>
                                </div>
                            )}

                            {!curseforgeApiKey && (
                                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                                    <div className="flex items-center space-x-2">
                                        <AlertCircle className="w-5 h-5 text-amber-400" />
                                        <span className="text-amber-400 font-medium">No API key set - ASA mod search will not work</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Info Section */}
                    <div className="glass-panel rounded-2xl p-6 border-dashed">
                        <h3 className="text-lg font-medium text-white mb-3">About API Keys</h3>
                        <div className="space-y-2 text-sm text-slate-400">
                            <p>• Your API keys are stored locally in the application database</p>
                            <p>• They are never sent to any third parties except their respective official APIs</p>
                            <p>• <strong className="text-sky-400">Steam API Key</strong>: Optional for ASE - enables official API instead of web scraping</p>
                            <p>• <strong className="text-violet-400">CurseForge API Key</strong>: Required for ASA mod search</p>
                            <p>• You can revoke or regenerate your keys anytime from their respective consoles</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
