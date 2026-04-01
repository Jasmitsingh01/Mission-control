import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X } from 'lucide-react'
import { useTaskStore } from '@/stores/taskStore'
import { PRIORITY_LEVELS, STATUS_LABELS, AGENTS } from '@/lib/constants'
import type { TaskStatus, Priority } from '@/lib/constants'

interface CreateTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultStatus: TaskStatus
}

export function CreateTaskDialog({ open, onOpenChange, defaultStatus }: CreateTaskDialogProps) {
  const addTask = useTaskStore((s) => s.addTask)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [status, setStatus] = useState<TaskStatus>(defaultStatus)
  const [assignee, setAssignee] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])

  const reset = () => {
    setTitle('')
    setDescription('')
    setPriority('medium')
    setStatus(defaultStatus)
    setAssignee('')
    setTagInput('')
    setTags([])
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    addTask({
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      assignee: assignee || null,
      assignedAgentId: null,
      labels: [],
      tags,
      dueDate: null,
      progress: 0,
      subtasks: [0, Math.floor(Math.random() * 8 + 3)],
      comments: 0,
      commits: 0,
    })
    reset()
    onOpenChange(false)
  }

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase()
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag])
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white border-[#e6e2da]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-[1rem] font-bold text-[#1a1a1a]">Create Mission</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {/* Title */}
            <div>
              <label className="text-[0.7rem] font-semibold text-[#71695e] mb-1 block">Title</label>
              <Input
                placeholder="e.g. Implement Stripe webhook handler"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
                className="border-[#e6e2da] bg-[#faf8f3] text-[0.78rem] focus:border-[#d4870b]"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-[0.7rem] font-semibold text-[#71695e] mb-1 block">Description</label>
              <textarea
                placeholder="Detailed description of the task..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="flex w-full rounded-md border border-[#e6e2da] bg-[#faf8f3] px-3 py-2 text-[0.78rem] text-[#1a1a1a] placeholder:text-[#a19a8f] focus:outline-none focus:border-[#d4870b] resize-none"
              />
            </div>

            {/* Assignee + Priority row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[0.7rem] font-semibold text-[#71695e] mb-1 block">Assignee</label>
                <select
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-[#e6e2da] bg-[#faf8f3] px-3 py-1 text-[0.78rem] text-[#1a1a1a] focus:outline-none focus:border-[#d4870b]"
                >
                  <option value="">Unassigned</option>
                  {AGENTS.map((a) => (
                    <option key={a.id} value={a.id}>{a.name} ({a.role})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[0.7rem] font-semibold text-[#71695e] mb-1 block">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="flex h-9 w-full rounded-md border border-[#e6e2da] bg-[#faf8f3] px-3 py-1 text-[0.78rem] text-[#1a1a1a] focus:outline-none focus:border-[#d4870b] capitalize"
                >
                  {PRIORITY_LEVELS.map((p) => (
                    <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Status + Tags row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[0.7rem] font-semibold text-[#71695e] mb-1 block">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TaskStatus)}
                  className="flex h-9 w-full rounded-md border border-[#e6e2da] bg-[#faf8f3] px-3 py-1 text-[0.78rem] text-[#1a1a1a] focus:outline-none focus:border-[#d4870b]"
                >
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[0.7rem] font-semibold text-[#71695e] mb-1 block">Tags</label>
                <Input
                  placeholder="api, backend, urgent"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); addTag() }
                    if (e.key === ',') { e.preventDefault(); addTag() }
                  }}
                  className="border-[#e6e2da] bg-[#faf8f3] text-[0.78rem] focus:border-[#d4870b]"
                />
              </div>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 text-[0.55rem] font-medium bg-[#f0ece5] border border-[#eeebe4] text-[#6b6560] px-2 py-0.5 rounded-[3px]">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)}>
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="text-[#71695e]">
              Cancel
            </Button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="bg-[#1a1a1a] text-white text-[0.78rem] font-semibold px-4 py-2 rounded-md hover:opacity-85 transition-opacity disabled:opacity-40"
            >
              ⚡ Create Mission
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
