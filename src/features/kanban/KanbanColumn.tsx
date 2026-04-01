import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TaskCard } from './TaskCard'
import { STATUS_LABELS, STATUS_DOT_COLORS } from '@/lib/constants'
import type { TaskStatus } from '@/lib/constants'
import type { Task } from '@/stores/taskStore'

interface KanbanColumnProps {
  status: TaskStatus
  tasks: Task[]
  onTaskClick: (task: Task) => void
  onAddTask: (status: TaskStatus) => void
  columnIndex?: number
}

export function KanbanColumn({ status, tasks, onTaskClick, onAddTask, columnIndex = 0 }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${status}`,
    data: { type: 'column', status },
  })

  const sortedTasks = [...tasks].sort((a, b) => a.position - b.position)
  const taskIds = sortedTasks.map(t => t.id)
  const dotColor = STATUS_DOT_COLORS[status]

  return (
    <div
      className="flex h-full min-w-[190px] flex-1 flex-col max-h-full animate-fade-in"
      style={{ animationDelay: `${columnIndex * 0.04}s` }}
    >
      {/* Column Header */}
      <div className="flex items-center gap-2 px-2 py-1.5 shrink-0">
        <span className="w-[6px] h-[6px] rounded-full shrink-0" style={{ background: dotColor }} />
        <span className="text-[0.58rem] font-bold tracking-[0.08em] uppercase text-[#71695e]">
          {STATUS_LABELS[status]}
        </span>
        <span className="text-[0.55rem] font-semibold text-[#a19a8f] bg-[#f0ece5] px-[6px] py-px rounded-md ml-auto tabular-nums">
          {tasks.length}
        </span>
        <button
          className="h-5 w-5 flex items-center justify-center rounded text-[#c5c0b8] hover:text-[#1a1a1a] hover:bg-[#f4f1eb] transition-all"
          onClick={() => onAddTask(status)}
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>

      {/* Cards */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 px-[2px] pb-1 overflow-y-auto flex flex-col gap-[4px] min-h-[40px] rounded transition-colors',
          isOver && 'bg-[#2d9a4e]/[0.04] outline-2 outline-dashed outline-[#2d9a4e]/20 -outline-offset-2'
        )}
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {sortedTasks.map((task, i) => (
            <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} index={i} />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <button
            onClick={() => onAddTask(status)}
            className="flex flex-col items-center justify-center h-20 rounded-[10px] border border-dashed border-[#e6e2da] text-[#c5c0b8] hover:border-[#d4870b]/30 hover:text-[#d4870b]/60 hover:bg-[#d4870b]/[0.02] transition-all cursor-pointer gap-1"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="text-[0.52rem] font-semibold tracking-[0.06em] uppercase">Add task</span>
          </button>
        )}
      </div>
    </div>
  )
}
