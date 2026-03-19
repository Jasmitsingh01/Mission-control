import { cn } from '@/lib/utils'
import type { Severity, ActivityType } from '@/stores/activityStore'

const severityFilters: { value: Severity | 'all'; label: string; color: string }[] = [
  { value: 'all', label: 'All', color: '' },
  { value: 'success', label: 'Success', color: 'text-secondary' },
  { value: 'info', label: 'Info', color: 'text-primary' },
  { value: 'warning', label: 'Warning', color: 'text-tertiary' },
  { value: 'error', label: 'Error', color: 'text-error' },
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
        <span className="font-mono text-[10px] uppercase tracking-widest text-outline font-bold mr-2">Severity:</span>
        {severityFilters.map((f) => (
          <button
            key={f.value}
            className={cn(
              'h-7 px-3 rounded-full font-[\'JetBrains_Mono\'] text-[10px] uppercase tracking-widest font-bold transition-colors',
              severity === f.value
                ? 'bg-primary text-on-primary'
                : cn('bg-surface-container-high hover:text-on-surface', f.color || 'text-on-surface-variant')
            )}
            onClick={() => onSeverityChange(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Type */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="font-mono text-[10px] uppercase tracking-widest text-outline font-bold mr-2">Type:</span>
        <select
          value={type}
          onChange={(e) => onTypeChange(e.target.value as ActivityType | 'all')}
          className="h-7 rounded-lg bg-surface-container-lowest border-none px-2 font-mono text-[11px] text-on-surface focus:outline-none focus:ring-1 focus:ring-primary/40"
        >
          {typeFilters.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
