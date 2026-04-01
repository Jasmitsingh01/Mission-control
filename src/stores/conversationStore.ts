/**
 * ConversationStore — Unified view of all agent conversations.
 *
 * Aggregates data from executionStore, activityStore, agentStore, taskStore.
 * Properly parses agent names from execution titles like "[Agent Name] task title".
 */

import { create } from 'zustand'
import { useExecutionStore, type StreamEvent, type Execution, type ArtifactInfo } from './executionStore'
import { useActivityStore, type ActivityEvent } from './activityStore'
import { useAgentStore } from './agentStore'
import { useTaskStore } from './taskStore'

// ─── Public types ───

export type MessageRole = 'user' | 'agent' | 'system' | 'tool' | 'error' | 'artifact'
export type FeedEventKind = 'started' | 'completed' | 'failed' | 'running' | 'tool' | 'text' | 'artifact' | 'status' | 'activity'

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
  missionName: string
  status: Execution['status']
  messages: ConversationMessage[]
  artifacts: ArtifactInfo[]
  startedAt: number
  lastActivityAt: number
}

export interface UnifiedFeedItem {
  id: string
  type: 'execution_event' | 'activity_event'
  kind: FeedEventKind
  timestamp: number
  executionId?: string
  agentName?: string
  missionName?: string
  taskTitle?: string
  role?: MessageRole
  content?: string
  toolName?: string
  streaming?: boolean
  execStatus?: Execution['status']
  activityEvent?: ActivityEvent
}

interface ConversationState {
  getConversations: () => Conversation[]
  getConversation: (executionId: string) => Conversation | null
  getUnifiedFeed: (limit?: number) => UnifiedFeedItem[]
  getAgentFeed: (agentId: string, limit?: number) => UnifiedFeedItem[]
}

// ─── Helpers ───

/** Parse "[Agent Name] mission title" → { agentName, missionName } */
function parseExecTitle(taskTitle: string): { agentName: string; missionName: string } {
  const match = taskTitle.match(/^\[(.+?)\]\s*(.*)$/)
  if (match) {
    return { agentName: match[1].trim(), missionName: match[2].trim() || taskTitle }
  }
  // Try "AgentName — task" format
  const dashMatch = taskTitle.match(/^(.+?)\s*[—–-]\s*(.+)$/)
  if (dashMatch && dashMatch[1].length < 30) {
    return { agentName: dashMatch[1].trim(), missionName: dashMatch[2].trim() }
  }
  return { agentName: '', missionName: taskTitle }
}

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
    case 'complete': return 'agent'
    default: return 'system'
  }
}

function streamEventToKind(type: StreamEvent['type']): FeedEventKind {
  switch (type) {
    case 'text': return 'text'
    case 'tool_use': return 'tool'
    case 'tool_result': return 'tool'
    case 'error': return 'failed'
    case 'complete': return 'completed'
    case 'status': return 'status'
    case 'artifact': return 'artifact'
    default: return 'status'
  }
}

function streamEventToMessage(ev: StreamEvent, exec: Execution): ConversationMessage {
  let content = ev.content
  if (ev.type === 'tool_use') content = `Tool call: ${ev.toolName || 'unknown'}`
  if (ev.type === 'tool_result') content = ev.content?.slice(0, 500) || '(empty result)'
  if (ev.type === 'status') content = `Status: ${ev.content}`
  if (ev.type === 'complete') content = ev.content || 'Completed'
  if (ev.type === 'artifact') {
    try { const p = JSON.parse(ev.content); content = `File: ${p.name || p.path || 'unknown'}` } catch { content = ev.content?.slice(0, 100) || '' }
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

// ─── Store ───

export const useConversationStore = create<ConversationState>()((set, get) => ({

  getConversations: () => {
    const { executions, streamEvents, artifacts: artifactMap } = useExecutionStore.getState()
    const agents = useAgentStore.getState().agents
    const tasks = useTaskStore.getState().tasks

    return executions.map((exec): Conversation => {
      const events = streamEvents.get(exec.id) || []
      const artifacts = artifactMap.get(exec.id) || []
      const { agentName: parsedAgent, missionName } = parseExecTitle(exec.taskTitle)

      // Resolve agent name: parsed from title > linked task > store agent > fallback
      const linkedTask = tasks.find(t => t.executionId === exec.id)
      const agentId = linkedTask?.assignee || linkedTask?.assignedAgentId || undefined
      const storeAgent = agentId ? agents.find(a => a.id === agentId) : undefined
      const agentName = parsedAgent || storeAgent?.name || 'Agent'

      const messages: ConversationMessage[] = events.map(ev => ({
        ...streamEventToMessage(ev, exec),
        agentName,
        agentId,
      }))

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
        missionName,
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

  getUnifiedFeed: (limit = 200) => {
    const { executions, streamEvents } = useExecutionStore.getState()
    const { events: activityEvents } = useActivityStore.getState()
    const agents = useAgentStore.getState().agents
    const tasks = useTaskStore.getState().tasks

    const items: UnifiedFeedItem[] = []

    for (const exec of executions) {
      const events = streamEvents.get(exec.id) || []
      const { agentName: parsedAgent, missionName } = parseExecTitle(exec.taskTitle)
      const linkedTask = tasks.find(t => t.executionId === exec.id)
      const agentId = linkedTask?.assignee || linkedTask?.assignedAgentId
      const storeAgent = agentId ? agents.find(a => a.id === agentId) : undefined
      const agentName = parsedAgent || storeAgent?.name || exec.taskTitle

      // If we have live stream events, use them
      if (events.length > 0) {
        for (const ev of events) {
          if (ev.type === 'text' && events.some(e => e.type === 'complete')) continue
          items.push({
            id: `exec-${ev.executionId}-${ev.timestamp}`,
            type: 'execution_event',
            kind: streamEventToKind(ev.type),
            timestamp: ev.timestamp,
            executionId: ev.executionId,
            agentName,
            missionName,
            taskTitle: exec.taskTitle,
            role: streamEventToRole(ev.type),
            execStatus: exec.status,
            content: ev.type === 'tool_use' ? `Tool: ${ev.toolName}`
              : ev.type === 'complete' ? `${ev.content?.slice(0, 120) || 'done'}`
              : ev.type === 'status' ? ev.content
              : ev.type === 'error' ? ev.content?.slice(0, 120)
              : ev.content?.slice(0, 150) || '',
            toolName: ev.toolName,
          })
        }
      } else {
        // No stream events — create synthetic feed items from execution metadata
        // "Started" event
        items.push({
          id: `exec-start-${exec.id}`,
          type: 'execution_event',
          kind: 'started',
          timestamp: exec.startedAt || exec.createdAt,
          executionId: exec.id,
          agentName,
          missionName,
          taskTitle: exec.taskTitle,
          role: 'system',
          execStatus: exec.status,
          content: `Execution started: ${exec.taskTitle}`,
        })

        // "Completed" or "Failed" event
        if (exec.status === 'completed') {
          items.push({
            id: `exec-done-${exec.id}`,
            type: 'execution_event',
            kind: 'completed',
            timestamp: exec.completedAt || Date.now(),
            executionId: exec.id,
            agentName,
            missionName,
            taskTitle: exec.taskTitle,
            role: 'agent',
            execStatus: 'completed',
            content: exec.result?.slice(0, 140) || 'Completed successfully',
          })
        } else if (exec.status === 'failed') {
          items.push({
            id: `exec-fail-${exec.id}`,
            type: 'execution_event',
            kind: 'failed',
            timestamp: exec.completedAt || Date.now(),
            executionId: exec.id,
            agentName,
            missionName,
            taskTitle: exec.taskTitle,
            role: 'error',
            execStatus: 'failed',
            content: exec.error?.slice(0, 140) || 'Failed',
          })
        }
      }
    }

    // Add activity events
    for (const ev of activityEvents) {
      items.push({
        id: `activity-${ev.id}`,
        type: 'activity_event',
        kind: 'activity',
        timestamp: ev.timestamp,
        role: ev.severity === 'error' ? 'error' : ev.type.startsWith('agent_') ? 'agent' : 'system',
        content: ev.message,
        agentName: ev.actorId || undefined,
        activityEvent: ev,
      })
    }

    items.sort((a, b) => b.timestamp - a.timestamp)
    return items.slice(0, limit)
  },

  getAgentFeed: (agentId, limit = 50) => {
    return get().getUnifiedFeed(500).filter(item => {
      if (item.activityEvent?.actorId === agentId || item.activityEvent?.relatedAgentId === agentId) return true
      if (item.executionId) {
        const tasks = useTaskStore.getState().tasks
        const t = tasks.find(t => t.executionId === item.executionId)
        if (t?.assignee === agentId || t?.assignedAgentId === agentId) return true
      }
      return false
    }).slice(0, limit)
  },
}))
