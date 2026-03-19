import {
  CheckCircle2,
  Info,
  AlertTriangle,
  XCircle,
  Bot,
  User,
  Cpu,
  ArrowRight,
  Plus,
  Pencil,
  Play,
  Square,
  Zap,
  Brain,
  Server,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { ActivityEvent, ActivityType, Severity } from '@/stores/activityStore'

const severityConfig: Record<Severity, { icon: React.ComponentType<{ className?: string }>; color: string; bg: string }> = {
  success: { icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-500/10' },
  info: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  warning: { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  error: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
}

const typeIcons: Record<ActivityType, React.ComponentType<{ className?: string }>> = {
  task_created: Plus,
  task_moved: ArrowRight,
  task_updated: Pencil,
  agent_spawned: Play,
  agent_stopped: Square,
  agent_error: XCircle,
  job_started: Play,
  job_completed: CheckCircle2,
  job_failed: XCircle,
  skill_triggered: Zap,
  memory_written: Brain,
  system: Server,
}

const actorIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  user: User,
  agent: Bot,
  system: Cpu,
}

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

interface ActivityItemProps {
  event: ActivityEvent
}

export function ActivityItem({ event }: ActivityItemProps) {
  const severity = severityConfig[event.severity]
  const SeverityIcon = severity.icon
  const TypeIcon = typeIcons[event.type]
  const ActorIcon = actorIcons[event.actorType]

  return (
    <div className="flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition-colors rounded-lg group">
      {/* Severity indicator */}
      <div className={cn('mt-0.5 rounded-full p-1.5 shrink-0', severity.bg)}>
        <SeverityIcon className={cn('h-3.5 w-3.5', severity.color)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm leading-relaxed">{event.message}</p>
        <div className="flex items-center gap-3 mt-1.5">
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <TypeIcon className="h-3 w-3" />
            {event.type.replace(/_/g, ' ')}
          </span>
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <ActorIcon className="h-3 w-3" />
            {event.actorType}
            {event.actorId && <span className="text-primary/60">({event.actorId})</span>}
          </span>
          <span className="text-[11px] text-muted-foreground ml-auto shrink-0">
            {timeAgo(event.timestamp)}
          </span>
        </div>
      </div>

      {/* Type badge */}
      <Badge
        variant="secondary"
        className={cn('text-[10px] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity', severity.bg, severity.color)}
      >
        {event.severity}
      </Badge>
    </div>
  )
}
