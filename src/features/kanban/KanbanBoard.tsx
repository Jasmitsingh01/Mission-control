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
import { useAgentStore } from '@/stores/agentStore'
import { TASK_STATUSES, AGENT_MAP } from '@/lib/constants'
import type { TaskStatus } from '@/lib/constants'
import type { Task } from '@/stores/taskStore'
import { KanbanColumn } from './KanbanColumn'
import { TaskCardOverlay } from './TaskCard'
import { TaskDetailPanel } from './TaskDetailPanel'
import { CreateTaskDialog } from './CreateTaskDialog'

export function KanbanBoard() {
  const { tasks, moveTask } = useTaskStore()
  const agents = useAgentStore((s) => s.agents)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [createStatus, setCreateStatus] = useState<TaskStatus>('backlog')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = {
      backlog: [], todo: [], inprogress: [], review: [], done: [],
    }
    for (const task of tasks) {
      if (grouped[task.status]) grouped[task.status].push(task)
    }
    return grouped
  }, [tasks])

  // Dynamic stats derived from real data
  const totalActive = useMemo(() => tasks.filter(t => t.status !== 'done').length, [tasks])
  const runningAgents = useMemo(() => agents.filter(a => a.status === 'running').length, [agents])

  // Calculate velocity: tasks completed in last 7 days
  const velocity = useMemo(() => {
    const weekAgo = Date.now() - 7 * 864e5
    const recentDone = tasks.filter(t => t.status === 'done' && t.updatedAt > weekAgo).length
    return (recentDone / 7).toFixed(1)
  }, [tasks])

  // Unique assignees actively working
  const activeAssignees = useMemo(() => {
    const ids = new Set(tasks.filter(t => t.status === 'inprogress' && t.assignee).map(t => t.assignee!))
    return ids.size
  }, [tasks])

  const findTaskById = useCallback(
    (id: string) => tasks.find((t) => t.id === id) ?? null, [tasks]
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveTask(findTaskById(event.active.id as string))
  }, [findTaskById])

  const handleDragOver = useCallback((_event: DragOverEvent) => {}, [])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveTask(null)
    const { active, over } = event
    if (!over) return
    const taskId = active.id as string
    const task = findTaskById(taskId)
    if (!task) return

    let targetStatus: TaskStatus | null = null
    if (over.data.current?.type === 'column') targetStatus = over.data.current.status as TaskStatus
    else if (over.data.current?.type === 'task') targetStatus = (over.data.current.task as Task).status
    else if (typeof over.id === 'string' && over.id.startsWith('column-')) targetStatus = over.id.replace('column-', '') as TaskStatus

    if (!targetStatus || targetStatus === task.status) return
    const targetTasks = tasksByStatus[targetStatus]
    const maxPosition = targetTasks.length > 0 ? Math.max(...targetTasks.map(t => t.position)) + 1 : 0
    moveTask(taskId, targetStatus, maxPosition)
  }, [findTaskById, tasksByStatus, moveTask])

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
      {/* Kanban Sub-header — dynamic stats */}
      <div className="flex items-center justify-between px-4 py-2 shrink-0 border-b border-[#eeebe4]/60">
        <div className="flex items-center gap-2">
          <span className="w-[6px] h-[6px] rounded-full bg-[#d4870b]" />
          <span className="text-[0.62rem] font-bold tracking-[0.1em] uppercase text-[#71695e]">
            Mission Queue
          </span>
        </div>
        <div className="flex gap-1.5">
          {activeAssignees > 0 && (
            <span className="text-[0.58rem] font-semibold text-[#71695e] bg-[#f4f1eb] border border-[#e6e2da] px-2 py-[2px] rounded-md">
              {activeAssignees} working
            </span>
          )}
          <span className="text-[0.58rem] font-semibold text-[#71695e] bg-[#f4f1eb] border border-[#e6e2da] px-2 py-[2px] rounded-md tabular-nums">
            {totalActive} active
          </span>
          {runningAgents > 0 && (
            <span className="text-[0.58rem] font-semibold text-[#3b7dd8] bg-[#3b7dd8]/8 border border-[#3b7dd8]/15 px-2 py-[2px] rounded-md tabular-nums">
              {runningAgents} agents
            </span>
          )}
          <span className="text-[0.58rem] font-semibold text-[#71695e] bg-[#f4f1eb] border border-[#e6e2da] px-2 py-[2px] rounded-md tabular-nums">
            {velocity} tasks/day
          </span>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-1.5 px-2.5 py-2 flex-1 overflow-x-auto overflow-y-hidden min-h-0">
          {TASK_STATUSES.map((status, i) => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={tasksByStatus[status]}
              onTaskClick={handleTaskClick}
              onAddTask={handleAddTask}
              columnIndex={i}
            />
          ))}
        </div>
        <DragOverlay dropAnimation={null}>
          {activeTask ? <TaskCardOverlay task={activeTask} /> : null}
        </DragOverlay>
      </DndContext>

      <TaskDetailPanel task={selectedTask} open={detailOpen} onOpenChange={setDetailOpen} />
      <CreateTaskDialog open={createOpen} onOpenChange={setCreateOpen} defaultStatus={createStatus} />
    </>
  )
}
