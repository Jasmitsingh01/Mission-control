import { mutation } from "../_generated/server"
import { v } from "convex/values"

export const add = mutation({
  args: {
    userId: v.string(),
    type: v.union(
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
      v.literal("system")
    ),
    severity: v.union(
      v.literal("info"),
      v.literal("warning"),
      v.literal("error"),
      v.literal("success")
    ),
    message: v.string(),
    metadata: v.optional(v.any()),
    actorType: v.union(
      v.literal("user"),
      v.literal("agent"),
      v.literal("system")
    ),
    actorId: v.optional(v.string()),
    relatedTaskId: v.optional(v.id("tasks")),
    relatedAgentId: v.optional(v.id("agents")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("activity_events", args)
  },
})

export const clear = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("activity_events")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect()
    for (const event of events) {
      await ctx.db.delete(event._id)
    }
  },
})
