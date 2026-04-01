/**
 * ConversationStore — Unified view of all agent conversations.
 *
 * Aggregates data from:
 *  - executionStore (stream events, artifacts, interactions)
 *  - activityStore (system events)
 *  - agentStore (agent metadata)
 *
 * Each "conversation" is an execution tied to an agent or task.
 * The store provides a flat, time-ordered feed and per-conversation threads.
 */

import { create } from 'zustand'
import { useExecutionStore, type StreamEvent, type Execution, type ArtifactInfo } from './executionStore'
import { useActivityStore, type ActivityEvent } from './activityStore'
import { useAgentStore } from './agentStore'
import { useTaskStore } from './taskStore'

// ─── Public types ───

export type MessageRole = 'user' | 'agent' | 'system' | 'tool' | 'error' | 'artifact'

export interface ConversationMessage {
  id: string
  role: MessageRole
  content: string
  timestamp: number
  toolName?: string
  streaming?: boolean
  executionId?: string
  agentName?: string
  agentId?: string
  taskTitle?: string
}

export interface Conversation {
  executionId: string
  agentName: string
  agentId?: string
  taskTitle: string
  status: Execution['status']
  messages: ConversationMessage[]
  artifacts: ArtifactInfo[]
  startedAt: number
  lastActivityAt: number
}

export interface UnifiedFeedItem {
  id: string
  type: 'execution_event' | 'activity_event'
  timestamp: number
  // Execution event data
  executionId?: string
  agentName?: string
  taskTitle?: string
  role?: MessageRole
  content?: string
  toolName?: string
  streaming?: boolean
  // Activity event data
  activityEvent?: ActivityEvent
}

interface ConversationState {
  /** Rebuild conversations from execution store data */
  getConversations: () => Conversation[]
  /** Get a single conversation by execution ID */
  getConversation: (executionId: string) => Conversation | null
  /** Get unified feed: real execution events + activity events, time-ordered */
  getUnifiedFeed: (limit?: number) => UnifiedFeedItem[]
  /** Get feed filtered by agent */
  getAgentFeed: (agentId: string, limit?: number) => UnifiedFeedItem[]
}

// ─── Helpers ───

function streamEventToRole(type: StreamEvent['type']): MessageRole {
  switch (type) {
    case 'text': return 'agent'
    case 'tool_use': return 'tool'
    case 'tool_result': return 'tool'
    case 'error': return 'error'
    case 'interaction_request': return 'system'
    case 'interaction_response': return 'user'
    case 'artifact': return 'artifact'
    case 'status': return 'system'
    case 'complete': return 'system'
    default: return 'system'
  }
}

function streamEventToMessage(ev: StreamEvent, exec: Execution): ConversationMessage {
  let content = ev.content
  if (ev.type === 'tool_use') content = `Tool call: ${ev.toolName || 'unknown'}`
  if (ev.type === 'tool_result') content = ev.content?.slice(0, 500) || '(empty result)'
  if (ev.type === 'status') content = `Status: ${ev.content}`
  if (ev.type === 'complete') content = `Completed: ${ev.content?.slice(0, 200) || 'done'}`
  if (ev.type === 'artifact') {
    try {
      const parsed = JSON.parse(ev.content)
      content = `File created: ${parsed.name || parsed.path || 'unknown'}`
    } catch {
      content = `Artifact: ${ev.content?.slice(0, 100)}`
    }
  }

  return {
    id: `${ev.executionId}-${ev.timestamp}-${Math.random().toString(36).slice(2, 6)}`,
    role: streamEventToRole(ev.type),
    content,
    timestamp: ev.timestamp,
    toolName: ev.toolName,
    executionId: ev.executionId,
    taskTitle: exec.taskTitle,
  }
}

function activityToRole(type: string): MessageRole {
  if (type.startsWith('agent_error') || type === 'job_failed') return 'error'
  if (type.startsWith('agent_')) return 'agent'
  if (type.startsWith('task_')) return 'system'
  return 'system'
}

// ─── Store ───

export const useConversationStore = create<ConversationState>()((set, get) => ({

  getConversations: () => {
    const { executions, streamEvents, artifacts: artifactMap } = useExecutionStore.getState()
    const agents = useAgentStore.getState().agents
    const tasks = useTaskStore.getState().tasks

    return executions.map((exec): Conversation => {
      const events = streamEvents.get(exec.id) || []
      const artifacts = artifactMap.get(exec.id) || []

      // Resolve agent name
      const linkedTask = tasks.find(t => t.executionId === exec.id)
      const agentId = linkedTask?.assignee || linkedTask?.assignedAgentId || undefined
      const agent = agentId ? agents.find(a => a.id === agentId) : undefined
      const agentName = agent?.name || exec.taskTitle.split(' ')[0] || 'Agent'

      // Build messages from stream events
      const messages: ConversationMessage[] = events.map(ev => ({
        ...streamEventToMessage(ev, exec),
        agentName,
        agentId,
      }))

      // Add prompt as first user message
      if (exec.prompt) {
        messages.unshift({
          id: `${exec.id}-prompt`,
          role: 'user',
          content: exec.prompt,
          timestamp: exec.createdAt,
          executionId: exec.id,
          agentName,
          agentId,
          taskTitle: exec.taskTitle,
        })
      }

      // Add result as final message if completed
      if (exec.status === 'completed' && exec.result && !events.some(e => e.type === 'complete')) {
        messages.push({
          id: `${exec.id}-result`,
          role: 'agent',
          content: exec.result,
          timestamp: exec.completedAt || Date.now(),
          executionId: exec.id,
          agentName,
          agentId,
          taskTitle: exec.taskTitle,
        })
      }

      messages.sort((a, b) => a.timestamp - b.timestamp)

      return {
        executionId: exec.id,
        agentName,
        agentId,
        taskTitle: exec.taskTitle,
        status: exec.status,
        messages,
        artifacts,
        startedAt: exec.startedAt || exec.createdAt,
        lastActivityAt: messages.length > 0 ? messages[messages.length - 1].timestamp : exec.createdAt,
      }
    }).sort((a, b) => b.lastActivityAt - a.lastActivityAt)
  },

  getConversation: (executionId) => {
    return get().getConversations().find(c => c.executionId === executionId) || null
  },

  getUnifiedFeed: (limit = 100) => {
    const { executions, streamEvents } = useExecutionStore.getState()
    const { events: activityEvents } = useActivityStore.getState()
    const agents = useAgentStore.getState().agents
    const tasks = useTaskStore.getState().tasks

    const items: UnifiedFeedItem[] = []

    // Add execution stream events
    for (const exec of executions) {
      const events = streamEvents.get(exec.id) || []
      const linkedTask = tasks.find(t => t.executionId === exec.id)
      const agentId = linkedTask?.assignee || linkedTask?.assignedAgentId
      const agent = agentId ? agents.find(a => a.id === agentId) : undefined

      for (const ev of events) {
        // Skip raw text deltas — too noisy for the feed
        if (ev.type === 'text' && events.some(e => e.type === 'complete')) continue

        items.push({
          id: `exec-${ev.executionId}-${ev.timestamp}`,
          type: 'execution_event',
          timestamp: ev.timestamp,
          executionId: ev.executionId,
          agentName: agent?.name || exec.taskTitle,
          taskTitle: exec.taskTitle,
          role: streamEventToRole(ev.type),
          content: ev.type === 'tool_use' ? `Tool: ${ev.toolName}` :
                   ev.type === 'complete' ? `Completed: ${ev.content?.slice(0, 120)}` :
                   ev.type === 'status' ? `Status: ${ev.content}` :
                   ev.type === 'error' ? `Error: ${ev.content?.slice(0, 120)}` :
                   ev.content?.slice(0, 150) || '',
          toolName: ev.toolName,
          streaming: false,
        })
      }

      // Add execution start/complete as events if no stream events
      if (events.length === 0) {
        items.push({
          id: `exec-start-${exec.id}`,
          type: 'execution_event',
          timestamp: exec.createdAt,
          executionId: exec.id,
          agentName: agent?.name || exec.taskTitle,
          taskTitle: exec.taskTitle,
          role: 'system',
          content: `Execution started: ${exec.taskTitle}`,
        })
        if (exec.status === 'completed' || exec.status === 'failed') {
          items.push({
            id: `exec-end-${exec.id}`,
            type: 'execution_event',
            timestamp: exec.completedAt || Date.now(),
            executionId: exec.id,
            agentName: agent?.name || exec.taskTitle,
            taskTitle: exec.taskTitle,
            role: exec.status === 'failed' ? 'error' : 'system',
            content: exec.status === 'completed'
              ? `Completed: ${exec.result?.slice(0, 120) || 'done'}`
              : `Failed: ${exec.error?.slice(0, 120) || 'unknown error'}`,
          })
        }
      }
    }

    // Add activity events
    for (const ev of activityEvents) {
      items.push({
        id: `activity-${ev.id}`,
        type: 'activity_event',
        timestamp: ev.timestamp,
        role: activityToRole(ev.type),
        content: ev.message,
        agentName: ev.actorId || undefined,
        activityEvent: ev,
      })
    }

    // Sort newest first, limit
    items.sort((a, b) => b.timestamp - a.timestamp)
    return items.slice(0, limit)
  },

  getAgentFeed: (agentId, limit = 50) => {
    return get().getUnifiedFeed(500).filter(item => {
      if (item.activityEvent?.actorId === agentId) return true
      if (item.activityEvent?.relatedAgentId === agentId) return true
      // Check if the execution is linked to this agent
      if (item.executionId) {
        const tasks = useTaskStore.getState().tasks
        const linkedTask = tasks.find(t => t.executionId === item.executionId)
        if (linkedTask?.assignee === agentId || linkedTask?.assignedAgentId === agentId) return true
      }
      return false
    }).slice(0, limit)
  },
}))
