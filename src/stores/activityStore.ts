import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ActivityType =
  | 'task_created'
  | 'task_moved'
  | 'task_updated'
  | 'agent_spawned'
  | 'agent_stopped'
  | 'agent_error'
  | 'job_started'
  | 'job_completed'
  | 'job_failed'
  | 'skill_triggered'
  | 'memory_written'
  | 'system'

export type Severity = 'info' | 'warning' | 'error' | 'success'

export interface ActivityEvent {
  id: string
  type: ActivityType
  severity: Severity
  message: string
  metadata?: Record<string, unknown>
  actorType: 'user' | 'agent' | 'system'
  actorId?: string
  relatedTaskId?: string
  relatedAgentId?: string
  timestamp: number
}

interface ActivityState {
  events: ActivityEvent[]
  _hydrated: boolean
  addEvent: (event: Omit<ActivityEvent, 'id' | 'timestamp'>) => void
  clearEvents: () => void
  setEvents: (events: ActivityEvent[]) => void
}

let nextId = Date.now()

export const useActivityStore = create<ActivityState>()(
  persist(
    (set) => ({
      events: [],
      _hydrated: false,

      addEvent: (eventData) =>
        set((state) => ({
          events: [
            {
              ...eventData,
              id: `evt_${++nextId}`,
              timestamp: Date.now(),
            },
            ...state.events,
          ].slice(0, 200), // Keep max 200 events
        })),

      clearEvents: () => set({ events: [] }),

      setEvents: (events) => set({ events }),
    }),
    {
      name: 'mc-activity',
      partialize: (state) => ({ events: state.events }),
      onRehydrateStorage: () => (state) => {
        if (state) state._hydrated = true
      },
    }
  )
)
