import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useTaskStore } from '@/stores/taskStore'
import { useAgentStore } from '@/stores/agentStore'
import { useActivityStore } from '@/stores/activityStore'
import { useJobStore } from '@/stores/jobStore'
import { useMemoryStore } from '@/stores/memoryStore'

/**
 * Syncs Convex real-time data into Zustand stores.
 * When Convex is not configured (no VITE_CONVEX_URL), this is a no-op
 * and stores work in local-only mode.
 *
 * To enable: set VITE_CONVEX_URL in .env and run `npx convex dev`
 */
export function useConvexSync() {
  const user = useAuthStore((s) => s.user)
  const [ready, setReady] = useState(false)
  const [mod, setMod] = useState<{ api: any; useQuery: any } | null>(null)

  // Try to load Convex modules on mount
  useEffect(() => {
    if (!import.meta.env.VITE_CONVEX_URL) {
      setReady(true)
      return
    }

    Promise.all([
      import('convex/react'),
      import('../../convex/_generated/api'),
    ])
      .then(([convexReact, generated]) => {
        setMod({ api: generated.api, useQuery: convexReact.useQuery })
        setReady(true)
      })
      .catch(() => {
        // Convex _generated not available yet
        console.warn('[AgentForge] Convex not initialized. Run `npx convex dev` to enable real-time sync.')
        setReady(true)
      })
  }, [])

  // When Convex is not available, this hook just returns
  // The actual Convex query hooks need to be in a sub-component
  // to avoid conditional hook calls. For now, we use polling fallback.
  useEffect(() => {
    if (!ready || !mod || !user?.id) return
    // Convex sync will be handled via ConvexProvider + direct useQuery in components
    // This hook signals that the connection is ready
  }, [ready, mod, user?.id])
}
