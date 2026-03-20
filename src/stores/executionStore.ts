import { create } from 'zustand'
import { executeApi } from '@/lib/api'

export interface StreamEvent {
  executionId: string
  type: 'text' | 'tool_use' | 'tool_result' | 'error' | 'status' | 'complete'
  content: string
  toolName?: string
  toolInput?: any
  timestamp: number
}

export interface Execution {
  id: string
  taskTitle: string
  prompt: string
  status: 'queued' | 'running' | 'completed' | 'failed' | 'aborted'
  result?: string
  error?: string
  model: string
  usage: {
    inputTokens: number
    outputTokens: number
    costUsd: number
    durationMs: number
    totalTurns: number
  }
  createdAt: number
  startedAt?: number
  completedAt?: number
}

interface ExecutionState {
  executions: Execution[]
  activeExecution: string | null
  streamOutput: Map<string, string>
  streamEvents: Map<string, StreamEvent[]>
  ws: WebSocket | null
  isConnected: boolean

  // Actions
  startExecution: (data: {
    taskTitle: string
    prompt: string
    model?: string
    allowedTools?: string[]
    workingDirectory?: string
    maxTurns?: number
    systemPrompt?: string
  }) => Promise<string>
  abortExecution: (id: string) => Promise<void>
  fetchExecutions: (page?: number) => Promise<void>
  fetchExecution: (id: string) => Promise<Execution | null>
  connectWebSocket: () => void
  disconnectWebSocket: () => void
  subscribeToExecution: (id: string) => void
  getStreamOutput: (id: string) => string
  getStreamEvents: (id: string) => StreamEvent[]
  clearStream: (id: string) => void
}

function getWsUrl(): string {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
  const base = apiUrl.replace('/api', '').replace('http', 'ws')
  return `${base}/ws/execute`
}

function mapExecution(e: any): Execution {
  return {
    id: e._id || e.id,
    taskTitle: e.taskTitle,
    prompt: e.prompt,
    status: e.status,
    result: e.result,
    error: e.error,
    model: e.model || 'claude-sonnet-4-6',
    usage: e.usage || { inputTokens: 0, outputTokens: 0, costUsd: 0, durationMs: 0, totalTurns: 0 },
    createdAt: e.createdAt ? new Date(e.createdAt).getTime() : Date.now(),
    startedAt: e.startedAt ? new Date(e.startedAt).getTime() : undefined,
    completedAt: e.completedAt ? new Date(e.completedAt).getTime() : undefined,
  }
}

export const useExecutionStore = create<ExecutionState>((set, get) => ({
  executions: [],
  activeExecution: null,
  streamOutput: new Map(),
  streamEvents: new Map(),
  ws: null,
  isConnected: false,

  startExecution: async (data) => {
    const resp = await executeApi.start(data)
    const id = resp.execution.id
    const execution = mapExecution(resp.execution)

    set((state) => ({
      executions: [execution, ...state.executions],
      activeExecution: id,
    }))

    // Auto-subscribe to stream
    get().subscribeToExecution(id)

    return id
  },

  abortExecution: async (id) => {
    await executeApi.abort(id)
    set((state) => ({
      executions: state.executions.map((e) =>
        e.id === id ? { ...e, status: 'aborted' as const } : e
      ),
    }))
  },

  fetchExecutions: async (page = 1) => {
    const data = await executeApi.list(page)
    const fresh = (data.executions || []).map(mapExecution)

    // Merge: API is the source of truth for status, but keep stream data
    set((state) => {
      const merged = fresh.map((apiExec: Execution) => {
        const storeExec = state.executions.find((e) => e.id === apiExec.id)
        // API status always wins over stale in-memory status
        if (storeExec) {
          return { ...storeExec, ...apiExec }
        }
        return apiExec
      })
      return { executions: merged }
    })
  },

  fetchExecution: async (id) => {
    try {
      const data = await executeApi.get(id)
      const execution = mapExecution(data.execution)
      set((state) => ({
        executions: state.executions.map((e) => (e.id === id ? execution : e)),
      }))
      return execution
    } catch {
      return null
    }
  },

  connectWebSocket: () => {
    const existing = get().ws
    if (existing && existing.readyState <= 1) return // Already connected/connecting

    const token = localStorage.getItem('mc_auth_token')
    const orgId = localStorage.getItem('mc_current_org_id')
    if (!token) return

    const url = `${getWsUrl()}?token=${token}${orgId ? `&orgId=${orgId}` : ''}`
    const ws = new WebSocket(url)

    ws.onopen = () => {
      set({ isConnected: true })
    }

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)

        // Handle stream events
        if (msg.executionId && msg.type) {
          const streamEvent = msg as StreamEvent

          set((state) => {
            const newOutput = new Map(state.streamOutput)
            const newEvents = new Map(state.streamEvents)

            // Append to output
            if (streamEvent.type === 'text' || streamEvent.type === 'tool_use' || streamEvent.type === 'tool_result') {
              const current = newOutput.get(streamEvent.executionId) || ''
              if (streamEvent.type === 'text') {
                newOutput.set(streamEvent.executionId, current + streamEvent.content)
              } else if (streamEvent.type === 'tool_use') {
                newOutput.set(streamEvent.executionId, current + `\n[Tool: ${streamEvent.toolName}]\n`)
              } else if (streamEvent.type === 'tool_result') {
                newOutput.set(streamEvent.executionId, current + `\n${streamEvent.content}\n`)
              }
            }

            // Append to events
            const events = newEvents.get(streamEvent.executionId) || []
            newEvents.set(streamEvent.executionId, [...events.slice(-200), streamEvent])

            // Update execution status
            let executions = state.executions
            if (streamEvent.type === 'status' || streamEvent.type === 'complete' || streamEvent.type === 'error') {
              executions = executions.map((e) => {
                if (e.id !== streamEvent.executionId) return e
                if (streamEvent.type === 'complete') {
                  return { ...e, status: 'completed' as const, result: streamEvent.content, completedAt: Date.now() }
                }
                if (streamEvent.type === 'error') {
                  return { ...e, status: 'failed' as const, error: streamEvent.content, completedAt: Date.now() }
                }
                if (streamEvent.type === 'status' && streamEvent.content === 'running') {
                  return { ...e, status: 'running' as const, startedAt: Date.now() }
                }
                if (streamEvent.type === 'status' && streamEvent.content === 'aborted') {
                  return { ...e, status: 'aborted' as const, completedAt: Date.now() }
                }
                return e
              })
            }

            return { streamOutput: newOutput, streamEvents: newEvents, executions }
          })
        }
      } catch {
        // Ignore invalid messages
      }
    }

    ws.onclose = () => {
      set({ isConnected: false, ws: null })
      // Auto-reconnect after 3s
      setTimeout(() => {
        if (localStorage.getItem('mc_auth_token')) {
          get().connectWebSocket()
        }
      }, 3000)
    }

    ws.onerror = () => {
      // onclose will fire after this
    }

    set({ ws })
  },

  disconnectWebSocket: () => {
    const ws = get().ws
    if (ws) {
      ws.close()
      set({ ws: null, isConnected: false })
    }
  },

  subscribeToExecution: (id) => {
    const ws = get().ws
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'subscribe', executionId: id }))
    }
  },

  getStreamOutput: (id) => {
    return get().streamOutput.get(id) || ''
  },

  getStreamEvents: (id) => {
    return get().streamEvents.get(id) || []
  },

  clearStream: (id) => {
    set((state) => {
      const newOutput = new Map(state.streamOutput)
      const newEvents = new Map(state.streamEvents)
      newOutput.delete(id)
      newEvents.delete(id)
      return { streamOutput: newOutput, streamEvents: newEvents }
    })
  },
}))
