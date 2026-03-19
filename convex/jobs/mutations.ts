import { mutation } from "../_generated/server"
import { v } from "convex/values"
import { verifyOrgAccess } from "../lib/helpers"

const priorityValidator = v.union(
  v.literal("critical"),
  v.literal("high"),
  v.literal("medium"),
  v.literal("low")
)

const jobStatusValidator = v.union(
  v.literal("scheduled"),
  v.literal("running"),
  v.literal("paused"),
  v.literal("failed")
)

export const add = mutation({
  args: {
    userId: v.string(),
    orgId: v.string(),
    name: v.string(),
    description: v.string(),
    cronExpression: v.string(),
    taskTemplate: v.any(),
    targetAgentId: v.optional(v.id("agents")),
    priority: priorityValidator,
    enabled: v.boolean(),
    nextRunAt: v.number(),
    status: jobStatusValidator,
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    return await ctx.db.insert("scheduled_jobs", {
      ...args,
      updatedAt: now,
    })
  },
})

export const update = mutation({
  args: {
    userId: v.string(),
    orgId: v.string(),
    id: v.id("scheduled_jobs"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    cronExpression: v.optional(v.string()),
    taskTemplate: v.optional(v.any()),
    targetAgentId: v.optional(v.id("agents")),
    priority: v.optional(priorityValidator),
    enabled: v.optional(v.boolean()),
    nextRunAt: v.optional(v.number()),
    status: v.optional(jobStatusValidator),
    lastRunAt: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await verifyOrgAccess(ctx.db, args.id, args.orgId)
    const { userId, orgId, id, ...fields } = args
    const updates: Record<string, any> = { updatedAt: Date.now() }
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) {
        updates[key] = value
      }
    }
    await ctx.db.patch(id, updates)
  },
})

export const remove = mutation({
  args: {
    userId: v.string(),
    orgId: v.string(),
    id: v.id("scheduled_jobs"),
  },
  handler: async (ctx, args) => {
    await verifyOrgAccess(ctx.db, args.id, args.orgId)
    await ctx.db.delete(args.id)
  },
})

export const toggle = mutation({
  args: {
    userId: v.string(),
    orgId: v.string(),
    id: v.id("scheduled_jobs"),
  },
  handler: async (ctx, args) => {
    const doc = await verifyOrgAccess(ctx.db, args.id, args.orgId)
    const wasEnabled = (doc as any).enabled as boolean
    const enabled = !wasEnabled
    const status: "scheduled" | "paused" = enabled ? "scheduled" : "paused"
    await ctx.db.patch(args.id, {
      enabled,
      status,
      updatedAt: Date.now(),
    })
  },
})
