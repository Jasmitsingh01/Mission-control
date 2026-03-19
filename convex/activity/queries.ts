import { query } from "../_generated/server"
import { v } from "convex/values"

const activityTypeValidator = v.union(
  v.literal("task_created"),
  v.literal("task_moved"),
  v.literal("task_updated"),
  v.literal("agent_spawned"),
  v.literal("agent_stopped"),
  v.literal("agent_error"),
  v.literal("job_started"),
  v.literal("job_completed"),
  v.literal("job_failed"),
  v.literal("skill_triggered"),
  v.literal("memory_written"),
  v.literal("system"),
  v.literal("member_joined"),
  v.literal("member_removed"),
  v.literal("org_updated")
)

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
  args: { userId: v.string(), orgId: v.optional(v.string()), type: activityTypeValidator },
  handler: async (ctx, args) => {
    if (args.orgId) {
      return await ctx.db
        .query("activity_events")
        .withIndex("by_orgId_type", (q) =>
          q.eq("orgId", args.orgId!).eq("type", args.type)
        )
        .order("desc")
        .take(100)
    }
    return await ctx.db
      .query("activity_events")
      .withIndex("by_userId_type", (q) =>
        q.eq("userId", args.userId).eq("type", args.type)
      )
      .order("desc")
      .take(100)
  },
})
