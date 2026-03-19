import { useState, useMemo } from 'react'
import {
  Clock,
  Plus,
  Play,
  Pause,
  Trash2,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MoreVertical,
  Bot,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useJobStore } from '@/stores/jobStore'
import { useAgentStore } from '@/stores/agentStore'
import { CreateJobDialog } from './CreateJobDialog'
import { PRIORITY_COLORS } from '@/lib/constants'
import type { JobStatus } from '@/stores/jobStore'

const statusConfig: Record<JobStatus, { color: string; bg: string; icon: React.ComponentType<{ className?: string }> }> = {
  scheduled: { color: 'text-primary', bg: 'bg-primary/10', icon: Clock },
  running: { color: 'text-secondary', bg: 'bg-secondary/10', icon: Play },
  paused: { color: 'text-tertiary', bg: 'bg-tertiary/10', icon: Pause },
  failed: { color: 'text-error', bg: 'bg-error-container/20', icon: XCircle },
}

function formatRelativeTime(ts: number): string {
  const diff = ts - Date.now()
  if (diff < 0) {
    const ago = Math.abs(diff)
    if (ago < 60000) return `${Math.floor(ago / 1000)}s ago`
    if (ago < 3600000) return `${Math.floor(ago / 60000)}m ago`
    if (ago < 86400000) return `${Math.floor(ago / 3600000)}h ago`
    return `${Math.floor(ago / 86400000)}d ago`
  }
  if (diff < 60000) return `in ${Math.floor(diff / 1000)}s`
  if (diff < 3600000) return `in ${Math.floor(diff / 60000)}m`
  if (diff < 86400000) return `in ${Math.floor(diff / 3600000)}h`
  return `in ${Math.floor(diff / 86400000)}d`
}

export function JobsPage() {
  const { jobs, toggleJob, deleteJob } = useJobStore()
  const agents = useAgentStore((s) => s.agents)
  const [createOpen, setCreateOpen] = useState(false)

  const stats = useMemo(() => ({
    total: jobs.length,
    active: jobs.filter((j) => j.enabled).length,
    running: jobs.filter((j) => j.status === 'running').length,
    failed: jobs.filter((j) => j.status === 'failed').length,
  }), [jobs])

  const getAgentName = (id: string | null) => {
    if (!id) return null
    return agents.find((a) => a.id === id)?.name ?? id
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">Scheduled Jobs</h1>
          <p className="text-sm text-on-surface-variant mt-2">
            Recurring automated tasks with priority queuing
          </p>
        </div>
        <button
          className="flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-on-primary font-mono text-[10px] uppercase tracking-widest font-bold transition-colors hover:bg-primary/90"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="h-4 w-4" />
          New Job
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Jobs', value: stats.total, color: 'text-on-surface' },
          { label: 'Active', value: stats.active, color: 'text-primary' },
          { label: 'Running Now', value: stats.running, color: 'text-secondary' },
          { label: 'Failed', value: stats.failed, color: 'text-error' },
        ].map((s) => (
          <div key={s.label} className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/10">
            <p className="font-mono text-[10px] uppercase tracking-widest text-outline font-bold">{s.label}</p>
            <p className={cn('text-2xl font-bold mt-1 font-[\'JetBrains_Mono\']', s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Job List */}
      <div className="space-y-2">
        {jobs.map((job) => {
          const sc = statusConfig[job.status]
          const StatusIcon = sc.icon
          return (
            <div
              key={job.id}
              className={cn(
                'bg-surface-container-low rounded-xl border border-outline-variant/10 p-5 transition-colors',
                !job.enabled && 'opacity-60',
                job.priority === 'critical' && 'border-l-2 border-l-error',
                job.priority === 'high' && 'border-l-2 border-l-tertiary',
              )}
            >
              <div className="flex items-start gap-4">
                {/* Status icon */}
                <div className={cn('rounded-lg p-2 mt-0.5 shrink-0', sc.bg)}>
                  <StatusIcon className={cn('h-4 w-4', sc.color)} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm text-on-surface">{job.name}</h3>
                    <span className={cn(
                      "font-mono text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full",
                      sc.bg, sc.color
                    )}>
                      {job.status}
                    </span>
                    <span className={cn(
                      "font-mono text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full capitalize border",
                      PRIORITY_COLORS[job.priority]
                    )}>
                      {job.priority}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant mb-2 line-clamp-1">{job.description}</p>

                  {/* Error */}
                  {job.errorMessage && (
                    <div className="rounded-lg bg-error-container/20 border border-error/20 px-3 py-1.5 mb-2">
                      <p className="font-mono text-[11px] text-error flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        {job.errorMessage}
                      </p>
                    </div>
                  )}

                  {/* Meta row */}
                  <div className="flex items-center gap-4 font-mono text-[10px] text-on-surface-variant flex-wrap">
                    <span className="bg-surface-container-lowest rounded-md px-2 py-0.5 text-primary border border-outline-variant/10">{job.cronExpression}</span>
                    <span className="text-outline">{job.cronHuman}</span>
                    {job.targetAgentId && (
                      <span className="flex items-center gap-1">
                        <Bot className="h-3 w-3" />
                        {getAgentName(job.targetAgentId)}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-secondary">
                      <CheckCircle2 className="h-3 w-3" />
                      {job.successCount}
                    </span>
                    <span className="flex items-center gap-1 text-error">
                      <XCircle className="h-3 w-3" />
                      {job.failCount}
                    </span>
                    {job.lastRunAt && <span className="text-outline">Last: {formatRelativeTime(job.lastRunAt)}</span>}
                    <span className="text-outline">Next: {formatRelativeTime(job.nextRunAt)}</span>
                  </div>
                </div>

                {/* Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-on-surface-variant hover:text-on-surface">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => toggleJob(job.id)}>
                      {job.enabled ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                      {job.enabled ? 'Disable' : 'Enable'}
                    </DropdownMenuItem>
                    {job.status === 'failed' && (
                      <DropdownMenuItem onClick={() => toggleJob(job.id)}>
                        <RotateCcw className="h-4 w-4 mr-2" /> Retry
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-error" onClick={() => deleteJob(job.id)}>
                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )
        })}
      </div>

      <CreateJobDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}
