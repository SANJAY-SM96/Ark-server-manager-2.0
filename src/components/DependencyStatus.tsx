import { CheckCircle, XCircle, Loader2, Download } from 'lucide-react';

interface DependencyStatusProps {
    name: string;
    installed: boolean;
    checking?: boolean;
    onInstall?: () => void;
    installing?: boolean;
}

export function DependencyStatus({ name, installed, checking = false, onInstall, installing = false }: DependencyStatusProps) {
    return (
        <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
            <span className="text-sm font-medium text-zinc-200">{name}</span>
            <div className="flex items-center gap-2">
                {checking ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                        <span className="text-xs text-zinc-400">Checking...</span>
                    </>
                ) : installed ? (
                    <>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-xs text-green-400">Installed</span>
                    </>
                ) : installing ? (
                    <button disabled className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-md cursor-not-allowed">
                        <Loader2 className="w-3 h-3 animate-spin text-blue-400" />
                        <span className="text-xs text-blue-400">Installing...</span>
                    </button>
                ) : onInstall ? (
                    <button
                        onClick={onInstall}
                        className="flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors shadow-lg shadow-blue-500/20 group"
                    >
                        <Download className="w-3 h-3 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-medium">Install</span>
                    </button>
                ) : (
                    <>
                        <XCircle className="w-4 h-4 text-red-500" />
                        <span className="text-xs text-red-400">Not Installed</span>
                    </>
                )}
            </div>
        </div>
    );
}
