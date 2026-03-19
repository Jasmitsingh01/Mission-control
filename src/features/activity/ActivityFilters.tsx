import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Severity, ActivityType } from '@/stores/activityStore'

const severityFilters: { value: Severity | 'all'; label: string; color: string }[] = [
  { value: 'all', label: 'All', color: '' },
  { value: 'success', label: 'Success', color: 'text-green-400' },
  { value: 'info', label: 'Info', color: 'text-blue-400' },
  { value: 'warning', label: 'Warning', color: 'text-yellow-400' },
  { value: 'error', label: 'Error', color: 'text-red-400' },
]

const typeFilters: { value: ActivityType | 'all'; label: string }[] = [
  { value: 'all', label: 'All Types' },
  { value: 'task_created', label: 'Task Created' },
  { value: 'task_moved', label: 'Task Moved' },
  { value: 'task_updated', label: 'Task Updated' },
  { value: 'agent_spawned', label: 'Agent Spawned' },
  { value: 'agent_stopped', label: 'Agent Stopped' },
  { value: 'agent_error', label: 'Agent Error' },
  { value: 'job_started', label: 'Job Started' },
  { value: 'job_completed', label: 'Job Completed' },
  { value: 'job_failed', label: 'Job Failed' },
  { value: 'skill_triggered', label: 'Skill Triggered' },
  { value: 'memory_written', label: 'Memory Written' },
  { value: 'system', label: 'System' },
]

interface ActivityFiltersProps {
  severity: Severity | 'all'
  type: ActivityType | 'all'
  onSeverityChange: (severity: Severity | 'all') => void
  onTypeChange: (type: ActivityType | 'all') => void
}

export function ActivityFilters({ severity, type, onSeverityChange, onTypeChange }: ActivityFiltersProps) {
  return (
    <div className="space-y-3">
      {/* Severity */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground font-medium mr-1">Severity:</span>
        {severityFilters.map((f) => (
          <Button
            key={f.value}
            variant={severity === f.value ? 'default' : 'ghost'}
            size="sm"
            className={cn('h-7 text-xs', severity !== f.value && f.color)}
            onClick={() => onSeverityChange(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* Type */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs text-muted-foreground font-medium mr-1">Type:</span>
        <select
          value={type}
          onChange={(e) => onTypeChange(e.target.value as ActivityType | 'all')}
          className="h-7 rounded-md border border-input bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {typeFilters.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
