import { useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useTaskStore } from '@/stores/taskStore'
import { useAgentStore } from '@/stores/agentStore'
import { useActivityStore } from '@/stores/activityStore'
import { useJobStore } from '@/stores/jobStore'
import { useMemoryStore } from '@/stores/memoryStore'

// Convex sync is enabled only when VITE_CONVEX_URL is set and convex/_generated exists.
// Until then, Zustand stores work in local-only mode.
let convexApi: any = null
let useQueryHook: any = null

try {
  // Dynamic imports will only resolve after `npx convex dev` generates the API
  const convexReact = await import('convex/react')
  const generated = await import('../../convex/_generated/api')
  convexApi = generated.api
  useQueryHook = convexReact.useQuery
} catch {
  // Convex not configured yet - local-only mode
}

const CONVEX_ENABLED = !!convexApi && !!import.meta.env.VITE_CONVEX_URL

export function useConvexSync() {
  const user = useAuthStore((s) => s.user)
  const userId = user?.id || ''

  // If Convex is not configured, do nothing - stores work locally
  if (!CONVEX_ENABLED || !useQueryHook) return

  /* eslint-disable react-hooks/rules-of-hooks */
  const tasks = useQueryHook(convexApi.tasks.queries.list, userId ? { userId } : 'skip')
  const agents = useQueryHook(convexApi.agents.queries.list, userId ? { userId } : 'skip')
  const events = useQueryHook(convexApi.activity.queries.list, userId ? { userId } : 'skip')
  const jobs = useQueryHook(convexApi.jobs.queries.list, userId ? { userId } : 'skip')
  const memories = useQueryHook(convexApi.memory.queries.list, userId ? { userId } : 'skip')

  useEffect(() => {
    if (tasks) useTaskStore.setState({ tasks: tasks.map((t: any) => ({ ...t, id: t._id, createdAt: t._creationTime, updatedAt: t.updatedAt })) })
  }, [tasks])

  useEffect(() => {
    if (agents) useAgentStore.setState({ agents: agents.map((a: any) => ({ ...a, id: a._id, createdAt: a._creationTime, updatedAt: a.updatedAt })) })
  }, [agents])

  useEffect(() => {
    if (events) useActivityStore.setState({ events: events.map((e: any) => ({ ...e, id: e._id, timestamp: e._creationTime })) })
  }, [events])

  useEffect(() => {
    if (jobs) useJobStore.setState({ jobs: jobs.map((j: any) => ({ ...j, id: j._id, createdAt: j._creationTime, updatedAt: j.updatedAt })) })
  }, [jobs])

  useEffect(() => {
    if (memories) useMemoryStore.setState({ entries: memories.map((m: any) => ({ ...m, id: m._id, createdAt: m._creationTime, updatedAt: m.updatedAt })) })
  }, [memories])
  /* eslint-enable react-hooks/rules-of-hooks */
}
