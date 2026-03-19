import { useState, useMemo } from 'react'
import { Activity, Trash2, Pause, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Activity Feed</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Real-time log of all agent actions, task updates, and system events
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPaused(!paused)}
          >
            {paused ? <Play className="h-4 w-4 mr-2" /> : <Pause className="h-4 w-4 mr-2" />}
            {paused ? 'Resume' : 'Pause'}
          </Button>
          <Button variant="outline" size="sm" onClick={clearEvents}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Events', value: stats.total, color: 'text-foreground' },
          { label: 'Errors', value: stats.errors, color: 'text-red-400' },
          { label: 'Warnings', value: stats.warnings, color: 'text-yellow-400' },
          { label: 'Success', value: stats.success, color: 'text-green-400' },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-4 pb-3 px-4">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-3">
          <ActivityFilters
            severity={severityFilter}
            type={typeFilter}
            onSeverityChange={setSeverityFilter}
            onTypeChange={setTypeFilter}
          />
        </CardContent>
      </Card>

      {/* Feed */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Live Feed
              {!paused && (
                <span className="flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
              )}
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              {filteredEvents.length} events
            </Badge>
          </div>
        </CardHeader>
        <Separator />
        <div>
          <div className="divide-y divide-border/50">
            {filteredEvents.length > 0 ? (
              filteredEvents.map((event) => (
                <ActivityItem key={event.id} event={event} />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Activity className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">No events match your filters</p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
