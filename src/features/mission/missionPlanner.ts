import { chatCompletion } from '@/lib/openrouter'
import type { TaskStatus, Priority } from '@/lib/constants'
import type { Provider } from '@/stores/agentStore'

export interface PlannedAgent {
  name: string
  description: string
  role: string
  provider: Provider
  model: string
  temperature: number
  maxTokens: number
  systemPrompt: string
  skills: string[]
}

export interface PlannedTask {
  title: string
  description: string
  priority: Priority
  status: TaskStatus
  labels: string[]
  assignedAgentRole: string
  order: number
}

export interface MissionPlan {
  missionName: string
  summary: string
  agents: PlannedAgent[]
  tasks: PlannedTask[]
  estimatedPhases: string[]
}

const SYSTEM_PROMPT = `You are Mission Control AI — an expert project planner that breaks down project descriptions into executable plans with AI agent teams and task breakdowns.

When given a project description, you MUST respond with ONLY a valid JSON object (no markdown, no code fences, no explanation) matching this exact schema:

{
  "summary": "1-2 sentence summary of the plan",
  "estimatedPhases": ["Phase 1 name", "Phase 2 name", ...],
  "agents": [
    {
      "name": "Agent display name",
      "description": "What this agent does",
      "role": "unique_role_id (lowercase_snake_case)",
      "provider": "anthropic" | "openai" | "google" | "local" | "custom",
      "model": "model-id (e.g. claude-sonnet-4-20250514, gpt-4o, gemini-2.5-pro)",
      "temperature": 0.0-1.0,
      "maxTokens": 1024-16384,
      "systemPrompt": "System instructions for this agent",
      "skills": ["skill-slug-1", "skill-slug-2"]
    }
  ],
  "tasks": [
    {
      "title": "Short task title",
      "description": "Detailed description of what needs to be done",
      "priority": "critical" | "high" | "medium" | "low",
      "status": "planning" | "inbox" | "assigned" | "in_progress",
      "labels": ["label1", "label2"],
      "assignedAgentRole": "role_id matching an agent's role field",
      "order": 0
    }
  ]
}

RULES:
- Create 2-8 agents depending on project complexity. Each agent should have a distinct role.
- Create 5-20 tasks, ordered logically (planning first, then setup, implementation, testing, deployment).
- Tasks MUST reference an agent role that exists in the agents array.
- Use realistic model names: claude-sonnet-4-20250514, claude-opus-4-20250514, claude-haiku-4-5-20251001, gpt-4o, gpt-4o-mini, gemini-2.5-pro, gemini-2.0-flash
- Available skills: web-search, code-analysis, git-operations, test-runner, doc-generator, database-query, csv-json-parser, slack-integration, email-sender, image-analysis, cron-scheduler, api-client
- Set appropriate temperatures: low (0.1-0.3) for coding/testing, medium (0.4-0.6) for planning, higher (0.7) for research/creative
- Task statuses should vary: early tasks as "planning"/"inbox", middle tasks as "assigned", later tasks as "inbox"
- Be specific in task descriptions — they should be actionable
- Respond with ONLY the JSON, nothing else`

function extractJSON(text: string): string {
  // Try to find JSON in the response (handle markdown fences)
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenceMatch) return fenceMatch[1].trim()

  // Try to find raw JSON object
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (jsonMatch) return jsonMatch[0]

  return text.trim()
}

export async function generateMissionPlan(
  description: string,
  missionName: string,
): Promise<MissionPlan> {
  const userMessage = `Project Name: "${missionName}"

Project Description:
${description}

Generate a complete mission plan with the optimal AI agent team and task breakdown.`

  const rawResponse = await chatCompletion(SYSTEM_PROMPT, userMessage)

  const jsonStr = extractJSON(rawResponse)

  let parsed: {
    summary: string
    estimatedPhases: string[]
    agents: PlannedAgent[]
    tasks: PlannedTask[]
  }

  try {
    parsed = JSON.parse(jsonStr)
  } catch {
    throw new Error('Failed to parse AI response as JSON. Please try again.')
  }

  // Validate and sanitize
  if (!parsed.agents || !Array.isArray(parsed.agents) || parsed.agents.length === 0) {
    throw new Error('AI did not generate any agents. Please try again with more detail.')
  }
  if (!parsed.tasks || !Array.isArray(parsed.tasks) || parsed.tasks.length === 0) {
    throw new Error('AI did not generate any tasks. Please try again with more detail.')
  }

  const validProviders = ['openai', 'anthropic', 'google', 'local', 'custom']
  const validStatuses = ['planning', 'inbox', 'assigned', 'in_progress', 'testing', 'review', 'done']
  const validPriorities = ['critical', 'high', 'medium', 'low']

  // Sanitize agents
  const agents: PlannedAgent[] = parsed.agents.map((a, i) => ({
    name: a.name || `Agent ${i + 1}`,
    description: a.description || '',
    role: a.role || `agent_role_${i}`,
    provider: (validProviders.includes(a.provider) ? a.provider : 'anthropic') as Provider,
    model: a.model || 'claude-sonnet-4-20250514',
    temperature: typeof a.temperature === 'number' ? Math.min(1, Math.max(0, a.temperature)) : 0.4,
    maxTokens: typeof a.maxTokens === 'number' ? Math.min(16384, Math.max(1024, a.maxTokens)) : 4096,
    systemPrompt: a.systemPrompt || `You are the ${a.name} for the project "${missionName}".`,
    skills: Array.isArray(a.skills) ? a.skills : [],
  }))

  const agentRoles = new Set(agents.map((a) => a.role))

  // Sanitize tasks
  const tasks: PlannedTask[] = parsed.tasks.map((t, i) => ({
    title: t.title || `Task ${i + 1}`,
    description: t.description || '',
    priority: (validPriorities.includes(t.priority) ? t.priority : 'medium') as Priority,
    status: (validStatuses.includes(t.status) ? t.status : 'inbox') as TaskStatus,
    labels: Array.isArray(t.labels) ? t.labels : [],
    assignedAgentRole: agentRoles.has(t.assignedAgentRole) ? t.assignedAgentRole : agents[0].role,
    order: typeof t.order === 'number' ? t.order : i,
  }))

  return {
    missionName,
    summary: parsed.summary || `Generated ${agents.length} agents and ${tasks.length} tasks.`,
    agents,
    tasks,
    estimatedPhases: Array.isArray(parsed.estimatedPhases) && parsed.estimatedPhases.length > 0
      ? parsed.estimatedPhases
      : ['Planning', 'Implementation', 'Testing', 'Deployment'],
  }
}
