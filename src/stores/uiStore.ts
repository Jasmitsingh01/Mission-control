import { create } from 'zustand'

interface UIState {
  sidebarCollapsed: boolean
  activePanel: string | null
  toggleSidebar: () => void
  setActivePanel: (panel: string | null) => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  activePanel: null,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setActivePanel: (panel) => set({ activePanel: panel }),
}))
