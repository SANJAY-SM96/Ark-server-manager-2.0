import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface DependencyStatusProps {
    name: string;
    installed: boolean;
    checking?: boolean;
}

export function DependencyStatus({ name, installed, checking = false }: DependencyStatusProps) {
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
