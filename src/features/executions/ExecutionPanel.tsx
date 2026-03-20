import { useEffect, useRef } from 'react'
import {
  Terminal,
  Wrench,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Square,
  Clock,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useExecutionStore } from '@/stores/executionStore'
import type { StreamEvent } from '@/stores/executionStore'

interface ExecutionPanelProps {
  executionId: string
  className?: string
}

const eventIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  text: Terminal,
  tool_use: Wrench,
  tool_result: Zap,
  error: AlertCircle,
  status: Clock,
  complete: CheckCircle2,
}

const eventColors: Record<string, string> = {
  text: 'text-on-surface',
  tool_use: 'text-primary',
  tool_result: 'text-secondary',
  error: 'text-error',
  status: 'text-outline',
  complete: 'text-green-400',
}

export function ExecutionPanel({ executionId, className }: ExecutionPanelProps) {
  const outputRef = useRef<HTMLDivElement>(null)
  const execution = useExecutionStore((s) => s.executions.find((e) => e.id === executionId))
  const streamOutput = useExecutionStore((s) => s.getStreamOutput(executionId))
  const streamEvents = useExecutionStore((s) => s.getStreamEvents(executionId))
  const abortExecution = useExecutionStore((s) => s.abortExecution)

  // Auto-scroll to bottom
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [streamOutput, streamEvents])

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

      {/* Stream output */}
      <div
        ref={outputRef}
        className="h-[400px] overflow-y-auto p-4 font-mono text-xs leading-relaxed"
      >
        {streamEvents.length === 0 && isRunning && (
          <div className="flex items-center gap-2 text-outline">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>Waiting for Claude Code output...</span>
          </div>
        )}

        {streamEvents.map((event, i) => (
          <StreamLine key={i} event={event} />
        ))}

        {isRunning && (
          <div className="flex items-center gap-1.5 text-primary mt-2">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span className="animate-pulse">Working...</span>
          </div>
        )}
      </div>

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
        </div>
      )}
    </div>
  )
}

function StreamLine({ event }: { event: StreamEvent }) {
  const Icon = eventIcons[event.type] || Terminal
  const color = eventColors[event.type] || 'text-outline'

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
          <span className="text-primary font-bold">{event.toolName}</span>
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

  return (
    <div className={cn('flex items-center gap-1.5 my-1', color)}>
      <Icon className="h-3 w-3 shrink-0" />
      <span>{event.content}</span>
    </div>
  )
}
