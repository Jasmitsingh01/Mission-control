import { useState, useCallback, useMemo } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import { useTaskStore } from '@/stores/taskStore'
import { TASK_STATUSES } from '@/lib/constants'
import type { TaskStatus } from '@/lib/constants'
import type { Task } from '@/stores/taskStore'
import { KanbanColumn } from './KanbanColumn'
import { TaskCardOverlay } from './TaskCard'
import { TaskDetailPanel } from './TaskDetailPanel'
import { CreateTaskDialog } from './CreateTaskDialog'

export function KanbanBoard() {
  const { tasks, moveTask } = useTaskStore()
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [createStatus, setCreateStatus] = useState<TaskStatus>('inbox')

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = {
      planning: [],
      inbox: [],
      assigned: [],
      in_progress: [],
      testing: [],
      review: [],
      done: [],
    }
    for (const task of tasks) {
      grouped[task.status].push(task)
    }
    return grouped
  }, [tasks])

  const findTaskById = useCallback(
    (id: string) => tasks.find((t) => t.id === id) ?? null,
    [tasks]
  )

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const task = findTaskById(event.active.id as string)
      setActiveTask(task)
    },
    [findTaskById]
  )

  const handleDragOver = useCallback((_event: DragOverEvent) => {
    // Visual feedback handled by useDroppable isOver state
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveTask(null)
      const { active, over } = event
      if (!over) return

      const taskId = active.id as string
      const task = findTaskById(taskId)
      if (!task) return

      let targetStatus: TaskStatus | null = null

      // Dropped on a column
      if (over.data.current?.type === 'column') {
        targetStatus = over.data.current.status as TaskStatus
      }
      // Dropped on another task
      else if (over.data.current?.type === 'task') {
        const overTask = over.data.current.task as Task
        targetStatus = overTask.status
      }
      // Dropped on a column ID string
      else if (typeof over.id === 'string' && over.id.startsWith('column-')) {
        targetStatus = over.id.replace('column-', '') as TaskStatus
      }

      if (!targetStatus) return
      if (targetStatus === task.status) return

      // Calculate new position (append to end of target column)
      const targetTasks = tasksByStatus[targetStatus]
      const maxPosition = targetTasks.length > 0
        ? Math.max(...targetTasks.map((t) => t.position)) + 1
        : 0

      moveTask(taskId, targetStatus, maxPosition)
    },
    [findTaskById, tasksByStatus, moveTask]
  )

  const handleTaskClick = useCallback((task: Task) => {
    setSelectedTask(task)
    setDetailOpen(true)
  }, [])

  const handleAddTask = useCallback((status: TaskStatus) => {
    setCreateStatus(status)
    setCreateOpen(true)
  }, [])

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6 overflow-x-auto pb-6 h-[calc(100vh-13rem)]">
          {TASK_STATUSES.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={tasksByStatus[status]}
              onTaskClick={handleTaskClick}
              onAddTask={handleAddTask}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeTask ? <TaskCardOverlay task={activeTask} /> : null}
        </DragOverlay>
      </DndContext>

      <TaskDetailPanel
        task={selectedTask}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />

      <CreateTaskDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultStatus={createStatus}
      />
    </>
  )
}
