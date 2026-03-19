import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Calendar, Bot, AlertCircle, ArrowUp, ArrowDown, Minus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Task } from '@/stores/taskStore'
import type { Priority } from '@/lib/constants'

const priorityConfig: Record<Priority, { icon: React.ComponentType<{ className?: string }>; color: string; label: string }> = {
  critical: { icon: AlertCircle, color: 'text-red-400', label: 'Critical' },
  high: { icon: ArrowUp, color: 'text-orange-400', label: 'High' },
  medium: { icon: Minus, color: 'text-yellow-400', label: 'Medium' },
  low: { icon: ArrowDown, color: 'text-muted-foreground', label: 'Low' },
}

interface TaskCardProps {
  task: Task
  onClick: () => void
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { type: 'task', task },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const PriorityIcon = priorityConfig[task.priority].icon

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group rounded-lg border border-border bg-card p-3 shadow-sm transition-all hover:shadow-md hover:border-primary/30 cursor-pointer',
        isDragging && 'opacity-50 shadow-lg rotate-2 scale-105'
      )}
      onClick={onClick}
    >
      {/* Drag handle + Priority */}
      <div className="flex items-center gap-2 mb-2">
        <button
          className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing touch-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
        <PriorityIcon className={cn('h-3.5 w-3.5', priorityConfig[task.priority].color)} />
        <span className={cn('text-[10px] font-medium uppercase tracking-wider', priorityConfig[task.priority].color)}>
          {task.priority}
        </span>
      </div>

      {/* Title */}
      <h4 className="text-sm font-medium leading-snug mb-2 line-clamp-2">
        {task.title}
      </h4>

      {/* Labels */}
      {task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.labels.map((label) => (
            <Badge
              key={label}
              variant="secondary"
              className="text-[10px] px-1.5 py-0 h-5"
            >
              {label}
            </Badge>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <div className="flex items-center gap-2">
          {task.dueDate && (
            <span className={cn(
              'flex items-center gap-1',
              task.dueDate < Date.now() && 'text-red-400'
            )}>
              <Calendar className="h-3 w-3" />
              {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>
        {task.assignedAgentId && (
          <span className="flex items-center gap-1 text-primary/70">
            <Bot className="h-3 w-3" />
            Agent
          </span>
        )}
      </div>
    </div>
  )
}

export function TaskCardOverlay({ task }: { task: Task }) {
  const PriorityIcon = priorityConfig[task.priority].icon

  return (
    <div className="w-64 rounded-lg border border-primary/50 bg-card p-3 shadow-xl rotate-3 scale-105">
      <div className="flex items-center gap-2 mb-2">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
        <PriorityIcon className={cn('h-3.5 w-3.5', priorityConfig[task.priority].color)} />
        <span className={cn('text-[10px] font-medium uppercase tracking-wider', priorityConfig[task.priority].color)}>
          {task.priority}
        </span>
      </div>
      <h4 className="text-sm font-medium leading-snug line-clamp-2">{task.title}</h4>
    </div>
  )
}
