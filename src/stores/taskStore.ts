import { create } from 'zustand'
import type { TaskStatus, Priority } from '@/lib/constants'

export interface Task {
  id: string
  title: string
  description: string
  status: TaskStatus
  priority: Priority
  position: number
  assignedAgentId: string | null
  labels: string[]
  dueDate: number | null
  createdAt: number
  updatedAt: number
}

interface TaskState {
  tasks: Task[]
  addTask: (task: Omit<Task, 'id' | 'position' | 'createdAt' | 'updatedAt'>) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  moveTask: (id: string, newStatus: TaskStatus, newPosition: number) => void
  reorderTask: (id: string, newPosition: number) => void
}

let nextId = 100

function generateId() {
  return `task_${++nextId}`
}

export const useTaskStore = create<TaskState>((set) => ({
  tasks: [],

  addTask: (taskData) =>
    set((state) => {
      const tasksInColumn = state.tasks.filter((t) => t.status === taskData.status)
      const maxPosition = tasksInColumn.length > 0
        ? Math.max(...tasksInColumn.map((t) => t.position))
        : -1
      const now = Date.now()
      const newTask: Task = {
        ...taskData,
        id: generateId(),
        position: maxPosition + 1,
        createdAt: now,
        updatedAt: now,
      }
      return { tasks: [...state.tasks, newTask] }
    }),

  updateTask: (id, updates) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, ...updates, updatedAt: Date.now() } : t
      ),
    })),

  deleteTask: (id) =>
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
    })),

  moveTask: (id, newStatus, newPosition) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id
          ? { ...t, status: newStatus, position: newPosition, updatedAt: Date.now() }
          : t
      ),
    })),

  reorderTask: (id, newPosition) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, position: newPosition, updatedAt: Date.now() } : t
      ),
    })),
}))
