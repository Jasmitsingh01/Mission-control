import { useEffect, useRef, useState } from 'react'
import {
  Terminal,
  Wrench,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Square,
  Clock,
  Zap,
  Bell,
  MessageSquare,
  FileText,
  Send,
  Download,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useExecutionStore } from '@/stores/executionStore'
import { executeApi } from '@/lib/api'
import type { StreamEvent, InteractionRequest, ArtifactInfo } from '@/stores/executionStore'

const EMPTY_EVENTS: StreamEvent[] = []

interface ExecutionPanelProps {
  executionId: string
  className?: string
}

interface StoredLog {
  timestamp: string
  type: 'text' | 'tool_use' | 'tool_result' | 'error' | 'system'
  content: string
  toolName?: string
  toolInput?: any
}

const eventIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  text: Terminal,
  tool_use: Wrench,
  tool_result: Zap,
  error: AlertCircle,
  status: Clock,
  complete: CheckCircle2,
  interaction_request: Bell,
  interaction_response: MessageSquare,
  artifact: FileText,
}

const eventColors: Record<string, string> = {
  text: 'text-on-surface',
  tool_use: 'text-primary',
  tool_result: 'text-secondary',
  error: 'text-error',
  status: 'text-outline',
  complete: 'text-green-400',
  interaction_request: 'text-amber-400',
  interaction_response: 'text-green-400',
  artifact: 'text-blue-400',
}

export function ExecutionPanel({ executionId, className }: ExecutionPanelProps) {
  const outputRef = useRef<HTMLDivElement>(null)
  const execution = useExecutionStore((s) => s.executions.find((e) => e.id === executionId))
  const liveEvents = useExecutionStore((s) => s.streamEvents.get(executionId) ?? EMPTY_EVENTS)
  const abortExecution = useExecutionStore((s) => s.abortExecution)
  const interactionsForExec = useExecutionStore((s) => s.pendingInteractions.get(executionId))
  const artifactsForExec = useExecutionStore((s) => s.artifacts.get(executionId))

  const pendingInteractions = interactionsForExec ? interactionsForExec.filter((r) => r.status === 'pending') : []
  const artifacts = artifactsForExec || []

  // Stored logs fetched from API for completed/historical executions
  const [storedLogs, setStoredLogs] = useState<StoredLog[]>([])
  const [storedResult, setStoredResult] = useState<string | null>(null)
  const [fetchedId, setFetchedId] = useState<string | null>(null)

  // Fetch stored logs from API — on first load and poll while running
  const isStillRunning = execution?.status === 'running' || execution?.status === 'queued'

  useEffect(() => {
    // Reset when switching executions
    if (fetchedId !== executionId) {
      setStoredLogs([])
      setStoredResult(null)
      setFetchedId(null)
    }
  }, [executionId, fetchedId])

  useEffect(() => {
    const fetchData = () => {
      executeApi.get(executionId).then((data) => {
        const exec = data.execution
        if (exec) {
          if (exec.logs && exec.logs.length > 0) setStoredLogs(exec.logs)
          if (exec.result) setStoredResult(exec.result)
          useExecutionStore.getState().fetchExecution(executionId)
        }
        setFetchedId(executionId)
      }).catch(() => {
        setFetchedId(executionId)
      })
    }

    // Fetch immediately if not yet fetched and no live events
    if (fetchedId !== executionId && liveEvents.length === 0) {
      fetchData()
    }

    // Poll every 3s while running to catch completion
    if (isStillRunning) {
      const interval = setInterval(fetchData, 3000)
      return () => clearInterval(interval)
    }
    return undefined
  }, [executionId, liveEvents.length, fetchedId])

  // Build display events: prefer live stream, fall back to stored logs
  const displayEvents: StreamEvent[] = liveEvents.length > 0
    ? liveEvents
    : storedLogs.map((log) => ({
        executionId,
        type: log.type === 'system' ? 'status' : log.type,
        content: log.content,
        toolName: log.toolName,
        toolInput: log.toolInput,
        timestamp: new Date(log.timestamp).getTime(),
      }))

  // Auto-scroll to bottom
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [displayEvents.length, pendingInteractions.length])

  if (!execution) {
    return (
      <div className={cn('bg-surface-container-low rounded-xl border border-outline-variant/10 p-8 text-center', className)}>
        <p className="text-sm text-outline">Execution not found</p>
      </div>
    )
  }

  const isRunning = execution.status === 'running' || execution.status === 'queued'
  const isComplete = execution.status === 'completed'
  const isFailed = execution.status === 'failed' || execution.status === 'aborted'

  // For completed executions with no logs, show the result directly
  const showResultFallback = (isComplete || isFailed) && displayEvents.length === 0

  return (
    <div className={cn('bg-surface-container-low rounded-xl border border-outline-variant/10 overflow-hidden', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/10">
        <div className="flex items-center gap-3">
          <div className={cn(
            'h-2.5 w-2.5 rounded-full',
            isRunning && 'bg-green-400 animate-pulse',
            isComplete && 'bg-green-400',
            isFailed && 'bg-error',
            execution.status === 'queued' && 'bg-yellow-400 animate-pulse',
          )} />
          <div>
            <p className="text-sm font-semibold text-on-surface">{execution.taskTitle}</p>
            <p className="font-mono text-[10px] text-outline">
              {execution.model} · {execution.status}
              {execution.usage.durationMs > 0 && ` · ${(execution.usage.durationMs / 1000).toFixed(1)}s`}
              {execution.usage.costUsd > 0 && ` · $${execution.usage.costUsd.toFixed(4)}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {pendingInteractions.length > 0 && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-[10px] font-bold animate-pulse">
              <Bell className="h-3 w-3" />
              {pendingInteractions.length} waiting
            </span>
          )}
          {artifacts.length > 0 && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 font-mono text-[10px] font-bold">
              <FileText className="h-3 w-3" />
              {artifacts.length} files
            </span>
          )}
          {isRunning && (
            <button
              onClick={() => abortExecution(executionId)}
              className="flex items-center gap-1.5 h-7 px-3 rounded-lg border border-error/30 text-error font-mono text-[10px] uppercase tracking-widest font-bold hover:bg-error/10 transition-colors"
            >
              <Square className="h-3 w-3" />
              Stop
            </button>
          )}
        </div>
      </div>

      {/* Pending interaction requests banner */}
      {pendingInteractions.length > 0 && (
        <div className="px-4 py-2 bg-amber-500/5 border-b border-amber-500/20">
          {pendingInteractions.map((req) => (
            <InteractionCard key={req.requestId} request={req} executionId={executionId} />
          ))}
        </div>
      )}

      {/* Output */}
      <div
        ref={outputRef}
        className="h-[400px] overflow-y-auto p-4 font-mono text-xs leading-relaxed"
      >
        {displayEvents.length === 0 && isRunning && (
          <div className="flex items-center gap-2 text-outline">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>Waiting for Claude Code output...</span>
          </div>
        )}

        {displayEvents.map((event, i) => (
          <StreamLine key={i} event={event} executionId={executionId} />
        ))}

        {/* Fallback: show stored result if no log events */}
        {showResultFallback && (storedResult || execution.result) && (
          <div className="whitespace-pre-wrap text-on-surface/90">
            {storedResult || execution.result}
          </div>
        )}

        {/* Show error message for failed executions */}
        {isFailed && execution.error && displayEvents.length === 0 && (
          <div className="flex items-start gap-2 my-2 py-1.5 px-2 rounded-lg bg-error/5 border border-error/10">
            <AlertCircle className="h-3.5 w-3.5 text-error mt-0.5 shrink-0" />
            <span className="text-error">{execution.error}</span>
          </div>
        )}

        {isRunning && (
          <div className="flex items-center gap-1.5 text-primary mt-2">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span className="animate-pulse">Working...</span>
          </div>
        )}
      </div>

      {/* Artifacts section */}
      {artifacts.length > 0 && (
        <div className="px-4 py-3 border-t border-outline-variant/10 bg-blue-500/5">
          <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-2 flex items-center gap-1.5">
            <FileText className="h-3 w-3" />
            Artifacts ({artifacts.length})
          </p>
          <div className="space-y-1">
            {artifacts.map((art, i) => (
              <div key={i} className="flex items-center justify-between py-1 px-2 rounded bg-surface-container text-xs">
                <div className="flex items-center gap-2">
                  <FileText className="h-3 w-3 text-blue-400 shrink-0" />
                  <span className="text-on-surface font-medium">{art.name}</span>
                  <span className="text-outline font-mono text-[10px]">{art.type}</span>
                  {art.size && <span className="text-outline font-mono text-[10px]">{formatSize(art.size)}</span>}
                </div>
                <span className="text-outline font-mono text-[10px] truncate max-w-[200px]">{art.path}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer with usage stats */}
      {(isComplete || isFailed) && (
        <div className="flex items-center gap-4 px-4 py-2.5 border-t border-outline-variant/10 bg-surface-container">
          <span className={cn(
            'font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded',
            isComplete ? 'bg-green-400/10 text-green-400' : 'bg-error/10 text-error'
          )}>
            {execution.status}
          </span>
          {execution.usage.totalTurns > 0 && (
            <span className="font-mono text-[10px] text-outline">
              {execution.usage.totalTurns} turns
            </span>
          )}
          {execution.usage.inputTokens > 0 && (
            <span className="font-mono text-[10px] text-outline">
              {(execution.usage.inputTokens + execution.usage.outputTokens).toLocaleString()} tokens
            </span>
          )}
          {execution.usage.durationMs > 0 && (
            <span className="font-mono text-[10px] text-outline">
              {(execution.usage.durationMs / 1000).toFixed(1)}s
            </span>
          )}
          {artifacts.length > 0 && (
            <span className="font-mono text-[10px] text-blue-400">
              {artifacts.length} artifact{artifacts.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

function InteractionCard({ request, executionId }: { request: InteractionRequest; executionId: string }) {
  const respondToInteraction = useExecutionStore((s) => s.respondToInteraction)
  const [inputValues, setInputValues] = useState<Record<string, string>>({})
  const [responded, setResponded] = useState(false)

  if (responded || request.status === 'responded') {
    return (
      <div className="flex items-center gap-2 py-2 text-green-400 text-xs">
        <CheckCircle2 className="h-3.5 w-3.5" />
        <span>Responded to: {request.title}</span>
      </div>
    )
  }

  const handleApproval = (option: string) => {
    respondToInteraction(executionId, request.requestId, { action: option })
    setResponded(true)
  }

  const handleInputSubmit = () => {
    respondToInteraction(executionId, request.requestId, inputValues)
    setResponded(true)
  }

  return (
    <div className="my-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
      <div className="flex items-start gap-2">
        <Bell className="h-4 w-4 text-amber-400 mt-0.5 shrink-0 animate-bounce" />
        <div>
          <p className="text-sm font-semibold text-amber-200">{request.title}</p>
          <p className="text-xs text-amber-300/70 mt-0.5">{request.description}</p>
        </div>
      </div>

      {/* Approval buttons */}
      {request.type === 'approval' && (
        <div className="flex items-center gap-2 ml-6">
          {(request.options || ['Approve', 'Reject']).map((option) => (
            <button
              key={option}
              onClick={() => handleApproval(option)}
              className={cn(
                'px-4 py-1.5 rounded-lg font-mono text-[10px] font-bold uppercase tracking-widest transition-all',
                option.toLowerCase().includes('approve') || option.toLowerCase().includes('yes')
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
                  : option.toLowerCase().includes('reject') || option.toLowerCase().includes('no')
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                  : 'bg-surface-container text-on-surface-variant border border-outline-variant/20 hover:bg-surface-container-high'
              )}
            >
              {option}
            </button>
          ))}
        </div>
      )}

      {/* User input form */}
      {request.type === 'user_input' && (
        <div className="ml-6 space-y-2">
          {request.inputSchema?.fields ? (
            request.inputSchema.fields.map((field) => (
              <div key={field.name}>
                <label className="font-mono text-[10px] text-amber-300/70 block mb-1">
                  {field.label}{field.required && ' *'}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    rows={3}
                    value={inputValues[field.name] || ''}
                    onChange={(e) => setInputValues((prev) => ({ ...prev, [field.name]: e.target.value }))}
                    className="w-full rounded-lg border border-amber-500/20 bg-surface-container-lowest px-3 py-2 text-xs text-on-surface placeholder:text-outline focus:outline-none focus:border-amber-500/50 resize-none"
                  />
                ) : field.type === 'select' ? (
                  <select
                    value={inputValues[field.name] || ''}
                    onChange={(e) => setInputValues((prev) => ({ ...prev, [field.name]: e.target.value }))}
                    className="w-full rounded-lg border border-amber-500/20 bg-surface-container-lowest px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-amber-500/50"
                  >
                    <option value="">Select...</option>
                    {field.options?.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={inputValues[field.name] || ''}
                    onChange={(e) => setInputValues((prev) => ({ ...prev, [field.name]: e.target.value }))}
                    className="w-full rounded-lg border border-amber-500/20 bg-surface-container-lowest px-3 py-2 text-xs text-on-surface placeholder:text-outline focus:outline-none focus:border-amber-500/50"
                  />
                )}
              </div>
            ))
          ) : (
            <input
              type="text"
              placeholder="Type your response..."
              value={inputValues['_default'] || ''}
              onChange={(e) => setInputValues({ _default: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && handleInputSubmit()}
              className="w-full rounded-lg border border-amber-500/20 bg-surface-container-lowest px-3 py-2 text-xs text-on-surface placeholder:text-outline focus:outline-none focus:border-amber-500/50"
            />
          )}
          <button
            onClick={handleInputSubmit}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono text-[10px] font-bold uppercase tracking-widest hover:bg-amber-500/30 transition-all"
          >
            <Send className="h-3 w-3" />
            Send Response
          </button>
        </div>
      )}

      {/* File request */}
      {request.type === 'file_request' && (
        <div className="ml-6">
          <p className="text-xs text-amber-300/70 mb-2">The agent is requesting a file from you.</p>
          <button
            onClick={() => {
              respondToInteraction(executionId, request.requestId, { provided: true, message: 'File acknowledged' })
              setResponded(true)
            }}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono text-[10px] font-bold uppercase tracking-widest hover:bg-amber-500/30 transition-all"
          >
            <Download className="h-3 w-3" />
            Acknowledge
          </button>
        </div>
      )}
    </div>
  )
}

function StreamLine({ event, executionId }: { event: StreamEvent; executionId: string }) {
  if (event.type === 'text') {
    return (
      <div className="whitespace-pre-wrap text-on-surface/90 mb-1">
        {event.content}
      </div>
    )
  }

  if (event.type === 'tool_use') {
    return (
      <div className="flex items-start gap-2 my-2 py-1.5 px-2 rounded-lg bg-primary/5 border border-primary/10">
        <Wrench className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
        <div>
          <span className="text-primary font-bold">{event.toolName || event.content}</span>
          {event.toolInput && (
            <pre className="text-outline mt-1 text-[10px] max-h-20 overflow-hidden">
              {typeof event.toolInput === 'string'
                ? event.toolInput.slice(0, 200)
                : JSON.stringify(event.toolInput, null, 2).slice(0, 200)}
            </pre>
          )}
        </div>
      </div>
    )
  }

  if (event.type === 'tool_result') {
    return (
      <div className="my-1 py-1 px-2 rounded bg-surface-container text-on-surface-variant text-[10px] max-h-24 overflow-hidden whitespace-pre-wrap">
        {event.content.slice(0, 500)}
      </div>
    )
  }

  if (event.type === 'error') {
    return (
      <div className="flex items-start gap-2 my-2 py-1.5 px-2 rounded-lg bg-error/5 border border-error/10">
        <AlertCircle className="h-3.5 w-3.5 text-error mt-0.5 shrink-0" />
        <span className="text-error">{event.content}</span>
      </div>
    )
  }

  if (event.type === 'interaction_request') {
    let parsed: any = {}
    try { parsed = JSON.parse(event.content) } catch { /* ignore */ }
    return (
      <div className="flex items-start gap-2 my-2 py-1.5 px-2 rounded-lg bg-amber-500/5 border border-amber-500/20">
        <Bell className="h-3.5 w-3.5 text-amber-400 mt-0.5 shrink-0 animate-pulse" />
        <div>
          <span className="text-amber-400 font-bold text-xs">{parsed.title || 'Agent needs input'}</span>
          {parsed.description && (
            <p className="text-amber-300/60 text-[10px] mt-0.5">{parsed.description}</p>
          )}
        </div>
      </div>
    )
  }

  if (event.type === 'interaction_response') {
    return (
      <div className="flex items-center gap-1.5 my-1 text-green-400 text-[10px]">
        <CheckCircle2 className="h-3 w-3 shrink-0" />
        <span>Response sent</span>
      </div>
    )
  }

  if (event.type === 'artifact') {
    let parsed: any = {}
    try { parsed = JSON.parse(event.content) } catch { /* ignore */ }
    return (
      <div className="flex items-start gap-2 my-2 py-1.5 px-2 rounded-lg bg-blue-500/5 border border-blue-500/20">
        <FileText className="h-3.5 w-3.5 text-blue-400 mt-0.5 shrink-0" />
        <div>
          <span className="text-blue-400 font-bold text-xs">{parsed.name || 'Artifact'}</span>
          <span className="text-outline text-[10px] ml-2">{parsed.type} {parsed.size ? `(${formatSize(parsed.size)})` : ''}</span>
          {parsed.path && <p className="text-blue-300/50 text-[10px] font-mono">{parsed.path}</p>}
        </div>
      </div>
    )
  }

  const Icon = eventIcons[event.type] || Terminal
  const color = eventColors[event.type] || 'text-outline'

  return (
    <div className={cn('flex items-center gap-1.5 my-1', color)}>
      <Icon className="h-3 w-3 shrink-0" />
      <span>{event.content}</span>
    </div>
  )
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}
