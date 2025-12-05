import { Link, useLocation } from 'react-router-dom';
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

  return (
    <div className="w-72 glass-panel border-r-0 border-r-white/5 flex flex-col h-screen relative z-50">
      {/* Logo */}
      <div className="p-8 pb-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-sky-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-sky-500/20">
            <Server className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">ARK Manager</h1>
            <p className="text-xs text-slate-400 font-medium tracking-wide">COMMAND CENTER</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto scrollbar-hide">
        {navigation.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-300 group relative overflow-hidden',
                isActive
                  ? 'text-white shadow-lg shadow-sky-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              )}
            >
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-sky-500/20 to-violet-500/20 border border-sky-500/20 rounded-xl"></div>
              )}
              <item.icon className={cn(
                "w-5 h-5 relative z-10 transition-colors",
                isActive ? "text-sky-400" : "group-hover:text-sky-400"
              )} />
              <span className="text-sm font-medium relative z-10">{item.name}</span>

              {isActive && (
                <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.5)]"></div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-6 border-t border-white/5">
        <div className="glass-panel rounded-xl p-4 bg-gradient-to-br from-sky-500/10 to-violet-500/10 border-white/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-300">System Status</span>
            <span className="text-xs font-bold text-green-400">ONLINE</span>
          </div>
          <div className="w-full bg-slate-700/50 rounded-full h-1">
            <div className="bg-green-500 h-1 rounded-full w-full shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
          </div>
          <div className="mt-3 text-[10px] text-slate-500 text-center font-mono">
            v2.0.0-beta • Premium Edition
          </div>
        </div>
      </div>
    </div>
  );
}
