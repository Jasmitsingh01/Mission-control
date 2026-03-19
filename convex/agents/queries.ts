import { query } from "../_generated/server"
import { v } from "convex/values"

const agentStatusValidator = v.union(
  v.literal("idle"),
  v.literal("running"),
  v.literal("paused"),
  v.literal("stopped"),
  v.literal("error")
)

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
  args: { userId: v.string(), orgId: v.optional(v.string()), status: agentStatusValidator },
  handler: async (ctx, args) => {
    if (args.orgId) {
      return await ctx.db
        .query("agents")
        .withIndex("by_orgId_status", (q) =>
          q.eq("orgId", args.orgId!).eq("status", args.status)
        )
        .collect()
    }
    return await ctx.db
      .query("agents")
      .withIndex("by_userId_status", (q) =>
        q.eq("userId", args.userId).eq("status", args.status)
      )
      .collect()
  },
})
