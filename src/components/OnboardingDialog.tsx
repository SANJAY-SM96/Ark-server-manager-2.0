import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { CheckCircle, Loader2, AlertCircle, Download } from 'lucide-react';

interface OnboardingDialogProps {
    onComplete: () => void;
}

export function OnboardingDialog({ onComplete }: OnboardingDialogProps) {
    const [steamcmdStatus, setSteamcmdStatus] = useState<'checking' | 'installing' | 'complete' | 'error'>('checking');
    const [progress, setProgress] = useState(0);
    const [message, setMessage] = useState('Checking dependencies...');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        checkAndInstallDependencies();
    }, []);

    const checkAndInstallDependencies = async () => {
        try {
            setMessage('Checking SteamCMD installation...');
            setProgress(10);

            const installed = await invoke<boolean>('check_steamcmd_installed');

            if (installed) {
                setSteamcmdStatus('complete');
                setProgress(100);
                setMessage('All dependencies installed!');
                setTimeout(() => onComplete(), 1500);
            } else {
                setSteamcmdStatus('installing');
                await installSteamCMD();
            }
        } catch (error) {
            console.error('Dependency check failed:', error);
            setSteamcmdStatus('error');
            setError(error as string);
            setMessage('Failed to check dependencies');
        }
    };

    const installSteamCMD = async () => {
        try {
            setMessage('Downloading SteamCMD...');
            setProgress(25);

            await new Promise(resolve => setTimeout(resolve, 500)); // Brief pause for UX

            await invoke('install_steamcmd');

            setMessage('Extracting files...');
            setProgress(75);

            await new Promise(resolve => setTimeout(resolve, 500));

            setSteamcmdStatus('complete');
            setProgress(100);
            setMessage('Setup complete!');

            setTimeout(() => onComplete(), 2000);
        } catch (error) {
            console.error('SteamCMD installation failed:', error);
            setSteamcmdStatus('error');
            setError(error as string);
            setMessage('Failed to install SteamCMD');
        }
    };

    const retry = () => {
        setError(null);
        setSteamcmdStatus('checking');
        setProgress(0);
        checkAndInstallDependencies();
    };

    const getStatusIcon = () => {
        switch (steamcmdStatus) {
            case 'checking':
            case 'installing':
                return <Loader2 className="w-8 h-8 animate-spin text-blue-500" />;
            case 'complete':
                return <CheckCircle className="w-8 h-8 text-green-500" />;
            case 'error':
                return <AlertCircle className="w-8 h-8 text-red-500" />;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-gradient-to-br from-zinc-900/95 to-zinc-800/95 border border-zinc-700/50 rounded-xl p-8 max-w-md w-full shadow-2xl backdrop-blur-xl">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <Download className="w-8 h-8 text-blue-500" />
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        First Time Setup
                    </h2>
                </div>

                {/* Status Section */}
                <div className="space-y-6">
                    <div className="flex items-start gap-4">
                        <div className="mt-1">{getStatusIcon()}</div>

                        <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-1">SteamCMD Installation</h3>
                            <p className="text-sm text-zinc-400 mb-3">{message}</p>

                            {/* Progress Bar */}
                            <div className="relative h-2 bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 ease-out rounded-full"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>

                            <div className="flex justify-between items-center mt-2">
                                <span className="text-xs text-zinc-500">{progress}%</span>
                                {steamcmdStatus === 'installing' && (
                                    <span className="text-xs text-blue-400 animate-pulse">Installing...</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                            <p className="text-sm text-red-400 font-medium mb-2">Installation Error</p>
                            <p className="text-xs text-red-300/80">{error}</p>
                        </div>
                    )}

                    {/* Action Buttons */}
                    {steamcmdStatus === 'error' && (
                        <button
                            onClick={retry}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                        >
                            <Loader2 className="w-4 h-4" />
                            Retry Installation
                        </button>
                    )}

                    {steamcmdStatus === 'complete' && (
                        <button
                            onClick={onComplete}
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
                        >
                            <CheckCircle className="w-5 h-5" />
                            Get Started
                        </button>
                    )}
                </div>

                {/* Info Note */}
                <div className="mt-6 pt-6 border-t border-zinc-700/50">
                    <p className="text-xs text-zinc-500 text-center">
                        SteamCMD is required to download and manage ARK server files.
                        <br />
                        This is a one-time setup process.
                    </p>
                </div>
            </div>
        </div>
    );
}
