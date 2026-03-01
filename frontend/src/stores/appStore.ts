import { create } from 'zustand'

interface AppState {
  // Global app state — expand as features are added
}

export const useAppStore = create<AppState>(() => ({}))
