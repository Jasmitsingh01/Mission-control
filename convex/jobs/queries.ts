import { query } from "../_generated/server"
import { v } from "convex/values"

export const list = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("scheduled_jobs")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect()
  },
})
