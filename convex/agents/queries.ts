import { query } from "../_generated/server"
import { v } from "convex/values"

export const list = query({
  args: { userId: v.string(), orgId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.orgId) {
      return await ctx.db
        .query("agents")
        .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId!))
        .collect()
    }
    return await ctx.db
      .query("agents")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect()
  },
})

export const getByStatus = query({
  args: { userId: v.string(), orgId: v.optional(v.string()), status: v.string() },
  handler: async (ctx, args) => {
    if (args.orgId) {
      return await ctx.db
        .query("agents")
        .withIndex("by_orgId_status", (q) =>
          q.eq("orgId", args.orgId!).eq("status", args.status as any)
        )
        .collect()
    }
    return await ctx.db
      .query("agents")
      .withIndex("by_userId_status", (q) =>
        q.eq("userId", args.userId).eq("status", args.status as any)
      )
      .collect()
  },
})
