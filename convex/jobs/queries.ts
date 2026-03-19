import { query } from "../_generated/server"
import { v } from "convex/values"

export const list = query({
  args: { userId: v.string(), orgId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.orgId) {
      return await ctx.db
        .query("scheduled_jobs")
        .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId!))
        .collect()
    }
    return await ctx.db
      .query("scheduled_jobs")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect()
  },
})
