import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type AgentStatus = 'idle' | 'running' | 'paused' | 'stopped' | 'error'
export type Provider = 'openai' | 'anthropic' | 'google' | 'local' | 'custom'

export interface AgentConfig {
  temperature: number
  maxTokens: number
  systemPrompt: string
}

export interface Agent {
  id: string
  name: string
  description: string
  status: AgentStatus
  provider: Provider
  model: string
  config: AgentConfig
  enabledSkills: string[]
  lastActiveAt: number | null
  errorMessage: string | null
  tasksCompleted: number
  tasksAssigned: number
  uptime: number
  createdAt: number
  updatedAt: number
}

interface AgentState {
  agents: Agent[]
  _hydrated: boolean
  addAgent: (agent: Omit<Agent, 'id' | 'createdAt' | 'updatedAt' | 'tasksCompleted' | 'uptime'>) => void
  updateAgent: (id: string, updates: Partial<Agent>) => void
  deleteAgent: (id: string) => void
  setAgentStatus: (id: string, status: AgentStatus, errorMessage?: string) => void
  setAgents: (agents: Agent[]) => void
}

let nextId = Date.now()

export const useAgentStore = create<AgentState>()(
  persist(
    (set) => ({
      agents: [],
      _hydrated: false,

      addAgent: (agentData) =>
        set((state) => ({
          agents: [
            ...state.agents,
            {
              ...agentData,
              id: `agent_${++nextId}`,
              tasksCompleted: 0,
              uptime: 0,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
          ],
        })),

      updateAgent: (id, updates) =>
        set((state) => ({
          agents: state.agents.map((a) =>
            a.id === id ? { ...a, ...updates, updatedAt: Date.now() } : a
          ),
        })),

      deleteAgent: (id) =>
        set((state) => ({
          agents: state.agents.filter((a) => a.id !== id),
        })),

      setAgentStatus: (id, status, errorMessage) =>
        set((state) => ({
          agents: state.agents.map((a) =>
            a.id === id
              ? {
                  ...a,
                  status,
                  errorMessage: errorMessage ?? (status === 'error' ? a.errorMessage : null),
                  lastActiveAt: Date.now(),
                  updatedAt: Date.now(),
                }
              : a
          ),
        })),

      setAgents: (agents) => set({ agents }),
    }),
    {
      name: 'mc-agents',
      partialize: (state) => ({ agents: state.agents }),
      onRehydrateStorage: () => (state) => {
        if (state) state._hydrated = true
      },
    }
  )
)
