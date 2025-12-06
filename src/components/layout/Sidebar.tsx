import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useUIStore } from '../../stores/uiStore';
import {
  LayoutDashboard,
  Server,
  Puzzle,
  Terminal,
  FileEdit,
  Network,
  Database,
  Sparkles,
  ScrollText,
  Settings as SettingsIcon,
  HardDrive
} from 'lucide-react';
import { cn } from '../../utils/helpers';

const navigation = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Server Manager', path: '/servers', icon: Server },
  { name: 'Mod Manager', path: '/mods', icon: Puzzle },
  { name: 'RCON Manager', path: '/players', icon: Terminal },
  { name: 'Config Editor', path: '/config', icon: FileEdit },
  { name: 'Cluster Manager', path: '/clusters', icon: Network },
  { name: 'Backups & Rollbacks', path: '/backups', icon: Database },
  { name: 'AI Recommendations', path: '/ai-recommendations', icon: Sparkles },
  { name: 'Logs Console', path: '/logs', icon: ScrollText },
  { name: 'File Manager', path: '/files', icon: HardDrive },
  { name: 'Settings', path: '/settings', icon: SettingsIcon },
];

export default function Sidebar() {
  const location = useLocation();
  const [appVersion, setAppVersion] = useState('v2.1.0');
  const { gameMode, setGameMode } = useUIStore();

  useEffect(() => {
    invoke<string>('get_app_version')
      .then(ver => setAppVersion(`v${ver}`))
      .catch(err => console.error('Failed to get app version:', err));
  }, []);

  return (
    <div className="w-72 glass-panel border-r-0 border-r-white/5 flex flex-col h-screen relative z-50">
      {/* Logo */}
      <div className="p-8 pb-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-sky-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-sky-500/20">
            <Server className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">ARK Manager</h1>
            <p className="text-xs text-slate-400 font-medium tracking-wide">COMMAND CENTER</p>
          </div>
        </div>

        {/* Game Mode Switcher */}
        <div className="bg-slate-800/50 p-1 rounded-xl border border-slate-700/50 flex relative">
          <button
            onClick={() => setGameMode('ASE')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all relative z-10",
              gameMode === 'ASE' ? "text-white shadow-md shadow-sky-500/20" : "text-slate-400 hover:text-slate-200"
            )}
          >
            <div className={cn("w-2 h-2 rounded-full hidden md:block", gameMode === 'ASE' ? "bg-sky-400" : "bg-slate-600")}></div>
            ASE
          </button>
          <button
            onClick={() => setGameMode('ASA')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all relative z-10",
              gameMode === 'ASA' ? "text-white shadow-md shadow-violet-500/20" : "text-slate-400 hover:text-slate-200"
            )}
          >
            <div className={cn("w-2 h-2 rounded-full hidden md:block", gameMode === 'ASA' ? "bg-violet-400" : "bg-slate-600")}></div>
            ASA
          </button>

          {/* Sliding Background */}
          <div className={cn(
            "absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg transition-all duration-300 ease-spring",
            gameMode === 'ASE' ? "left-1 bg-gradient-to-r from-sky-600 to-blue-600" : "left-[calc(50%+4px)] bg-gradient-to-r from-violet-600 to-fuchsia-600"
          )}></div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto scrollbar-hide">
        {navigation.map((item, index) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-300 group relative overflow-hidden',
                isActive
                  ? 'text-white'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              )}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {/* Active Background */}
              {isActive && (
                <div className={cn(
                  "absolute inset-0 rounded-xl",
                  gameMode === 'ASE' 
                    ? "bg-gradient-to-r from-sky-500/20 to-blue-500/10 border border-sky-500/30 shadow-[inset_0_0_20px_rgba(14,165,233,0.1)]" 
                    : "bg-gradient-to-r from-violet-500/20 to-fuchsia-500/10 border border-violet-500/30 shadow-[inset_0_0_20px_rgba(139,92,246,0.1)]"
                )}></div>
              )}
              
              {/* Hover Shimmer */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shimmer"></div>
              
              <item.icon className={cn(
                "w-5 h-5 relative z-10 transition-all duration-300",
                isActive ? (gameMode === 'ASE' ? "text-sky-400 drop-shadow-[0_0_8px_rgba(14,165,233,0.5)]" : "text-violet-400 drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]") : (gameMode === 'ASE' ? "group-hover:text-sky-400" : "group-hover:text-violet-400")
              )} />
              <span className="text-sm font-medium relative z-10">{item.name}</span>

              {isActive && (
                <div className={cn(
                  "absolute right-3 w-2 h-2 rounded-full",
                  gameMode === 'ASE' ? "bg-sky-400 shadow-[0_0_12px_rgba(14,165,233,0.8)]" : "bg-violet-400 shadow-[0_0_12px_rgba(139,92,246,0.8)]"
                )}></div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-6 border-t border-white/5">
        <div className={cn(
          "glass-panel rounded-xl p-4 border-white/5",
          gameMode === 'ASE' ? "bg-gradient-to-br from-sky-500/10 to-blue-500/10" : "bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10"
        )}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-300">System Status</span>
            <span className="text-xs font-bold text-green-400">ONLINE</span>
          </div>
          <div className="w-full bg-slate-700/50 rounded-full h-1">
            <div className="bg-green-500 h-1 rounded-full w-full shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
          </div>
          <div className="mt-3 text-[10px] text-slate-500 text-center font-mono">
            {appVersion} • {gameMode === 'ASE' ? 'Survival Evolved' : 'Survival Ascended'}
          </div>
        </div>
      </div>
    </div>
  );
}
