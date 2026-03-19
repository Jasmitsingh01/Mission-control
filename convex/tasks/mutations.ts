import { mutation } from "../_generated/server"
import { v } from "convex/values"
import { verifyOrgAccess } from "../lib/helpers"

const taskStatusValidator = v.union(
  v.literal("planning"),
  v.literal("inbox"),
  v.literal("assigned"),
  v.literal("in_progress"),
  v.literal("testing"),
  v.literal("review"),
  v.literal("done")
)

const priorityValidator = v.union(
  v.literal("critical"),
  v.literal("high"),
  v.literal("medium"),
  v.literal("low")
)

export const add = mutation({
  args: {
    userId: v.string(),
    orgId: v.string(),
    title: v.string(),
    description: v.string(),
    status: taskStatusValidator,
    priority: priorityValidator,
    position: v.number(),
    assignedAgentId: v.optional(v.id("agents")),
    assignedUserId: v.optional(v.string()),
    labels: v.array(v.string()),
    dueDate: v.optional(v.number()),
    parentTaskId: v.optional(v.id("tasks")),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    return await ctx.db.insert("tasks", {
      ...args,
      updatedAt: now,
    })
  },
})

export const update = mutation({
  args: {
    userId: v.string(),
    orgId: v.string(),
    id: v.id("tasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(taskStatusValidator),
    priority: v.optional(priorityValidator),
    position: v.optional(v.number()),
    assignedAgentId: v.optional(v.id("agents")),
    assignedUserId: v.optional(v.string()),
    labels: v.optional(v.array(v.string())),
    dueDate: v.optional(v.number()),
    parentTaskId: v.optional(v.id("tasks")),
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
    id: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    await verifyOrgAccess(ctx.db, args.id, args.orgId)
    await ctx.db.delete(args.id)
  },
})

export const move = mutation({
  args: {
    userId: v.string(),
    orgId: v.string(),
    id: v.id("tasks"),
    status: taskStatusValidator,
    position: v.number(),
  },
  handler: async (ctx, args) => {
    await verifyOrgAccess(ctx.db, args.id, args.orgId)
    await ctx.db.patch(args.id, {
      status: args.status,
      position: args.position,
      updatedAt: Date.now(),
    })
  },
})

export const reorder = mutation({
  args: {
    userId: v.string(),
    orgId: v.string(),
    id: v.id("tasks"),
    position: v.number(),
  },
  handler: async (ctx, args) => {
    await verifyOrgAccess(ctx.db, args.id, args.orgId)
    await ctx.db.patch(args.id, {
      position: args.position,
      updatedAt: Date.now(),
    })
  },
})
