import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  tasks: defineTable({
    userId: v.string(),
    title: v.string(),
    description: v.string(),
    status: v.union(
      v.literal("planning"),
      v.literal("inbox"),
      v.literal("assigned"),
      v.literal("in_progress"),
      v.literal("testing"),
      v.literal("review"),
      v.literal("done")
    ),
    priority: v.union(
      v.literal("critical"),
      v.literal("high"),
      v.literal("medium"),
      v.literal("low")
    ),
    position: v.number(),
    assignedAgentId: v.optional(v.id("agents")),
    labels: v.array(v.string()),
    dueDate: v.optional(v.number()),
    parentTaskId: v.optional(v.id("tasks")),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_status_position", ["status", "position"])
    .index("by_userId", ["userId"])
    .index("by_userId_status", ["userId", "status"]),

  agents: defineTable({
    userId: v.string(),
    name: v.string(),
    description: v.string(),
    status: v.union(
      v.literal("idle"),
      v.literal("running"),
      v.literal("paused"),
      v.literal("stopped"),
      v.literal("error")
    ),
    provider: v.union(
      v.literal("openai"),
      v.literal("anthropic"),
      v.literal("google"),
      v.literal("local"),
      v.literal("custom")
    ),
    model: v.string(),
    config: v.object({
      temperature: v.optional(v.number()),
      maxTokens: v.optional(v.number()),
      systemPrompt: v.optional(v.string()),
    }),
    enabledSkills: v.array(v.string()),
    lastActiveAt: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_userId", ["userId"])
    .index("by_userId_status", ["userId", "status"]),

  activity_events: defineTable({
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
  })
    .index("by_type", ["type"])
    .index("by_userId", ["userId"])
    .index("by_userId_type", ["userId", "type"]),

  scheduled_jobs: defineTable({
    userId: v.string(),
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
    lastRunAt: v.optional(v.number()),
    nextRunAt: v.number(),
    status: v.union(
      v.literal("scheduled"),
      v.literal("running"),
      v.literal("paused"),
      v.literal("failed")
    ),
    errorMessage: v.optional(v.string()),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_enabled_next_run", ["enabled", "nextRunAt"])
    .index("by_userId", ["userId"]),

  memory_entries: defineTable({
    userId: v.string(),
    agentId: v.id("agents"),
    sessionId: v.string(),
    type: v.union(
      v.literal("conversation"),
      v.literal("fact"),
      v.literal("preference"),
      v.literal("context"),
      v.literal("tool_result")
    ),
    content: v.string(),
    metadata: v.optional(v.any()),
    expiresAt: v.optional(v.number()),
    updatedAt: v.number(),
  })
    .index("by_agent", ["agentId"])
    .index("by_agent_session", ["agentId", "sessionId"])
    .index("by_userId", ["userId"])
    .index("by_userId_agent", ["userId", "agentId"]),

  skills: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    version: v.string(),
    author: v.string(),
    category: v.union(
      v.literal("research"),
      v.literal("coding"),
      v.literal("communication"),
      v.literal("data"),
      v.literal("utility"),
      v.literal("custom")
    ),
    configSchema: v.optional(v.any()),
    isBuiltIn: v.boolean(),
    iconUrl: v.optional(v.string()),
  })
    .index("by_slug", ["slug"])
    .index("by_category", ["category"]),

  installed_skills: defineTable({
    userId: v.string(),
    skillId: v.id("skills"),
    config: v.optional(v.any()),
  })
    .index("by_skill", ["skillId"])
    .index("by_userId", ["userId"])
    .index("by_userId_skill", ["userId", "skillId"]),
})
