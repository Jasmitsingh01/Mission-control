import { mutation } from "../_generated/server"
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

const severityValidator = v.union(
  v.literal("info"),
  v.literal("warning"),
  v.literal("error"),
  v.literal("success")
)

const actorTypeValidator = v.union(
  v.literal("user"),
  v.literal("agent"),
  v.literal("system")
)

export const add = mutation({
  args: {
    userId: v.string(),
    orgId: v.string(),
    type: activityTypeValidator,
    severity: severityValidator,
    message: v.string(),
    metadata: v.optional(v.any()),
    actorType: actorTypeValidator,
    actorId: v.optional(v.string()),
    relatedTaskId: v.optional(v.id("tasks")),
    relatedAgentId: v.optional(v.id("agents")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("activity_events", args)
  },
})

export const clear = mutation({
  args: { userId: v.string(), orgId: v.string() },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("activity_events")
      .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
      .collect()
    for (const event of events) {
      await ctx.db.delete(event._id)
    }
  },
})
