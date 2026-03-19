import { mutation } from "../_generated/server"
import { v } from "convex/values"

export const install = mutation({
  args: {
    userId: v.string(),
    orgId: v.optional(v.string()),
    skillId: v.id("skills"),
    config: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Check if already installed for this user
    const existing = await ctx.db
      .query("installed_skills")
      .withIndex("by_userId_skill", (q) =>
        q.eq("userId", args.userId).eq("skillId", args.skillId)
      )
      .first()
    if (existing) {
      throw new Error("Skill is already installed")
    }
    return await ctx.db.insert("installed_skills", {
      userId: args.userId,
      orgId: args.orgId,
      skillId: args.skillId,
      config: args.config,
    })
  },
})

export const uninstall = mutation({
  args: {
    userId: v.string(),
    id: v.id("installed_skills"),
  },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id)
    if (!doc || doc.userId !== args.userId) {
      throw new Error("Not found or unauthorized")
    }
    await ctx.db.delete(args.id)
  },
})
