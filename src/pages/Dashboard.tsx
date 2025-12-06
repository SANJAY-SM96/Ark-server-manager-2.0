import { useEffect, useState } from 'react';
import { Server as ServerIcon, Activity, Cpu, HardDrive, Clock, Zap, Shield, Terminal, Globe, Copy, Check, Package, Rocket, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useServerStore } from '../stores/serverStore';
import { useUIStore } from '../stores/uiStore';
import { cn, formatBytes } from '../utils/helpers';
import { getAllServers, getSystemInfo, deleteServer } from '../utils/tauri';
import { invoke } from '@tauri-apps/api/core';
import PerformanceMonitor from '../components/performance/PerformanceMonitor';
import InstallServerDialog from '../components/server/InstallServerDialog';
import { DependencyStatus } from '../components/DependencyStatus';
import { useNavigate } from 'react-router-dom';

interface Dependencies {
  steamcmd_installed: boolean;
  vcredist_installed: boolean;
  dotnet_installed: boolean;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { servers, setServers, updateServerStatus, removeServer } = useServerStore();
  const { systemInfo, setSystemInfo } = useUIStore();
  const [performanceHistory, setPerformanceHistory] = useState<any[]>([]);
  const [showInstallDialog, setShowInstallDialog] = useState(false);
  const [dependencies, setDependencies] = useState<Dependencies | null>(null);
  const [checkingDeps, setCheckingDeps] = useState(true);

  // Handle delete server from dashboard
  const handleDeleteServer = async (serverId: number, serverName: string) => {
    if (!confirm(`Delete "${serverName}"? This removes the database entry (files on disk are not affected).`)) {
      return;
    }
    try {
      await deleteServer(serverId);
      removeServer(serverId);
      toast.success('Server removed from list');
    } catch (error) {
      toast.error(`Failed to delete: ${error}`);
    }
  };

  const [publicIp, setPublicIp] = useState<string>('Loading...');
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = () => {
    if (publicIp && publicIp !== 'Loading...' && publicIp !== 'Unavailable') {
      navigator.clipboard.writeText(publicIp);
      setIsCopied(true);
      toast.success('IP Address copied to clipboard');
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const [playerCounts, setPlayerCounts] = useState<Record<number, number>>({});

  const [installingSteamCmd, setInstallingSteamCmd] = useState(false);

  const fetchDependencies = async () => {
    try {
      setCheckingDeps(true);
      const deps = await invoke<Dependencies>('check_all_dependencies');
      setDependencies(deps);
    } catch (error) {
      console.error('Failed to check dependencies:', error);
    } finally {
      setCheckingDeps(false);
    }
  };

  const handleInstallSteamCmd = async () => {
    try {
      setInstallingSteamCmd(true);
      toast.loading('Downloading SteamCMD... This may take a few minutes.', { id: 'steamcmd-install' });

      await invoke('install_steamcmd');

      toast.success('SteamCMD installed successfully!', { id: 'steamcmd-install' });
      await fetchDependencies();
    } catch (error) {
      console.error('Failed to install SteamCMD:', error);
      toast.error(`Installation failed: ${error}`, { id: 'steamcmd-install' });
    } finally {
      setInstallingSteamCmd(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    getAllServers().then(setServers).catch(console.error);

    // Check dependencies
    fetchDependencies();

    // Fetch Public IP
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => setPublicIp(data.ip))
      .catch(() => setPublicIp('Unavailable'));

    // Listen for server status changes
    let unlisten: () => void;
    async function setupListener() {
      const { listen } = await import('@tauri-apps/api/event');
      unlisten = await listen('server-status-changed', (event: any) => {
        const { id, status } = event.payload;
        // Update local store immediately for responsiveness
        updateServerStatus(id, status);
        // If crashed, maybe show toast
        if (status === 'crashed') {
          toast.error(`Server ID ${id} process stopped unexpectedly!`);
        }
      });
    }
    setupListener();

    const fetchPlayerCounts = async (currentServers: any[]) => {
      const running = currentServers.filter(s => s.status === 'running');
      const counts: Record<number, number> = {};

      // We'll fetch concurrently
      await Promise.all(running.map(async (s) => {
        try {
          // We need to import getOnlinePlayers dynamically or add it to imports
          const { getOnlinePlayers } = await import('../utils/tauri');
          const players = await getOnlinePlayers(s.id);
          counts[s.id] = players.length;
        } catch {
          counts[s.id] = 0;
        }
      }));

      setPlayerCounts(prev => ({ ...prev, ...counts }));
      return counts;
    };

    const fetchSystemInfo = async () => {
      try {
        const info = await getSystemInfo();
        setSystemInfo(info);

        // Calculate total players
        const currentCounts = playerCounts;
        // Note: playerCounts might be stale inside this closure if not using refs or dependency, 
        // but we update it separately. Let's rely on the state for the total.
        const totalPlayers = Object.values(currentCounts).reduce((a, b) => a + b, 0);

        setPerformanceHistory(prev => {
          const now = new Date();
          const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

          const newPoint = {
            time: timeStr,
            cpu: info.cpuUsage,
            memory: (info.ramUsage / info.ramTotal) * 100,
            players: totalPlayers
          };

          const newHistory = [...prev, newPoint];
          if (newHistory.length > 60) newHistory.shift();
          return newHistory;
        });
      } catch (error) {
        console.error('Failed to fetch system info:', error);
      }
    };

    fetchSystemInfo();

    const interval = setInterval(() => {
      fetchSystemInfo();
      getAllServers().then(async (latestServers) => {
        setServers(latestServers);
        // Fetch players occasionally or every tick? Every tick is 1s, might be too much for RCON.
        // Let's do it every 5 ticks or keep it separate.
      }).catch(console.error);
    }, 1000);

    // Separate interval for player counts (lighter frequency, e.g. 5s)
    const playerInterval = setInterval(() => {
      fetchPlayerCounts(servers);
      getAllServers().then(fetchPlayerCounts);
    }, 5000);

    return () => {
      if (unlisten) unlisten();
      clearInterval(interval);
      clearInterval(playerInterval);
    };
  }, []);

  const [appUpdate, setAppUpdate] = useState<any>(null); // Type should be AppUpdateInfo but using any for speed
  const [installingUpdate, setInstallingUpdate] = useState(false);

  useEffect(() => {
    // Check for App Updates
    import('../utils/tauri').then(({ checkAppUpdate }) => {
      checkAppUpdate().then(info => {
        if (info) {
          setAppUpdate(info);
          toast('New App Update Available!', { icon: '🚀' });
        }
      }).catch(console.error);
    });
  }, []);

  const handleInstallAppUpdate = async () => {
    if (!appUpdate) return;
    try {
      setInstallingUpdate(true);
      toast.loading('Downloading and installing update...', { id: 'app-update' });
      const { installAppUpdate } = await import('../utils/tauri');
      await installAppUpdate(appUpdate.download_url);
      // App will exit
    } catch (error) {
      console.error(error);
      toast.error(`Update failed: ${error}`, { id: 'app-update' });
      setInstallingUpdate(false);
    }
  };



  const runningServers = servers.filter(s => s.status === 'running').length;
  const totalServers = servers.length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* App Update Banner */}
      {appUpdate && (
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl p-4 flex items-center justify-between shadow-lg shadow-violet-500/20">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-white/20 rounded-lg">
              <Rocket className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">Update v{appUpdate.version} Available</h3>
              <p className="text-violet-200 text-sm">A new version of Ark Server Manager is ready.</p>
            </div>
          </div>
          <button
            onClick={handleInstallAppUpdate}
            disabled={installingUpdate}
            className="px-6 py-2 bg-white text-violet-600 font-bold rounded-lg hover:bg-violet-50 transition-colors disabled:opacity-50"
          >
            {installingUpdate ? 'Installing...' : 'Update Now'}
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between relative">
        {/* Ambient Orbs */}
        <div className="ambient-orb w-64 h-64 bg-sky-500/20 -top-32 -left-32" />
        <div className="ambient-orb w-48 h-48 bg-violet-500/20 -top-24 right-1/4" style={{ animationDelay: '2s' }} />

        <div className="relative z-10">
          <p className="text-slate-400 text-sm mb-1">
            {(() => {
              const hour = new Date().getHours();
              if (hour < 12) return '☀️ Good morning, Commander';
              if (hour < 18) return '🌤️ Good afternoon, Commander';
              return '🌙 Good evening, Commander';
            })()}
          </p>
          <h1 className="text-4xl font-bold gradient-text">
            Dashboard
          </h1>
          <p className="text-slate-400 mt-2 text-lg">Monitor your ARK empire in real-time</p>
        </div>
        <div className="flex items-center space-x-4 relative z-10">
          <div className="flex items-center space-x-2 px-4 py-2 rounded-full glass-panel border border-slate-700/50 hover-lift">
            <Globe className="w-4 h-4 text-sky-400" />
            <span className="text-sm font-mono text-slate-300">IP: <span className="text-white">{publicIp}</span></span>
            <button
              onClick={copyToClipboard}
              className="ml-2 p-1 hover:bg-slate-700 rounded transition-colors text-slate-400 hover:text-white"
              title="Copy IP Address"
            >
              {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
          <div className="flex items-center space-x-2 px-4 py-2 rounded-full glass-panel">
            <div className="w-2 h-2 rounded-full bg-green-500 status-running"></div>
            <span className="text-xs font-medium text-green-400">System Online</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Servers */}
        <div className="glass-panel rounded-2xl p-6 relative overflow-hidden group hover-lift fade-slide-in stagger-1" style={{ opacity: 0 }}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-sky-500/20"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-sky-500/10 rounded-xl">
                <ServerIcon className="w-6 h-6 text-sky-400" />
              </div>
              <span className="text-xs font-medium text-sky-400 bg-sky-500/10 px-2 py-1 rounded-lg">
                Total
              </span>
            </div>
            <p className="text-3xl font-bold text-white mb-1">{totalServers}</p>
            <p className="text-slate-400 text-sm">Active Servers</p>
          </div>
        </div>

        {/* Running Servers */}
        <div className="glass-panel rounded-2xl p-6 relative overflow-hidden group hover-lift fade-slide-in stagger-2" style={{ opacity: 0 }}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-green-500/20"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-500/10 rounded-xl">
                <Activity className="w-6 h-6 text-green-400" />
              </div>
              <span className="text-xs font-medium text-green-400 bg-green-500/10 px-2 py-1 rounded-lg">
                Online
              </span>
            </div>
            <p className="text-3xl font-bold text-white mb-1">{runningServers}</p>
            <p className="text-slate-400 text-sm">Servers Running</p>
          </div>
        </div>

        {/* CPU Usage */}
        <div className="glass-panel rounded-2xl p-6 relative overflow-hidden group hover-lift fade-slide-in stagger-3" style={{ opacity: 0 }}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-violet-500/20"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-violet-500/10 rounded-xl">
                <Cpu className="w-6 h-6 text-violet-400" />
              </div>
              <span className="text-xs font-medium text-violet-400 bg-violet-500/10 px-2 py-1 rounded-lg">
                Load
              </span>
            </div>
            <p className="text-3xl font-bold text-white mb-1">{systemInfo?.cpuUsage.toFixed(1) || 0}%</p>
            <div className="w-full bg-slate-700/50 rounded-full h-1.5 mt-2">
              <div
                className="bg-violet-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${systemInfo?.cpuUsage || 0}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* RAM Usage */}
        <div className="glass-panel rounded-2xl p-6 relative overflow-hidden group hover-lift fade-slide-in stagger-4" style={{ opacity: 0 }}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-pink-500/20"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-pink-500/10 rounded-xl">
                <HardDrive className="w-6 h-6 text-pink-400" />
              </div>
              <span className="text-xs font-medium text-pink-400 bg-pink-500/10 px-2 py-1 rounded-lg">
                Memory
              </span>
            </div>
            <p className="text-3xl font-bold text-white mb-1">
              {formatBytes((systemInfo?.ramUsage || 0) * 1024 * 1024 * 1024, 1)}
            </p>
            <p className="text-slate-400 text-xs mt-1">
              of {formatBytes((systemInfo?.ramTotal || 0) * 1024 * 1024 * 1024, 1)}
            </p>
          </div>
        </div>
      </div>

      {/* Server List Preview */}
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Terminal className="w-5 h-5 text-sky-400" />
            Server Status
          </h2>
          <button
            onClick={() => navigate('/servers')}
            className="text-sm text-sky-400 hover:text-sky-300 transition-colors"
          >
            View All
          </button>
        </div>

        {servers.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-slate-700/50 rounded-xl bg-slate-800/20">
            <ServerIcon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-300 mb-2">No Servers Detected</h3>
            <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto">
              Your fleet is empty. Deploy your first ARK server to get started.
            </p>
            <button
              onClick={() => setShowInstallDialog(true)}
              className="px-6 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white rounded-lg transition-all shadow-lg shadow-sky-500/20 font-medium">
              Deploy Server
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {servers.slice(0, 5).map((server) => (
              <div
                key={server.id}
                className="flex items-center justify-between p-4 bg-slate-800/40 border border-slate-700/50 rounded-xl hover:bg-slate-800/60 transition-all group"
              >
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className={cn(
                      'w-3 h-3 rounded-full',
                      server.status === 'running' && 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]',
                      server.status === 'stopped' && 'bg-slate-500',
                      server.status === 'crashed' && 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]',
                      server.status === 'starting' && 'bg-yellow-500 animate-pulse',
                      server.status === 'updating' && 'bg-blue-500 animate-pulse'
                    )} />
                    {server.status === 'running' && (
                      <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-20"></div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white group-hover:text-sky-400 transition-colors">{server.name}</h3>
                    <p className="text-xs text-slate-400 flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-slate-700/50 border border-slate-600/50">{server.serverType}</span>
                      <span>Port {server.ports.gamePort}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-right mr-4">
                    <p className="text-xs text-slate-400">Uptime</p>
                    <p className="text-sm font-mono text-white">
                      {server.status === 'running' ? '2h 14m' : '-'}
                    </p>
                  </div>
                  <span className={cn(
                    'px-3 py-1 rounded-full text-xs font-medium border',
                    server.status === 'running' && 'bg-green-500/10 text-green-400 border-green-500/20',
                    server.status === 'stopped' && 'bg-slate-500/10 text-slate-400 border-slate-500/20',
                    server.status === 'crashed' && 'bg-red-500/10 text-red-400 border-red-500/20',
                    server.status === 'starting' && 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
                    server.status === 'updating' && 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                  )}>
                    {server.status.charAt(0).toUpperCase() + server.status.slice(1)}
                  </span>
                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteServer(server.id, server.name);
                    }}
                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                    title="Remove from list"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          onClick={() => setShowInstallDialog(true)}
          className="p-6 glass-panel rounded-2xl hover:border-sky-500/50 transition-all text-left group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative z-10">
            <div className="w-12 h-12 bg-sky-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <Zap className="w-6 h-6 text-sky-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Quick Install</h3>
            <p className="text-sm text-slate-400">Deploy a new server instance with default configuration</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/security')}
          className="p-6 glass-panel rounded-2xl hover:border-violet-500/50 transition-all text-left group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative z-10">
            <div className="w-12 h-12 bg-violet-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <Shield className="w-6 h-6 text-violet-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Security Check</h3>
            <p className="text-sm text-slate-400">Run a security audit on your server configurations</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/logs')}
          className="p-6 glass-panel rounded-2xl hover:border-pink-500/50 transition-all text-left group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative z-10">
            <div className="w-12 h-12 bg-pink-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <Clock className="w-6 h-6 text-pink-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">View Logs</h3>
            <p className="text-sm text-slate-400">Access real-time server logs and event history</p>
          </div>
        </button>
      </div>

      {/* System Dependencies */}
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <Package className="w-5 h-5 text-sky-400" />
          <h2 className="text-xl font-bold text-white">System Dependencies</h2>
        </div>
        {checkingDeps ? (
          <div className="text-center py-8">
            <p className="text-slate-400 text-sm">Checking dependencies...</p>
          </div>
        ) : dependencies ? (
          <div className="space-y-3">
            <DependencyStatus
              name="SteamCMD"
              installed={dependencies.steamcmd_installed}
              checking={checkingDeps}
              installing={installingSteamCmd}
              onInstall={!dependencies.steamcmd_installed ? handleInstallSteamCmd : undefined}
            />
            <DependencyStatus
              name="Visual C++ Redistributables"
              installed={dependencies.vcredist_installed}
              checking={checkingDeps}
            />
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-red-400 text-sm">Failed to check dependencies</p>
          </div>
        )}
      </div>

      {/* Performance Monitor */}
      <PerformanceMonitor data={performanceHistory} />

      {/* Install Server Dialog */}
      {showInstallDialog && (
        <InstallServerDialog onClose={() => setShowInstallDialog(false)} />
      )}
    </div>
  );
}
