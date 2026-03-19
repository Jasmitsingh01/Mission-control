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
import { cn } from '@/lib/utils'
import type { ActivityEvent, ActivityType, Severity } from '@/stores/activityStore'

const severityConfig: Record<Severity, { icon: React.ComponentType<{ className?: string }>; color: string; bg: string }> = {
  success: { icon: CheckCircle2, color: 'text-secondary', bg: 'bg-secondary/10' },
  info: { icon: Info, color: 'text-primary', bg: 'bg-primary/10' },
  warning: { icon: AlertTriangle, color: 'text-tertiary', bg: 'bg-tertiary/10' },
  error: { icon: XCircle, color: 'text-error', bg: 'bg-error-container/30' },
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
    <div className="flex items-start gap-3 px-4 py-3 hover:bg-surface-container/30 transition-colors group font-mono">
      {/* Severity indicator */}
      <div className={cn('mt-0.5 rounded-full p-1.5 shrink-0', severity.bg)}>
        <SeverityIcon className={cn('h-3.5 w-3.5', severity.color)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] leading-relaxed text-on-surface">{event.message}</p>
        <div className="flex items-center gap-3 mt-1.5">
          <span className="flex items-center gap-1 text-[10px] text-on-surface-variant">
            <TypeIcon className="h-3 w-3" />
            {event.type.replace(/_/g, ' ')}
          </span>
          <span className="flex items-center gap-1 text-[10px] text-on-surface-variant">
            <ActorIcon className="h-3 w-3" />
            {event.actorType}
            {event.actorId && <span className="text-primary/60">({event.actorId})</span>}
          </span>
          <span className="text-[10px] text-outline ml-auto shrink-0">
            {timeAgo(event.timestamp)}
          </span>
        </div>
      </div>

      {/* Type badge */}
      <span
        className={cn(
          "font-mono text-[9px] uppercase tracking-widest font-bold shrink-0 px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity",
          severity.bg, severity.color
        )}
      >
        {event.severity}
      </span>
    </div>
  )
}
