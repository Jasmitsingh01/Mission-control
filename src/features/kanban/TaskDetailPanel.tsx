import { useState, useEffect } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
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
} from 'lucide-react'
import { useTaskStore } from '@/stores/taskStore'
import { STATUS_LABELS, STATUS_COLORS, PRIORITY_LEVELS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { Task } from '@/stores/taskStore'
import type { TaskStatus, Priority } from '@/lib/constants'

const priorityIcons: Record<Priority, React.ComponentType<{ className?: string }>> = {
  critical: AlertCircle,
  high: ArrowUp,
  medium: Minus,
  low: ArrowDown,
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
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-left pr-8">Task Details</SheetTitle>
        </SheetHeader>

        <div className="space-y-5 mt-6">
          {/* Title */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Title
            </label>
            <Input
              value={title}
              onChange={(e) => { setTitle(e.target.value); markChanged() }}
              className="text-base font-medium"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => { setDescription(e.target.value); markChanged() }}
              rows={4}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
          </div>

          {/* Status + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => { setStatus(e.target.value as TaskStatus); markChanged() }}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                Priority
              </label>
              <div className="flex gap-1">
                {PRIORITY_LEVELS.map((p) => {
                  const Icon = priorityIcons[p]
                  return (
                    <Button
                      key={p}
                      type="button"
                      variant={priority === p ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1 h-9 text-xs capitalize"
                      onClick={() => { setPriority(p); markChanged() }}
                    >
                      <Icon className="h-3 w-3 mr-1" />
                      {p}
                    </Button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Labels */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
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
                className="flex-1"
              />
              <Button type="button" variant="secondary" size="sm" onClick={addLabel}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {labels.map((label) => (
                <Badge key={label} variant="secondary" className="gap-1 pr-1">
                  {label}
                  <button onClick={() => removeLabel(label)}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {labels.length === 0 && (
                <span className="text-xs text-muted-foreground">No labels</span>
              )}
            </div>
          </div>

          <Separator />

          {/* Metadata */}
          <div className="space-y-2 text-xs text-muted-foreground">
            {task.assignedAgentId && (
              <div className="flex items-center gap-2">
                <Bot className="h-3.5 w-3.5" />
                <span>Assigned to Agent <code className="text-primary/70">{task.assignedAgentId}</code></span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5" />
              <span>Created {createdDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5" />
              <span>Updated {updatedDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className={cn('text-[10px]', STATUS_COLORS[task.status])}>
                {STATUS_LABELS[task.status]}
              </Badge>
              <span className="text-muted-foreground">ID: {task.id}</span>
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={!hasChanges}
              className="flex-1"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
            <Button variant="destructive" size="icon" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
