/**
 * TaskStore — Zustand store for Kanban tasks.
 *
 * Dual-mode: works locally AND syncs with backend when available.
 *  - On mount, tries to fetch tasks from API (if workspaceId is set)
 *  - Falls back to local-only mode with seed data if no backend
 *  - All mutations (add/update/delete/move) call the API then update local state
 *  - SSE stream for real-time updates from other clients
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { taskApi } from '@/lib/api'
import type { TaskStatus, Priority } from '@/lib/constants'

export interface Task {
  id: string
  _serverId?: string           // MongoDB _id if synced from backend
  title: string
  description: string
  status: TaskStatus
  priority: Priority
  position: number
  assignee: string | null
  assignedAgentId: string | null
  labels: string[]
  tags: string[]
  dueDate: number | null
  result: string | null
  executionId: string | null
  progress: number
  subtasks: [number, number]
  comments: number
  commits: number
  createdAt: number
  updatedAt: number
  workspaceId?: string
  isBlocked?: boolean
  dependsOnTaskIds?: string[]
}

interface TaskState {
  tasks: Task[]
  _hydrated: boolean
  _workspaceId: string | null
  _syncing: boolean
  _lastSyncError: string | null
  _sseCleanup: (() => void) | null

  // Actions
  addTask: (task: Partial<Task> & { title: string }) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  moveTask: (id: string, newStatus: TaskStatus, newPosition: number) => void
  reorderTask: (id: string, newPosition: number) => void
  setTasks: (tasks: Task[]) => void

  // Backend sync
  setWorkspaceId: (workspaceId: string | null) => void
  fetchFromBackend: (workspaceId?: string) => Promise<void>
  connectSSE: (workspaceId: string) => void
  disconnectSSE: () => void
}

let nextId = Date.now()
function generateId() {
  return `task_${++nextId}`
}

/** Map server ITask object to client Task */
function mapServerTask(t: any): Task {
  return {
    id: t._id || t.id,
    _serverId: t._id || t.id,
    title: t.title || '',
    description: t.desc || t.description || '',
    status: t.status || 'backlog',
    priority: t.priority || 'medium',
    position: t.position ?? t.created ?? 0,
    assignee: t.assignee || null,
    assignedAgentId: t.assignedAgentId ? String(t.assignedAgentId) : null,
    labels: [],
    tags: Array.isArray(t.tags) ? t.tags : [],
    dueDate: t.dueAt ? new Date(t.dueAt).getTime() : null,
    result: null,
    executionId: null,
    progress: t.progress || 0,
    subtasks: Array.isArray(t.subtasks) && t.subtasks.length >= 2
      ? [t.subtasks[0], t.subtasks[1]] as [number, number]
      : [0, 0],
    comments: t.comments || 0,
    commits: 0,
    createdAt: t.createdAt ? new Date(t.createdAt).getTime() : (t.created || Date.now()),
    updatedAt: t.updatedAt ? new Date(t.updatedAt).getTime() : Date.now(),
    workspaceId: t.workspaceId ? String(t.workspaceId) : undefined,
    isBlocked: t.isBlocked || false,
    dependsOnTaskIds: Array.isArray(t.dependsOnTaskIds) ? t.dependsOnTaskIds.map(String) : [],
  }
}

/** Map client Task to server format for API calls */
function toServerPayload(task: Partial<Task>, workspaceId: string): Record<string, unknown> {
  const payload: Record<string, unknown> = {}
  if (task.title !== undefined) payload.title = task.title
  if (task.description !== undefined) payload.desc = task.description
  if (task.status !== undefined) payload.status = task.status
  if (task.priority !== undefined) payload.priority = task.priority
  if (task.assignee !== undefined) payload.assignee = task.assignee || 'unassigned'
  if (task.tags !== undefined) payload.tags = task.tags
  if (task.progress !== undefined) payload.progress = task.progress
  if (task.subtasks !== undefined) payload.subtasks = task.subtasks
  if (task.comments !== undefined) payload.comments = task.comments
  if (task.dueDate !== undefined) payload.dueAt = task.dueDate ? new Date(task.dueDate) : undefined
  if (task.assignedAgentId !== undefined) payload.assignedAgentId = task.assignedAgentId
  payload.workspaceId = workspaceId
  return payload
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: [],
      _hydrated: false,
      _workspaceId: null,
      _syncing: false,
      _lastSyncError: null,
      _sseCleanup: null,

      setWorkspaceId: (workspaceId) => {
        set({ _workspaceId: workspaceId })
        if (workspaceId) {
          get().fetchFromBackend(workspaceId)
          get().connectSSE(workspaceId)
        } else {
          get().disconnectSSE()
        }
      },

      fetchFromBackend: async (workspaceId) => {
        const wsId = workspaceId || get()._workspaceId
        if (!wsId) return

        set({ _syncing: true, _lastSyncError: null })
        try {
          const data = await taskApi.getAll(wsId)
          const serverTasks: Task[] = (data.tasks || []).map(mapServerTask)
          // Merge: keep local-only tasks, update/add server tasks
          set((state) => {
            const localOnlyTasks = state.tasks.filter(t => !t._serverId && !t.workspaceId)
            const merged = [...serverTasks, ...localOnlyTasks]
            return { tasks: merged, _syncing: false }
          })
        } catch (err: any) {
          console.warn('[TaskStore] Backend fetch failed, using local data:', err.message)
          set({ _syncing: false, _lastSyncError: err.message })
        }
      },

      connectSSE: (workspaceId) => {
        // Disconnect existing
        get().disconnectSSE()

        const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
        const token = localStorage.getItem('mc_auth_token')
        if (!token) return

        try {
          const orgId = localStorage.getItem('mc_current_org_id') || ''
          const url = `${apiBase}/streams/workspaces/${workspaceId}/tasks/stream?token=${encodeURIComponent(token)}&orgId=${encodeURIComponent(orgId)}`
          const evtSource = new EventSource(url)

          evtSource.addEventListener('task.new', (e: MessageEvent) => {
            try {
              const serverTask = JSON.parse(e.data)
              const mapped = mapServerTask(serverTask)
              set((state) => {
                // Don't duplicate if already exists
                if (state.tasks.some(t => t.id === mapped.id || t._serverId === mapped._serverId)) {
                  return { tasks: state.tasks.map(t => (t.id === mapped.id || t._serverId === mapped._serverId) ? { ...t, ...mapped } : t) }
                }
                return { tasks: [...state.tasks, mapped] }
              })
            } catch { /* ignore */ }
          })

          evtSource.addEventListener('task.updated', (e: MessageEvent) => {
            try {
              const serverTask = JSON.parse(e.data)
              const mapped = mapServerTask(serverTask)
              set((state) => ({
                tasks: state.tasks.map(t =>
                  (t.id === mapped.id || t._serverId === mapped._serverId) ? { ...t, ...mapped } : t
                )
              }))
            } catch { /* ignore */ }
          })

          evtSource.onerror = () => {
            // EventSource auto-reconnects
          }

          set({ _sseCleanup: () => evtSource.close() })
        } catch {
          // SSE not available
        }
      },

      disconnectSSE: () => {
        const cleanup = get()._sseCleanup
        if (cleanup) {
          cleanup()
          set({ _sseCleanup: null })
        }
      },

      addTask: (taskData) => {
        const state = get()
        const status = taskData.status || 'backlog'
        const tasksInColumn = state.tasks.filter(t => t.status === status)
        const maxPosition = tasksInColumn.length > 0 ? Math.max(...tasksInColumn.map(t => t.position)) : -1
        const now = Date.now()

        const newTask: Task = {
          id: generateId(),
          title: taskData.title,
          description: taskData.description || '',
          status,
          priority: taskData.priority || 'medium',
          position: maxPosition + 1,
          assignee: taskData.assignee || null,
          assignedAgentId: taskData.assignedAgentId || null,
          labels: taskData.labels || [],
          tags: taskData.tags || [],
          dueDate: taskData.dueDate || null,
          result: taskData.result ?? null,
          executionId: taskData.executionId ?? null,
          progress: taskData.progress || 0,
          subtasks: taskData.subtasks || [0, 0],
          comments: taskData.comments || 0,
          commits: taskData.commits || 0,
          createdAt: now,
          updatedAt: now,
        }

        // Optimistic update
        set(s => ({ tasks: [...s.tasks, newTask] }))

        // Sync to backend
        const wsId = state._workspaceId
        if (wsId) {
          taskApi.create({
            title: newTask.title,
            desc: newTask.description,
            status: newTask.status,
            assignee: newTask.assignee || 'unassigned',
            priority: newTask.priority,
            tags: newTask.tags,
            workspaceId: wsId,
          }).then(data => {
            if (data.task?._id) {
              set(s => ({
                tasks: s.tasks.map(t => t.id === newTask.id
                  ? { ...t, id: data.task._id, _serverId: data.task._id }
                  : t
                )
              }))
            }
          }).catch(err => {
            console.warn('[TaskStore] Failed to sync new task to backend:', err.message)
          })
        }
      },

      updateTask: (id, updates) => {
        // Optimistic update
        set(s => ({
          tasks: s.tasks.map(t => t.id === id ? { ...t, ...updates, updatedAt: Date.now() } : t)
        }))

        // Sync to backend
        const task = get().tasks.find(t => t.id === id)
        const serverId = task?._serverId
        const wsId = get()._workspaceId
        if (serverId && wsId) {
          taskApi.update(serverId, toServerPayload(updates, wsId)).catch(err => {
            console.warn('[TaskStore] Failed to sync update to backend:', err.message)
          })
        }
      },

      deleteTask: (id) => {
        const task = get().tasks.find(t => t.id === id)
        const serverId = task?._serverId

        // Optimistic delete
        set(s => ({ tasks: s.tasks.filter(t => t.id !== id) }))

        // Sync to backend
        if (serverId) {
          taskApi.delete(serverId).catch(err => {
            console.warn('[TaskStore] Failed to sync delete to backend:', err.message)
          })
        }
      },

      moveTask: (id, newStatus, newPosition) => {
        // Optimistic update
        set(s => ({
          tasks: s.tasks.map(t =>
            t.id === id ? { ...t, status: newStatus, position: newPosition, updatedAt: Date.now() } : t
          )
        }))

        // Sync to backend
        const task = get().tasks.find(t => t.id === id)
        const serverId = task?._serverId
        const wsId = get()._workspaceId
        if (serverId && wsId) {
          taskApi.update(serverId, { status: newStatus }).catch(err => {
            console.warn('[TaskStore] Failed to sync move to backend:', err.message)
          })
        }
      },

      reorderTask: (id, newPosition) => {
        set(s => ({
          tasks: s.tasks.map(t => t.id === id ? { ...t, position: newPosition, updatedAt: Date.now() } : t)
        }))
      },

      setTasks: (tasks) => set({ tasks }),
    }),
    {
      name: 'mc-tasks-v3',
      partialize: (state) => ({
        tasks: state.tasks,
        _workspaceId: state._workspaceId,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state._hydrated = true
          // If we have a saved workspaceId, fetch from backend
          if (state._workspaceId) {
            setTimeout(() => {
              state.fetchFromBackend(state._workspaceId!)
              state.connectSSE(state._workspaceId!)
            }, 500)
          }
        }
      },
    }
  )
)
