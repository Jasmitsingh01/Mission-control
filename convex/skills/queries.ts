import { query } from "../_generated/server"
import { v } from "convex/values"

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("skills").collect()
  },
})

export const listInstalled = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("installed_skills")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect()
  },
})
