import { mutation } from "../_generated/server"
import { v } from "convex/values"
import { verifyOrgAccess } from "../lib/helpers"

const agentStatusValidator = v.union(
  v.literal("idle"),
  v.literal("running"),
  v.literal("paused"),
  v.literal("stopped"),
  v.literal("error")
)

const providerValidator = v.union(
  v.literal("openai"),
  v.literal("anthropic"),
  v.literal("google"),
  v.literal("local"),
  v.literal("custom")
)

const configValidator = v.object({
  temperature: v.optional(v.number()),
  maxTokens: v.optional(v.number()),
  systemPrompt: v.optional(v.string()),
})

export const add = mutation({
  args: {
    userId: v.string(),
    orgId: v.string(),
    name: v.string(),
    description: v.string(),
    status: agentStatusValidator,
    provider: providerValidator,
    model: v.string(),
    config: configValidator,
    enabledSkills: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    return await ctx.db.insert("agents", {
      ...args,
      lastActiveAt: now,
      updatedAt: now,
    })
  },
})

export const update = mutation({
  args: {
    userId: v.string(),
    orgId: v.string(),
    id: v.id("agents"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    provider: v.optional(providerValidator),
    model: v.optional(v.string()),
    config: v.optional(configValidator),
    enabledSkills: v.optional(v.array(v.string())),
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
    id: v.id("agents"),
  },
  handler: async (ctx, args) => {
    await verifyOrgAccess(ctx.db, args.id, args.orgId)
    await ctx.db.delete(args.id)
  },
})

export const setStatus = mutation({
  args: {
    userId: v.string(),
    orgId: v.string(),
    id: v.id("agents"),
    status: agentStatusValidator,
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await verifyOrgAccess(ctx.db, args.id, args.orgId)
    const now = Date.now()
    const updates: Record<string, any> = {
      status: args.status,
      lastActiveAt: now,
      updatedAt: now,
    }
    if (args.errorMessage !== undefined) {
      updates.errorMessage = args.errorMessage
    }
    await ctx.db.patch(args.id, updates)
  },
})
