import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SystemInfo } from '../types';

interface UIStore {
  isLoading: boolean;
  systemInfo: SystemInfo | null;
  gameMode: 'ASE' | 'ASA';
  setLoading: (loading: boolean) => void;
  setSystemInfo: (info: SystemInfo) => void;
  setGameMode: (mode: 'ASE' | 'ASA') => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      isLoading: false,
      systemInfo: null,
      gameMode: 'ASE',
      setLoading: (loading) => set({ isLoading: loading }),
      setSystemInfo: (info) => set({ systemInfo: info }),
      setGameMode: (mode) => set({ gameMode: mode }),
    }),
    {
      name: 'ark-ui-storage',
      partialize: (state) => ({ gameMode: state.gameMode }), // Only persist gameMode
    }
  )
);
