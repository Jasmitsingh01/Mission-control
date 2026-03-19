import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TaskCard } from './TaskCard'
import { STATUS_LABELS } from '@/lib/constants'
import type { TaskStatus } from '@/lib/constants'
import type { Task } from '@/stores/taskStore'

const columnHeaderColors: Record<TaskStatus, string> = {
  planning: 'text-primary',
  inbox: 'text-on-surface-variant',
  assigned: 'text-tertiary',
  in_progress: 'text-secondary',
  testing: 'text-tertiary',
  review: 'text-primary',
  done: 'text-green-400',
}

interface KanbanColumnProps {
  status: TaskStatus
  tasks: Task[]
  onTaskClick: (task: Task) => void
  onAddTask: (status: TaskStatus) => void
}

export function KanbanColumn({ status, tasks, onTaskClick, onAddTask }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${status}`,
    data: { type: 'column', status },
  })

  const sortedTasks = [...tasks].sort((a, b) => a.position - b.position)
  const taskIds = sortedTasks.map((t) => t.id)

  return (
    <div
      className={cn(
        'flex h-full w-80 shrink-0 flex-col rounded-xl bg-surface-container/50 transition-all',
        isOver && 'bg-primary/5 ring-1 ring-primary/30'
      )}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-outline-variant/10">
        <div className="flex items-center gap-2.5">
          <span className={cn(
            "font-mono text-xs font-bold uppercase tracking-widest",
            columnHeaderColors[status]
          )}>
            {STATUS_LABELS[status]}
          </span>
          <span className="text-[10px] bg-surface-container-highest px-1.5 py-0.5 rounded font-mono font-bold text-on-surface-variant">
            {tasks.length}
          </span>
        </div>
        <button
          className="h-7 w-7 flex items-center justify-center rounded-md text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors"
          onClick={() => onAddTask(status)}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        <div ref={setNodeRef} className="flex flex-col gap-2.5 min-h-[60px]">
          <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
            {sortedTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={() => onTaskClick(task)}
              />
            ))}
          </SortableContext>

          {tasks.length === 0 && (
            <div className="flex items-center justify-center h-24 rounded-xl border border-dashed border-outline-variant/20 text-[10px] font-mono uppercase tracking-widest text-outline">
              Drop tasks here
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
