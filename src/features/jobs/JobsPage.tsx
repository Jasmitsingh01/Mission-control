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
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
  scheduled: { color: 'text-blue-400', bg: 'bg-blue-500/10', icon: Clock },
  running: { color: 'text-green-400', bg: 'bg-green-500/10', icon: Play },
  paused: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', icon: Pause },
  failed: { color: 'text-red-400', bg: 'bg-red-500/10', icon: XCircle },
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Scheduled Jobs</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Recurring automated tasks with priority queuing
          </p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Job
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Jobs', value: stats.total, color: '' },
          { label: 'Active', value: stats.active, color: 'text-blue-400' },
          { label: 'Running Now', value: stats.running, color: 'text-green-400' },
          { label: 'Failed', value: stats.failed, color: 'text-red-400' },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-3 px-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Job List */}
      <div className="space-y-2">
        {jobs.map((job) => {
          const sc = statusConfig[job.status]
          const StatusIcon = sc.icon
          return (
            <Card key={job.id} className={cn(!job.enabled && 'opacity-60')}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start gap-4">
                  {/* Status icon */}
                  <div className={cn('rounded-lg p-2 mt-0.5 shrink-0', sc.bg)}>
                    <StatusIcon className={cn('h-4 w-4', sc.color)} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-sm">{job.name}</h3>
                      <Badge variant="secondary" className={cn('text-[10px]', sc.bg, sc.color)}>
                        {job.status}
                      </Badge>
                      <Badge variant="outline" className={cn('text-[10px] capitalize', PRIORITY_COLORS[job.priority])}>
                        {job.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{job.description}</p>

                    {/* Error */}
                    {job.errorMessage && (
                      <div className="rounded bg-red-500/10 border border-red-500/20 px-2 py-1 mb-2">
                        <p className="text-[11px] text-red-400 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3 shrink-0" />
                          {job.errorMessage}
                        </p>
                      </div>
                    )}

                    {/* Meta row */}
                    <div className="flex items-center gap-4 text-[11px] text-muted-foreground flex-wrap">
                      <span className="font-mono bg-muted/50 rounded px-1.5 py-0.5">{job.cronExpression}</span>
                      <span>{job.cronHuman}</span>
                      {job.targetAgentId && (
                        <span className="flex items-center gap-1">
                          <Bot className="h-3 w-3" />
                          {getAgentName(job.targetAgentId)}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-green-400" />
                        {job.successCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <XCircle className="h-3 w-3 text-red-400" />
                        {job.failCount}
                      </span>
                      {job.lastRunAt && <span>Last: {formatRelativeTime(job.lastRunAt)}</span>}
                      <span>Next: {formatRelativeTime(job.nextRunAt)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
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
                      <DropdownMenuItem className="text-destructive" onClick={() => deleteJob(job.id)}>
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <CreateJobDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}
