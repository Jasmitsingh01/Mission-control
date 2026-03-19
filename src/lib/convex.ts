import { ConvexReactClient } from "convex/react"

const convexUrl = import.meta.env.VITE_CONVEX_URL

if (!convexUrl) {
  console.warn("[AgentForge] VITE_CONVEX_URL not set — running in local-only mode. Real-time sync disabled.")
}

// Create client even with placeholder URL — ConvexProvider requires it
// When URL is empty, the sync hooks will detect this and skip all queries
export const convex = new ConvexReactClient(convexUrl || "https://inert-placeholder-000.convex.cloud")
