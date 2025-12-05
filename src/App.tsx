import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import ServerManager from './pages/ServerManager';
import ModManager from './pages/ModManager';
import ConfigEditor from './pages/ConfigEditor';
import ClusterManager from './pages/ClusterManager';
import Backups from './pages/Backups';
import AIRecommendations from './pages/AIRecommendations';
import LogsConsole from './pages/LogsConsole';
import PlayerManager from './pages/PlayerManager';
import TribeManager from './pages/TribeManager';
import DinoManager from './pages/DinoManager';
import SecurityManager from './pages/SecurityManager';
import Automation from './pages/Automation';
import NetworkManager from './pages/NetworkManager';
import UpdateManager from './pages/UpdateManager';
import Settings from './pages/Settings';
import MapManager from './pages/MapManager';
import FileManager from './pages/FileManager';
import { OnboardingDialog } from './components/OnboardingDialog';

function App() {
    const [showOnboarding, setShowOnboarding] = useState(false);

    useEffect(() => {
        // Check if this is the first launch
        const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
        if (!hasSeenOnboarding) {
            setShowOnboarding(true);
        }
    }, []);

    const handleOnboardingComplete = () => {
        localStorage.setItem('hasSeenOnboarding', 'true');
        setShowOnboarding(false);
    };

    return (
        <>
            {showOnboarding && <OnboardingDialog onComplete={handleOnboardingComplete} />}
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<AppLayout />}>
                        <Route index element={<Navigate to="/dashboard" replace />} />
                        <Route path="dashboard" element={<Dashboard />} />
                        <Route path="servers" element={<ServerManager />} />
                        <Route path="mods" element={<ModManager />} />
                        <Route path="players" element={<PlayerManager />} />
                        <Route path="tribes" element={<TribeManager />} />
                        <Route path="dinos" element={<DinoManager />} />
                        <Route path="security" element={<SecurityManager />} />
                        <Route path="automation" element={<Automation />} />
                        <Route path="network" element={<NetworkManager />} />
                        <Route path="updates" element={<UpdateManager />} />
                        <Route path="config" element={<ConfigEditor />} />
                        <Route path="maps" element={<MapManager />} />
                        <Route path="clusters" element={<ClusterManager />} />
                        <Route path="backups" element={<Backups />} />
                        <Route path="ai-recommendations" element={<AIRecommendations />} />
                        <Route path="logs" element={<LogsConsole />} />
                        <Route path="files" element={<FileManager />} />
                        <Route path="settings" element={<Settings />} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </>
    );
}

export default App;
