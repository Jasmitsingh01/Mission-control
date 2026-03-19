import { mutation } from "../_generated/server"
import { v } from "convex/values"
import { verifyOrgAccess } from "../lib/helpers"

const memoryTypeValidator = v.union(
  v.literal("conversation"),
  v.literal("fact"),
  v.literal("preference"),
  v.literal("context"),
  v.literal("tool_result")
)

export const add = mutation({
  args: {
    userId: v.string(),
    orgId: v.string(),
    agentId: v.id("agents"),
    sessionId: v.string(),
    type: memoryTypeValidator,
    content: v.string(),
    metadata: v.optional(v.any()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    return await ctx.db.insert("memory_entries", {
      ...args,
      updatedAt: now,
    })
  },
})

export const update = mutation({
  args: {
    userId: v.string(),
    orgId: v.string(),
    id: v.id("memory_entries"),
    content: v.optional(v.string()),
    metadata: v.optional(v.any()),
    expiresAt: v.optional(v.number()),
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
    id: v.id("memory_entries"),
  },
  handler: async (ctx, args) => {
    await verifyOrgAccess(ctx.db, args.id, args.orgId)
    await ctx.db.delete(args.id)
  },
})
