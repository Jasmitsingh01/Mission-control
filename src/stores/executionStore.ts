import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { executeApi } from '@/lib/api'
import { useTaskStore } from './taskStore'

/** Play a completion beep using Web Audio API */
function playCompletionBeep() {
  try {
    const ctx = new AudioContext()
    // Play two ascending tones for a pleasant "ding ding"
    const playTone = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = freq
      osc.type = 'sine'
      gain.gain.setValueAtTime(0.3, startTime)
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration)
      osc.start(startTime)
      osc.stop(startTime + duration)
    }
    playTone(830, ctx.currentTime, 0.15)        // E5
    playTone(1046, ctx.currentTime + 0.15, 0.3) // C6
    // Cleanup after sound finishes
    setTimeout(() => ctx.close(), 1000)
  } catch {
    // AudioContext not available — ignore
  }
}

/** Play an attention beep for interaction requests */
function playAttentionBeep() {
  try {
    const ctx = new AudioContext()
    const playTone = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = freq
      osc.type = 'triangle'
      gain.gain.setValueAtTime(0.25, startTime)
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration)
      osc.start(startTime)
      osc.stop(startTime + duration)
    }
    playTone(600, ctx.currentTime, 0.12)
    playTone(800, ctx.currentTime + 0.15, 0.12)
    playTone(600, ctx.currentTime + 0.3, 0.15)
    setTimeout(() => ctx.close(), 1000)
  } catch {
    // ignore
  }
}

/** Show browser push notification */
function showBrowserNotification(title: string, body: string) {
  if (!('Notification' in window)) return
  if (Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/favicon.ico' })
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then((perm) => {
      if (perm === 'granted') {
        new Notification(title, { body, icon: '/favicon.ico' })
      }
    })
  }
}

export interface StreamEvent {
  executionId: string
  type: 'text' | 'tool_use' | 'tool_result' | 'error' | 'status' | 'complete' | 'interaction_request' | 'interaction_response' | 'artifact'
  content: string
  toolName?: string
  toolInput?: any
  timestamp: number
}

export interface InteractionRequest {
  requestId: string
  executionId: string
  agentName?: string
  type: 'approval' | 'user_input' | 'file_request'
  title: string
  description: string
  options?: string[]
  inputSchema?: { fields: { name: string; label: string; type: 'text' | 'textarea' | 'select'; required: boolean; options?: string[] }[] }
  status: 'pending' | 'responded' | 'expired'
  createdAt: number
}

export interface ArtifactInfo {
  name: string
  path: string
  type: string
  size?: number
  content?: string
  createdAt: number
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
  pendingInteractions: Map<string, InteractionRequest[]>
  artifacts: Map<string, ArtifactInfo[]>
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
  respondToInteraction: (executionId: string, requestId: string, response: any) => void
  getPendingInteractions: (executionId: string) => InteractionRequest[]
  getArtifacts: (executionId: string) => ArtifactInfo[]
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

export const useExecutionStore = create<ExecutionState>()(
  persist(
    (set, get) => ({
  executions: [],
  activeExecution: null,
  streamOutput: new Map(),
  streamEvents: new Map(),
  pendingInteractions: new Map(),
  artifacts: new Map(),
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
    try {
      await executeApi.abort(id)
    } catch (err: any) {
      console.error(`Failed to abort execution ${id} via API:`, err.message)
      // Still mark as aborted locally so the UI isn't stuck
    }
    // Always update local state — even if API call failed,
    // the user wants this execution stopped from their perspective
    set((state) => ({
      executions: state.executions.map((e) =>
        e.id === id ? { ...e, status: 'aborted' as const, completedAt: Date.now() } : e
      ),
    }))

    // Also clean up stream data
    set((state) => {
      const newOutput = new Map(state.streamOutput)
      const newEvents = new Map(state.streamEvents)
      const newInteractions = new Map(state.pendingInteractions)
      // Don't delete — just stop tracking as active
      return {
        streamOutput: newOutput,
        streamEvents: newEvents,
        pendingInteractions: newInteractions,
        activeExecution: state.activeExecution === id ? null : state.activeExecution,
      }
    })
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

        // Handle mission_complete — play beep sound + browser notification
        if (msg.type === 'mission_complete') {
          playCompletionBeep()
          showBrowserNotification('Mission Complete', msg.content || 'Your mission has finished!')
          get().fetchExecutions()
        }

        // Handle mission-level interaction_request (broadcast to all clients)
        if (msg.type === 'interaction_request' && !msg.executionId) {
          playAttentionBeep()
          const parsed = JSON.parse(msg.content || '{}')
          showBrowserNotification(
            `Agent needs input: ${msg.agentName || 'Agent'}`,
            parsed.title || 'An agent requires your attention'
          )
        }

        // Handle stream events
        if (msg.executionId && msg.type) {
          const streamEvent = msg as StreamEvent
          const execId = streamEvent.executionId

          // Always update events list
          set((state) => {
            const newEvents = new Map(state.streamEvents)
            const events = newEvents.get(execId) || []
            newEvents.set(execId, [...events.slice(-200), streamEvent])
            return { streamEvents: newEvents }
          })

          // Update output for text/tool events
          if (streamEvent.type === 'text' || streamEvent.type === 'tool_use' || streamEvent.type === 'tool_result') {
            set((state) => {
              const newOutput = new Map(state.streamOutput)
              const current = newOutput.get(execId) || ''
              if (streamEvent.type === 'text') {
                newOutput.set(execId, current + streamEvent.content)
              } else if (streamEvent.type === 'tool_use') {
                newOutput.set(execId, current + `\n[Tool: ${streamEvent.toolName}]\n`)
              } else if (streamEvent.type === 'tool_result') {
                newOutput.set(execId, current + `\n${streamEvent.content}\n`)
              }
              return { streamOutput: newOutput }
            })
          }

          // Handle interaction requests
          if (streamEvent.type === 'interaction_request') {
            try {
              const parsed = JSON.parse(streamEvent.content)
              const req: InteractionRequest = {
                requestId: parsed.requestId,
                executionId: execId,
                agentName: parsed.agentName,
                type: parsed.type || 'user_input',
                title: parsed.title || 'Agent needs input',
                description: parsed.description || '',
                options: parsed.options,
                inputSchema: parsed.inputSchema,
                status: 'pending',
                createdAt: Date.now(),
              }
              set((state) => {
                const newInteractions = new Map(state.pendingInteractions)
                const existing = newInteractions.get(execId) || []
                newInteractions.set(execId, [...existing, req])
                return { pendingInteractions: newInteractions }
              })
              playAttentionBeep()
              showBrowserNotification('Agent needs your input', req.title)
            } catch {
              // ignore
            }
          }

          // Handle interaction responses
          if (streamEvent.type === 'interaction_response') {
            try {
              const parsed = JSON.parse(streamEvent.content)
              set((state) => {
                const newInteractions = new Map(state.pendingInteractions)
                const existing = newInteractions.get(execId) || []
                newInteractions.set(
                  execId,
                  existing.map((r) =>
                    r.requestId === parsed.requestId ? { ...r, status: 'responded' as const } : r
                  )
                )
                return { pendingInteractions: newInteractions }
              })
            } catch {
              // ignore
            }
          }

          // Handle artifacts
          if (streamEvent.type === 'artifact') {
            try {
              const parsed = JSON.parse(streamEvent.content)
              const art: ArtifactInfo = {
                name: parsed.name || 'Unknown',
                path: parsed.path || '',
                type: parsed.type || 'file',
                size: parsed.size,
                content: parsed.content,
                createdAt: Date.now(),
              }
              set((state) => {
                const newArtifacts = new Map(state.artifacts)
                const existing = newArtifacts.get(execId) || []
                newArtifacts.set(execId, [...existing, art])
                return { artifacts: newArtifacts }
              })
            } catch {
              // ignore
            }
          }

          // Update execution status
          if (streamEvent.type === 'status' || streamEvent.type === 'complete' || streamEvent.type === 'error') {
            set((state) => ({
              executions: state.executions.map((e) => {
                if (e.id !== execId) return e
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
              }),
            }))

            // Sync result back to linked task
            if (streamEvent.type === 'complete' || streamEvent.type === 'error') {
              try {
                const taskStore = useTaskStore.getState()
                const linkedTask = taskStore.tasks.find((t) => t.executionId === execId)
                if (linkedTask) {
                  const updates: any = {
                    result: streamEvent.content || null,
                  }
                  if (streamEvent.type === 'complete') {
                    updates.status = 'done'
                  }
                  taskStore.updateTask(linkedTask.id, updates)
                }
              } catch {
                // ignore if task store not available
              }
            }
          }
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

  respondToInteraction: (executionId, requestId, response) => {
    const ws = get().ws
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'interaction_response',
        executionId,
        requestId,
        response,
      }))
    }

    // Optimistically mark as responded
    set((state) => {
      const newInteractions = new Map(state.pendingInteractions)
      const existing = newInteractions.get(executionId) || []
      newInteractions.set(
        executionId,
        existing.map((r) =>
          r.requestId === requestId ? { ...r, status: 'responded' as const } : r
        )
      )
      return { pendingInteractions: newInteractions }
    })
  },

  getPendingInteractions: (executionId) => {
    return (get().pendingInteractions.get(executionId) || []).filter((r) => r.status === 'pending')
  },

  getArtifacts: (executionId) => {
    return get().artifacts.get(executionId) || []
  },
}),
    {
      name: 'mc-executions',
      partialize: (state) => ({
        executions: state.executions,
      }),
      // Maps don't serialize to JSON, so we only persist the executions array
      // Stream data, artifacts, and interactions are session-only
    }
  )
)
