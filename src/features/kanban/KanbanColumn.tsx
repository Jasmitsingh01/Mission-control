import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { TaskCard } from './TaskCard'
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/constants'
import type { TaskStatus } from '@/lib/constants'
import type { Task } from '@/stores/taskStore'

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
        'flex h-full w-72 shrink-0 flex-col rounded-xl border border-border bg-muted/30 transition-colors',
        isOver && 'border-primary/50 bg-primary/5'
      )}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className={cn('text-xs font-medium', STATUS_COLORS[status])}>
            {STATUS_LABELS[status]}
          </Badge>
          <span className="text-xs text-muted-foreground font-medium">
            {tasks.length}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => onAddTask(status)}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Cards */}
      <ScrollArea className="flex-1 px-2 py-2">
        <div ref={setNodeRef} className="flex flex-col gap-2 min-h-[60px]">
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
            <div className="flex items-center justify-center h-20 rounded-lg border border-dashed border-border text-xs text-muted-foreground">
              Drop tasks here
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
