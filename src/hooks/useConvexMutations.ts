import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useAuthStore } from '@/stores/authStore'

export function useTaskMutations() {
  const userId = useAuthStore((s) => s.user?.id || '')
  const add = useMutation(api.tasks.mutations.add)
  const update = useMutation(api.tasks.mutations.update)
  const remove = useMutation(api.tasks.mutations.remove)
  const move = useMutation(api.tasks.mutations.move)

  return {
    addTask: (data: any) => add({ ...data, userId }),
    updateTask: (id: any, updates: any) => update({ id, userId, ...updates }),
    deleteTask: (id: any) => remove({ id, userId }),
    moveTask: (id: any, status: any, position: number) => move({ id, userId, newStatus: status, newPosition: position }),
  }
}

export function useAgentMutations() {
  const userId = useAuthStore((s) => s.user?.id || '')
  const add = useMutation(api.agents.mutations.add)
  const update = useMutation(api.agents.mutations.update)
  const remove = useMutation(api.agents.mutations.remove)

  return {
    addAgent: (data: any) => add({ ...data, userId }),
    updateAgent: (id: any, updates: any) => update({ id, userId, ...updates }),
    deleteAgent: (id: any) => remove({ id, userId }),
  }
}

export function useActivityMutations() {
  const userId = useAuthStore((s) => s.user?.id || '')
  const add = useMutation(api.activity.mutations.add)
  const clear = useMutation(api.activity.mutations.clear)

  return {
    addEvent: (data: any) => add({ ...data, userId }),
    clearEvents: () => clear({ userId }),
  }
}

export function useJobMutations() {
  const userId = useAuthStore((s) => s.user?.id || '')
  const add = useMutation(api.jobs.mutations.add)
  const update = useMutation(api.jobs.mutations.update)
  const remove = useMutation(api.jobs.mutations.remove)
  const toggle = useMutation(api.jobs.mutations.toggle)

  return {
    addJob: (data: any) => add({ ...data, userId }),
    updateJob: (id: any, updates: any) => update({ id, userId, ...updates }),
    deleteJob: (id: any) => remove({ id, userId }),
    toggleJob: (id: any) => toggle({ id, userId }),
  }
}

export function useMemoryMutations() {
  const userId = useAuthStore((s) => s.user?.id || '')
  const add = useMutation(api.memory.mutations.add)
  const update = useMutation(api.memory.mutations.update)
  const remove = useMutation(api.memory.mutations.remove)

  return {
    addEntry: (data: any) => add({ ...data, userId }),
    updateEntry: (id: any, updates: any) => update({ id, userId, ...updates }),
    deleteEntry: (id: any) => remove({ id, userId }),
  }
}

export function useSkillMutations() {
  const userId = useAuthStore((s) => s.user?.id || '')
  const install = useMutation(api.skills.mutations.install)
  const uninstall = useMutation(api.skills.mutations.uninstall)

  return {
    installSkill: (id: any) => install({ id, userId }),
    uninstallSkill: (id: any) => uninstall({ id, userId }),
  }
}
