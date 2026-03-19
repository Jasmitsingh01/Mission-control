import { query } from "../_generated/server"
import { v } from "convex/values"

export const list = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("activity_events")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(100)
  },
})

export const getByType = query({
  args: { userId: v.string(), type: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("activity_events")
      .withIndex("by_userId_type", (q) =>
        q.eq("userId", args.userId).eq("type", args.type as any)
      )
      .order("desc")
      .take(100)
  },
})
