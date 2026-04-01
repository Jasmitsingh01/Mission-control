import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Priority } from '@/lib/constants'

export type JobStatus = 'scheduled' | 'running' | 'paused' | 'failed'

export interface ScheduledJob {
  id: string
  name: string
  description: string
  cronExpression: string
  cronHuman: string
  targetAgentId: string | null
  priority: Priority
  enabled: boolean
  lastRunAt: number | null
  nextRunAt: number
  status: JobStatus
  errorMessage: string | null
  runCount: number
  successCount: number
  failCount: number
  createdAt: number
  updatedAt: number
}

interface JobState {
  jobs: ScheduledJob[]
  _hydrated: boolean
  addJob: (job: Omit<ScheduledJob, 'id' | 'createdAt' | 'updatedAt' | 'runCount' | 'successCount' | 'failCount'>) => void
  updateJob: (id: string, updates: Partial<ScheduledJob>) => void
  deleteJob: (id: string) => void
  toggleJob: (id: string) => void
  setJobs: (jobs: ScheduledJob[]) => void
}

let nextId = Date.now()

export const useJobStore = create<JobState>()(
  persist(
    (set) => ({
      jobs: [],
      _hydrated: false,

      addJob: (jobData) =>
        set((state) => ({
          jobs: [
            ...state.jobs,
            {
              ...jobData,
              id: `job_${++nextId}`,
              runCount: 0,
              successCount: 0,
              failCount: 0,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
          ],
        })),

      updateJob: (id, updates) =>
        set((state) => ({
          jobs: state.jobs.map((j) =>
            j.id === id ? { ...j, ...updates, updatedAt: Date.now() } : j
          ),
        })),

      deleteJob: (id) =>
        set((state) => ({ jobs: state.jobs.filter((j) => j.id !== id) })),

      toggleJob: (id) =>
        set((state) => ({
          jobs: state.jobs.map((j) =>
            j.id === id
              ? { ...j, enabled: !j.enabled, status: !j.enabled ? 'scheduled' : 'paused', updatedAt: Date.now() }
              : j
          ),
        })),

      setJobs: (jobs) => set({ jobs }),
    }),
    {
      name: 'mc-jobs',
      partialize: (state) => ({ jobs: state.jobs }),
      onRehydrateStorage: () => (state) => {
        if (state) state._hydrated = true
      },
    }
  )
)
