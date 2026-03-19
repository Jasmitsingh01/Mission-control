import { query } from "../_generated/server"
import { v } from "convex/values"

const taskStatusValidator = v.union(
  v.literal("planning"),
  v.literal("inbox"),
  v.literal("assigned"),
  v.literal("in_progress"),
  v.literal("testing"),
  v.literal("review"),
  v.literal("done")
)

// List tasks for an organization (all members can see)
export const list = query({
  args: { userId: v.string(), orgId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.orgId) {
      return await ctx.db
        .query("tasks")
        .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId!))
        .collect()
    }
    return await ctx.db
      .query("tasks")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect()
  },
})

// List tasks by status within an org
export const getByStatus = query({
  args: { userId: v.string(), orgId: v.optional(v.string()), status: taskStatusValidator },
  handler: async (ctx, args) => {
    if (args.orgId) {
      return await ctx.db
        .query("tasks")
        .withIndex("by_orgId_status", (q) =>
          q.eq("orgId", args.orgId!).eq("status", args.status)
        )
        .collect()
    }
    return await ctx.db
      .query("tasks")
      .withIndex("by_userId_status", (q) =>
        q.eq("userId", args.userId).eq("status", args.status)
      )
      .collect()
  },
})

// List tasks assigned to a specific user in an org
export const getByAssignee = query({
  args: { orgId: v.string(), assignedUserId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_orgId_assignedUserId", (q) =>
        q.eq("orgId", args.orgId).eq("assignedUserId", args.assignedUserId)
      )
      .collect()
  },
})
