import { ConvexReactClient } from "convex/react"

const convexUrl = import.meta.env.VITE_CONVEX_URL
if (!convexUrl) {
  console.warn("VITE_CONVEX_URL not set - real-time features will not work")
}

export const convex = new ConvexReactClient(convexUrl || "https://placeholder.convex.cloud")
