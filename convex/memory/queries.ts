import { query } from "../_generated/server"
import { v } from "convex/values"

export const list = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("memory_entries")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect()
  },
})

export const getByAgent = query({
  args: { userId: v.string(), agentId: v.id("agents") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("memory_entries")
      .withIndex("by_userId_agent", (q) =>
        q.eq("userId", args.userId).eq("agentId", args.agentId)
      )
      .collect()
  },
})
