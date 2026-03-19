import { mutation } from "../_generated/server"
import { v } from "convex/values"
import { verifyOrgAccess } from "../lib/helpers"

export const add = mutation({
  args: {
    userId: v.string(),
    orgId: v.string(),
    name: v.string(),
    description: v.string(),
    cronExpression: v.string(),
    taskTemplate: v.any(),
    targetAgentId: v.optional(v.id("agents")),
    priority: v.union(
      v.literal("critical"),
      v.literal("high"),
      v.literal("medium"),
      v.literal("low")
    ),
    enabled: v.boolean(),
    nextRunAt: v.number(),
    status: v.union(
      v.literal("scheduled"),
      v.literal("running"),
      v.literal("paused"),
      v.literal("failed")
    ),
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
    priority: v.optional(
      v.union(
        v.literal("critical"),
        v.literal("high"),
        v.literal("medium"),
        v.literal("low")
      )
    ),
    enabled: v.optional(v.boolean()),
    nextRunAt: v.optional(v.number()),
    status: v.optional(
      v.union(
        v.literal("scheduled"),
        v.literal("running"),
        v.literal("paused"),
        v.literal("failed")
      )
    ),
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
    const enabled = !(doc as any).enabled
    await ctx.db.patch(args.id, {
      enabled,
      status: enabled ? "scheduled" : "paused",
      updatedAt: Date.now(),
    } as any)
  },
})
