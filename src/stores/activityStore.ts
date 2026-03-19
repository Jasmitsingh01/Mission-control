import { create } from 'zustand'

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
  addEvent: (event: Omit<ActivityEvent, 'id' | 'timestamp'>) => void
  clearEvents: () => void
}

let nextId = 200

export const useActivityStore = create<ActivityState>((set) => ({
  events: [],

  addEvent: (eventData) =>
    set((state) => ({
      events: [
        {
          ...eventData,
          id: `evt_${++nextId}`,
          timestamp: Date.now(),
        },
        ...state.events,
      ],
    })),

  clearEvents: () => set({ events: [] }),
}))
