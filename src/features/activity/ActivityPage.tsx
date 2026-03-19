import { useState, useMemo } from 'react'
import { Activity, Trash2, Pause, Play } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useActivityStore } from '@/stores/activityStore'
import { ActivityItem } from './ActivityItem'
import { ActivityFilters } from './ActivityFilters'
import type { Severity, ActivityType } from '@/stores/activityStore'

export function ActivityPage() {
  const { events, clearEvents } = useActivityStore()
  const [severityFilter, setSeverityFilter] = useState<Severity | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<ActivityType | 'all'>('all')
  const [paused, setPaused] = useState(false)

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (severityFilter !== 'all' && e.severity !== severityFilter) return false
      if (typeFilter !== 'all' && e.type !== typeFilter) return false
      return true
    })
  }, [events, severityFilter, typeFilter])

  const stats = useMemo(() => ({
    total: events.length,
    errors: events.filter((e) => e.severity === 'error').length,
    warnings: events.filter((e) => e.severity === 'warning').length,
    success: events.filter((e) => e.severity === 'success').length,
  }), [events])

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">Activity Feed</h1>
          <p className="text-sm text-on-surface-variant mt-2">
            Real-time log of all agent actions, task updates, and system events
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-2 h-8 px-4 rounded-lg bg-surface-container-highest text-on-surface-variant font-mono text-[10px] uppercase tracking-widest font-bold border border-outline-variant/10 hover:text-on-surface transition-colors"
            onClick={() => setPaused(!paused)}
          >
            {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
            {paused ? 'Resume' : 'Pause'}
          </button>
          <button
            className="flex items-center gap-2 h-8 px-4 rounded-lg bg-surface-container-highest text-on-surface-variant font-mono text-[10px] uppercase tracking-widest font-bold border border-outline-variant/10 hover:text-on-surface transition-colors"
            onClick={clearEvents}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Events', value: stats.total, color: 'text-on-surface' },
          { label: 'Errors', value: stats.errors, color: 'text-error' },
          { label: 'Warnings', value: stats.warnings, color: 'text-tertiary' },
          { label: 'Success', value: stats.success, color: 'text-secondary' },
        ].map((stat) => (
          <div key={stat.label} className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/10">
            <p className="font-mono text-[10px] uppercase tracking-widest text-outline font-bold">{stat.label}</p>
            <p className={cn('text-2xl font-bold mt-1 font-[\'JetBrains_Mono\']', stat.color)}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/10">
        <ActivityFilters
          severity={severityFilter}
          type={typeFilter}
          onSeverityChange={setSeverityFilter}
          onTypeChange={setTypeFilter}
        />
      </div>

      {/* Feed */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-outline-variant/10">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm text-on-surface">Live Feed</span>
            {!paused && (
              <span className="relative flex h-2 w-2 ml-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary" />
              </span>
            )}
          </div>
          <span className="font-mono text-[10px] bg-surface-container-highest text-primary px-2 py-0.5 rounded-full border border-primary/20">
            {filteredEvents.length} events
          </span>
        </div>
        <div className="divide-y divide-outline-variant/10">
          {filteredEvents.length > 0 ? (
            filteredEvents.map((event) => (
              <ActivityItem key={event.id} event={event} />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-on-surface-variant">
              <Activity className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No events match your filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
