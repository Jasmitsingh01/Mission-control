import { useState, useEffect } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import {
  Trash2,
  Save,
  Clock,
  Bot,
  X,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Minus,
  RotateCcw,
  Square,
  CheckCircle2,
} from 'lucide-react'
import { useTaskStore } from '@/stores/taskStore'
import { STATUS_LABELS, PRIORITY_LEVELS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { Task } from '@/stores/taskStore'
import type { TaskStatus, Priority } from '@/lib/constants'

const priorityIcons: Record<Priority, React.ComponentType<{ className?: string }>> = {
  critical: AlertCircle,
  high: ArrowUp,
  medium: Minus,
  low: ArrowDown,
}

const priorityColors: Record<Priority, string> = {
  critical: 'bg-error/20 text-error border-error/30',
  high: 'bg-tertiary/20 text-tertiary border-tertiary/30',
  medium: 'bg-primary/20 text-primary border-primary/30',
  low: 'bg-surface-container-highest text-on-surface-variant border-outline-variant/20',
}

interface TaskDetailPanelProps {
  task: Task | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TaskDetailPanel({ task, open, onOpenChange }: TaskDetailPanelProps) {
  const { updateTask, deleteTask } = useTaskStore()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<TaskStatus>('inbox')
  const [priority, setPriority] = useState<Priority>('medium')
  const [labels, setLabels] = useState<string[]>([])
  const [labelInput, setLabelInput] = useState('')
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description)
      setStatus(task.status)
      setPriority(task.priority)
      setLabels([...task.labels])
      setHasChanges(false)
      setLabelInput('')
    }
  }, [task])

  if (!task) return null

  const markChanged = () => setHasChanges(true)

  const handleSave = () => {
    updateTask(task.id, { title, description, status, priority, labels })
    setHasChanges(false)
  }

  const handleDelete = () => {
    deleteTask(task.id)
    onOpenChange(false)
  }

  const addLabel = () => {
    const label = labelInput.trim().toLowerCase()
    if (label && !labels.includes(label)) {
      setLabels([...labels, label])
      setLabelInput('')
      markChanged()
    }
  }

  const removeLabel = (label: string) => {
    setLabels(labels.filter((l) => l !== label))
    markChanged()
  }

  const createdDate = new Date(task.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const updatedDate = new Date(task.updatedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto bg-surface-container-low border-l border-outline-variant/20 p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-outline-variant/10">
          <SheetTitle className="text-left pr-8 font-mono text-sm uppercase tracking-widest text-on-surface-variant">
            Task Details
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-5 px-6 py-6">
          {/* Title */}
          <div>
            <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-outline mb-2 block">
              Title
            </label>
            <Input
              value={title}
              onChange={(e) => { setTitle(e.target.value); markChanged() }}
              className="text-base font-semibold text-on-surface bg-surface-container-lowest border-outline-variant/20 focus:border-primary/50 focus:ring-primary/20"
            />
          </div>

          {/* Description */}
          <div>
            <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-outline mb-2 block">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => { setDescription(e.target.value); markChanged() }}
              rows={4}
              className="flex w-full rounded-lg border border-outline-variant/20 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 resize-none"
            />
          </div>

          {/* Status + Priority */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-outline mb-2 block">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => { setStatus(e.target.value as TaskStatus); markChanged() }}
                className="flex h-9 w-full rounded-lg border border-outline-variant/20 bg-surface-container-lowest px-3 py-1 text-sm text-on-surface focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
              >
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-outline mb-2 block">
                Priority
              </label>
              <div className="flex gap-1.5">
                {PRIORITY_LEVELS.map((p) => {
                  const Icon = priorityIcons[p]
                  return (
                    <button
                      key={p}
                      type="button"
                      className={cn(
                        "flex-1 h-9 rounded-lg text-[10px] font-mono font-bold uppercase tracking-widest flex items-center justify-center gap-1 border transition-all",
                        priority === p
                          ? priorityColors[p]
                          : 'border-outline-variant/10 bg-surface-container text-outline hover:text-on-surface-variant hover:border-outline-variant/30'
                      )}
                      onClick={() => { setPriority(p); markChanged() }}
                    >
                      <Icon className="h-3 w-3" />
                      {p}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Labels */}
          <div>
            <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-outline mb-2 block">
              Labels
            </label>
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="Add label..."
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addLabel()
                  }
                }}
                className="flex-1 bg-surface-container-lowest border-outline-variant/20 text-sm"
              />
              <button
                type="button"
                onClick={addLabel}
                className="font-mono uppercase tracking-widest text-[10px] font-bold px-3 py-2 rounded-lg border border-outline-variant/20 text-on-surface-variant hover:bg-surface-container-high transition-colors"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {labels.map((label) => (
                <span key={label} className="inline-flex items-center gap-1 font-mono text-[10px] font-bold bg-primary-container/20 text-primary px-2 py-0.5 rounded">
                  {label}
                  <button onClick={() => removeLabel(label)} className="hover:text-error transition-colors">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              {labels.length === 0 && (
                <span className="font-mono text-[10px] text-outline">No labels</span>
              )}
            </div>
          </div>

          {/* Metadata */}
          <div className="bg-surface-container p-3 rounded-lg space-y-2.5">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-outline">Metadata</span>
            {task.assignedAgentId && (
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[11px] text-on-surface-variant">
                  <Bot className="h-3 w-3 text-secondary" />
                  Assigned Agent
                </span>
                <code className="font-mono text-[10px] text-primary">{task.assignedAgentId}</code>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[11px] text-on-surface-variant">
                <Clock className="h-3 w-3 text-outline" />
                Created
              </span>
              <span className="font-mono text-[10px] text-on-surface-variant">{createdDate}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[11px] text-on-surface-variant">
                <Clock className="h-3 w-3 text-outline" />
                Updated
              </span>
              <span className="font-mono text-[10px] text-on-surface-variant">{updatedDate}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-on-surface-variant">ID</span>
              <code className="font-mono text-[10px] text-outline">{task.id}</code>
            </div>
          </div>

          {/* Live Activity Log placeholder */}
          <div className="bg-surface-container-lowest rounded-xl p-4">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-outline block mb-2">Activity Log</span>
            <div className="font-mono text-[11px] text-on-surface-variant space-y-1">
              <p className="text-outline">Task created {createdDate}</p>
              {task.assignedAgentId && (
                <p className="text-secondary">Assigned to agent <span className="text-primary">{task.assignedAgentId}</span></p>
              )}
              <p className="text-outline">Last updated {updatedDate}</p>
            </div>
          </div>

          {/* Action buttons - 3-column grid */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className={cn(
                "font-mono uppercase tracking-widest text-[10px] font-bold py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all",
                hasChanges
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
                  : 'bg-surface-container text-outline border border-outline-variant/10 cursor-not-allowed'
              )}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Approve
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className={cn(
                "font-mono uppercase tracking-widest text-[10px] font-bold py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all",
                hasChanges
                  ? 'bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30'
                  : 'bg-surface-container text-outline border border-outline-variant/10 cursor-not-allowed'
              )}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Retry
            </button>
            <button
              onClick={handleDelete}
              className="font-mono uppercase tracking-widest text-[10px] font-bold py-2.5 rounded-lg flex items-center justify-center gap-1.5 bg-error/20 text-error border border-error/30 hover:bg-error/30 transition-all"
            >
              <Square className="h-3.5 w-3.5" />
              Stop
            </button>
          </div>

          {/* Secondary actions */}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className={cn(
                "flex-1 font-mono uppercase tracking-widest text-[10px] font-bold py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all",
                hasChanges
                  ? 'synthetic-gradient text-white hover:opacity-90'
                  : 'bg-surface-container text-outline border border-outline-variant/10 cursor-not-allowed'
              )}
            >
              <Save className="h-3.5 w-3.5" />
              Save Changes
            </button>
            <button
              onClick={handleDelete}
              className="font-mono uppercase tracking-widest text-[10px] font-bold px-3 py-2.5 rounded-lg bg-error-container/20 text-error border border-error/30 hover:bg-error-container/30 transition-all"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
