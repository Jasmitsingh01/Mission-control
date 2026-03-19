import { query } from "../_generated/server"
import { v } from "convex/values"

export const list = query({
  args: { userId: v.string(), orgId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.orgId) {
      return await ctx.db
        .query("activity_events")
        .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId!))
        .order("desc")
        .take(100)
    }
    return await ctx.db
      .query("activity_events")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(100)
  },
})

export const getByType = query({
  args: { userId: v.string(), orgId: v.optional(v.string()), type: v.string() },
  handler: async (ctx, args) => {
    if (args.orgId) {
      return await ctx.db
        .query("activity_events")
        .withIndex("by_orgId_type", (q) =>
          q.eq("orgId", args.orgId!).eq("type", args.type as any)
        )
        .order("desc")
        .take(100)
    }
    return await ctx.db
      .query("activity_events")
      .withIndex("by_userId_type", (q) =>
        q.eq("userId", args.userId).eq("type", args.type as any)
      )
      .order("desc")
      .take(100)
  },
})
