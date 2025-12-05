import { create } from 'zustand';
import type { Server, ServerStatus } from '../types';

interface ServerStore {
    servers: Server[];
    activeServer: Server | null;
    setServers: (servers: Server[]) => void;
    addServer: (server: Server) => void;
    removeServer: (serverId: number) => void;
    updateServerStatus: (serverId: number, status: ServerStatus) => void;
    setActiveServer: (server: Server | null) => void;
    refreshServers: () => Promise<void>;
}

export const useServerStore = create<ServerStore>((set) => ({
    servers: [],
    activeServer: null,

    setServers: (servers) => set({ servers }),

    addServer: (server) => set((state) => ({
        servers: [...state.servers, server],
    })),

    removeServer: (serverId) => set((state) => ({
        servers: state.servers.filter((s) => s.id !== serverId),
        activeServer: state.activeServer?.id === serverId ? null : state.activeServer,
    })),

    updateServerStatus: (serverId, status) => set((state) => ({
        servers: state.servers.map((server) =>
            server.id === serverId ? { ...server, status } : server
        ),
        activeServer: state.activeServer?.id === serverId
            ? { ...state.activeServer, status }
            : state.activeServer,
    })),

    setActiveServer: (server) => set({ activeServer: server }),

    refreshServers: async () => {
        try {
            // We need to dynamically import or use a separate way to avoid circular deps if tauri imports types
            // But types don't import tauri. tauri imports types.
            const { getAllServers } = await import('../utils/tauri');
            const servers = await getAllServers();
            set({ servers });
        } catch (error) {
            console.error('Failed to refresh servers:', error);
        }
    }
}));
