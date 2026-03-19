import { useAuthStore } from '@/stores/authStore'
import { useCallback } from 'react'

/**
 * Convex mutation hooks - provide no-op stubs when Convex is not configured.
 * When Convex is set up (`npx convex dev`), replace these with actual
 * useMutation calls from convex/react.
 *
 * For now, all mutations go through Zustand stores (local state).
 * The stores will be synced to Convex when it's configured.
 */

const noop = (..._args: any[]) => Promise.resolve()

export function useTaskMutations() {
  return {
    addTask: noop,
    updateTask: noop,
    deleteTask: noop,
    moveTask: noop,
  }
}

export function useAgentMutations() {
  return {
    addAgent: noop,
    updateAgent: noop,
    deleteAgent: noop,
  }
}

export function useActivityMutations() {
  return {
    addEvent: noop,
    clearEvents: noop,
  }
}

export function useJobMutations() {
  return {
    addJob: noop,
    updateJob: noop,
    deleteJob: noop,
    toggleJob: noop,
  }
}

export function useMemoryMutations() {
  return {
    addEntry: noop,
    updateEntry: noop,
    deleteEntry: noop,
  }
}

export function useSkillMutations() {
  return {
    installSkill: noop,
    uninstallSkill: noop,
  }
}
