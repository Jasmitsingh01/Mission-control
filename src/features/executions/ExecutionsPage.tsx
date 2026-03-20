import { useEffect, useState } from 'react'
import {
  Play,
  Terminal,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  ChevronDown,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useExecutionStore } from '@/stores/executionStore'
import { ExecutionPanel } from './ExecutionPanel'

export function ExecutionsPage() {
  const {
    executions,
    activeExecution,
    isConnected,
    fetchExecutions,
    startExecution,
    connectWebSocket,
  } = useExecutionStore()

  const [showNewTask, setShowNewTask] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [taskTitle, setTaskTitle] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    connectWebSocket()
    fetchExecutions()
  }, [])

  // Poll for status updates when any execution is running/queued
  const hasRunning = executions.some((e) => e.status === 'running' || e.status === 'queued')
  useEffect(() => {
    if (!hasRunning) return
    const interval = setInterval(() => fetchExecutions(), 3000)
    return () => clearInterval(interval)
  }, [hasRunning])

  // Auto-expand active execution
  useEffect(() => {
    if (activeExecution) {
      setExpandedId(activeExecution)
    }
  }, [activeExecution])

  const handleSubmit = async () => {
    if (!prompt.trim()) return
    setIsSubmitting(true)
    try {
      const id = await startExecution({
        taskTitle: taskTitle.trim() || 'Quick Task',
        prompt: prompt.trim(),
      })
      setExpandedId(id)
      setPrompt('')
      setTaskTitle('')
      setShowNewTask(false)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const statusIcon: Record<string, React.ComponentType<{ className?: string }>> = {
    queued: Clock,
    running: Loader2,
    completed: CheckCircle2,
    failed: XCircle,
    aborted: AlertCircle,
  }

  const statusColor: Record<string, string> = {
    queued: 'text-yellow-400',
    running: 'text-green-400',
    completed: 'text-green-400',
    failed: 'text-error',
    aborted: 'text-outline',
  }

  return (
    <div className="space-y-6 pb-8 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">Executions</h1>
          <p className="text-sm text-on-surface-variant mt-2">
            Run tasks with Claude Code and view real-time output
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className={cn(
            'flex items-center gap-1.5 font-mono text-[10px] px-2.5 py-1 rounded-full',
            isConnected
              ? 'bg-green-400/10 text-green-400 border border-green-400/20'
              : 'bg-error/10 text-error border border-error/20'
          )}>
            <div className={cn('h-1.5 w-1.5 rounded-full', isConnected ? 'bg-green-400' : 'bg-error')} />
            {isConnected ? 'Live' : 'Disconnected'}
          </div>
          <button
            onClick={() => setShowNewTask(true)}
            className="flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-on-primary font-mono text-[10px] uppercase tracking-widest font-bold hover:bg-primary/90 transition-colors"
          >
            <Play className="h-3.5 w-3.5" />
            New Task
          </button>
        </div>
      </div>

      {/* New Task Form */}
      {showNewTask && (
        <div className="bg-surface-container-low rounded-xl border border-primary/20 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm text-on-surface">Execute with Claude Code</span>
          </div>
          <div>
            <label className="font-mono text-[10px] uppercase tracking-widest text-outline font-bold">Task Name</label>
            <input
              type="text"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="e.g., Fix login bug"
              className="mt-1 w-full px-3 py-2 rounded-lg bg-surface-container text-on-surface text-sm border border-outline-variant/20 focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="font-mono text-[10px] uppercase tracking-widest text-outline font-bold">Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what Claude Code should do... (e.g., 'Find and fix the authentication bug in the login flow')"
              rows={4}
              className="mt-1 w-full px-3 py-2 rounded-lg bg-surface-container text-on-surface text-sm border border-outline-variant/20 focus:border-primary focus:outline-none resize-none"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => { setShowNewTask(false); setPrompt(''); setTaskTitle('') }}
              className="h-8 px-4 rounded-lg font-mono text-[10px] uppercase tracking-widest text-on-surface-variant hover:bg-surface-container transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!prompt.trim() || isSubmitting}
              className="h-8 px-4 rounded-lg bg-primary text-on-primary font-mono text-[10px] uppercase tracking-widest font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
              Execute
            </button>
          </div>
        </div>
      )}

      {/* Expanded execution panel */}
      {expandedId && (
        <ExecutionPanel executionId={expandedId} />
      )}

      {/* Execution list */}
      <div className="space-y-2">
        {executions.length === 0 && (
          <div className="bg-surface-container-low rounded-xl border border-outline-variant/10 p-12 text-center">
            <Terminal className="h-8 w-8 text-outline mx-auto mb-3" />
            <p className="text-sm text-outline">No executions yet. Click "New Task" to run your first Claude Code task.</p>
          </div>
        )}
        {executions.map((exec) => {
          const Icon = statusIcon[exec.status] || Clock
          const color = statusColor[exec.status] || 'text-outline'
          const isExpanded = expandedId === exec.id

          return (
            <button
              key={exec.id}
              onClick={() => setExpandedId(isExpanded ? null : exec.id)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors border',
                isExpanded
                  ? 'bg-primary/5 border-primary/20'
                  : 'bg-surface-container-low border-outline-variant/10 hover:bg-surface-container/50'
              )}
            >
              <Icon className={cn('h-4 w-4 shrink-0', color, exec.status === 'running' && 'animate-spin')} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-on-surface truncate">{exec.taskTitle}</p>
                <p className="font-mono text-[10px] text-outline truncate">
                  {exec.model} · {new Date(exec.createdAt).toLocaleString()}
                  {exec.usage.durationMs > 0 && ` · ${(exec.usage.durationMs / 1000).toFixed(1)}s`}
                </p>
              </div>
              <span className={cn(
                'font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded',
                exec.status === 'completed' && 'bg-green-400/10 text-green-400',
                exec.status === 'running' && 'bg-green-400/10 text-green-400',
                exec.status === 'queued' && 'bg-yellow-400/10 text-yellow-400',
                exec.status === 'failed' && 'bg-error/10 text-error',
                exec.status === 'aborted' && 'bg-surface-container-highest text-outline',
              )}>
                {exec.status}
              </span>
              <ChevronDown className={cn('h-4 w-4 text-outline transition-transform', isExpanded && 'rotate-180')} />
            </button>
          )
        })}
      </div>
    </div>
  )
}
