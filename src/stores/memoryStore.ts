import { create } from 'zustand'

export type MemoryType = 'conversation' | 'fact' | 'preference' | 'context' | 'tool_result'

export interface MemoryEntry {
  id: string
  agentId: string
  agentName: string
  sessionId: string
  type: MemoryType
  content: string
  metadata?: Record<string, unknown>
  expiresAt: number | null
  createdAt: number
  updatedAt: number
}

interface MemoryState {
  entries: MemoryEntry[]
  addEntry: (entry: Omit<MemoryEntry, 'id' | 'createdAt' | 'updatedAt'>) => void
  deleteEntry: (id: string) => void
  updateEntry: (id: string, updates: Partial<MemoryEntry>) => void
}

let nextId = 500

export const useMemoryStore = create<MemoryState>((set) => ({
  entries: [],

  addEntry: (entryData) =>
    set((state) => ({
      entries: [
        { ...entryData, id: `mem_${++nextId}`, createdAt: Date.now(), updatedAt: Date.now() },
        ...state.entries,
      ],
    })),

  deleteEntry: (id) =>
    set((state) => ({ entries: state.entries.filter((e) => e.id !== id) })),

  updateEntry: (id, updates) =>
    set((state) => ({
      entries: state.entries.map((e) =>
        e.id === id ? { ...e, ...updates, updatedAt: Date.now() } : e
      ),
    })),
}))
