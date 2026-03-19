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
import { Badge } from '@/components/ui/badge'
import { useJobStore } from '@/stores/jobStore'
import { useAgentStore } from '@/stores/agentStore'
import { PRIORITY_LEVELS } from '@/lib/constants'
import type { Priority } from '@/lib/constants'

const cronPresets = [
  { label: 'Every minute', cron: '* * * * *', human: 'Every minute' },
  { label: 'Every 5 min', cron: '*/5 * * * *', human: 'Every 5 minutes' },
  { label: 'Every 15 min', cron: '*/15 * * * *', human: 'Every 15 minutes' },
  { label: 'Hourly', cron: '0 * * * *', human: 'Every hour' },
  { label: 'Every 6h', cron: '0 */6 * * *', human: 'Every 6 hours' },
  { label: 'Daily midnight', cron: '0 0 * * *', human: 'Daily at midnight' },
  { label: 'Daily 9 AM', cron: '0 9 * * *', human: 'Daily at 9:00 AM' },
  { label: 'Weekly Sun', cron: '0 0 * * 0', human: 'Weekly on Sunday' },
  { label: 'Weekdays 9 AM', cron: '0 9 * * 1-5', human: 'Weekdays at 9:00 AM' },
]

interface CreateJobDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateJobDialog({ open, onOpenChange }: CreateJobDialogProps) {
  const addJob = useJobStore((s) => s.addJob)
  const agents = useAgentStore((s) => s.agents)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [cronExpression, setCronExpression] = useState('0 * * * *')
  const [cronHuman, setCronHuman] = useState('Every hour')
  const [priority, setPriority] = useState<Priority>('medium')
  const [targetAgentId, setTargetAgentId] = useState<string>('')

  const reset = () => {
    setName('')
    setDescription('')
    setCronExpression('0 * * * *')
    setCronHuman('Every hour')
    setPriority('medium')
    setTargetAgentId('')
  }

  const handlePreset = (cron: string, human: string) => {
    setCronExpression(cron)
    setCronHuman(human)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    addJob({
      name: name.trim(),
      description: description.trim(),
      cronExpression,
      cronHuman,
      targetAgentId: targetAgentId || null,
      priority,
      enabled: true,
      lastRunAt: null,
      nextRunAt: Date.now() + 3600000,
      status: 'scheduled',
      errorMessage: null,
    })
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Scheduled Job</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Job Name</label>
              <Input placeholder="e.g., Database Backup" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Description</label>
              <textarea
                placeholder="What does this job do?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              />
            </div>

            {/* Cron */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">Schedule</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {cronPresets.map((p) => (
                  <Badge
                    key={p.cron}
                    variant={cronExpression === p.cron ? 'default' : 'outline'}
                    className="cursor-pointer text-[11px]"
                    onClick={() => handlePreset(p.cron, p.human)}
                  >
                    {p.label}
                  </Badge>
                ))}
              </div>
              <Input
                placeholder="* * * * *"
                value={cronExpression}
                onChange={(e) => setCronExpression(e.target.value)}
                className="font-mono text-sm"
              />
              <p className="text-[11px] text-muted-foreground mt-1">{cronHuman}</p>
            </div>

            {/* Priority + Agent */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm capitalize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {PRIORITY_LEVELS.map((p) => (
                    <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Target Agent</label>
                <select
                  value={targetAgentId}
                  onChange={(e) => setTargetAgentId(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">System (no agent)</option>
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={!name.trim()}>Create Job</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
