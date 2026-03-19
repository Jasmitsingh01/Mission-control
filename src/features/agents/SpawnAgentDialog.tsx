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
import { useAgentStore } from '@/stores/agentStore'
import type { Provider } from '@/stores/agentStore'

const providerModels: Record<Provider, string[]> = {
  anthropic: ['claude-opus-4-20250514', 'claude-sonnet-4-20250514', 'claude-haiku-4-5-20251001'],
  openai: ['gpt-4o', 'gpt-4o-mini', 'o3-mini'],
  google: ['gemini-2.5-pro', 'gemini-2.0-flash'],
  local: ['llama-3.1-70b', 'mistral-large', 'codestral'],
  custom: ['custom-model'],
}

interface SpawnAgentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SpawnAgentDialog({ open, onOpenChange }: SpawnAgentDialogProps) {
  const addAgent = useAgentStore((s) => s.addAgent)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [provider, setProvider] = useState<Provider>('anthropic')
  const [model, setModel] = useState(providerModels.anthropic[1])
  const [temperature, setTemperature] = useState(0.5)
  const [maxTokens, setMaxTokens] = useState(4096)
  const [systemPrompt, setSystemPrompt] = useState('')
  const [autoStart, setAutoStart] = useState(true)

  const reset = () => {
    setName('')
    setDescription('')
    setProvider('anthropic')
    setModel(providerModels.anthropic[1])
    setTemperature(0.5)
    setMaxTokens(4096)
    setSystemPrompt('')
    setAutoStart(true)
  }

  const handleProviderChange = (p: Provider) => {
    setProvider(p)
    setModel(providerModels[p][0])
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    addAgent({
      name: name.trim(),
      description: description.trim(),
      status: autoStart ? 'running' : 'idle',
      provider,
      model,
      config: { temperature, maxTokens, systemPrompt },
      enabledSkills: [],
      lastActiveAt: autoStart ? Date.now() : null,
      errorMessage: null,
      tasksAssigned: 0,
    })
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Spawn New Agent</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Agent Name</label>
              <Input
                placeholder="e.g., Code Review Agent"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Description</label>
              <textarea
                placeholder="What does this agent do?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              />
            </div>

            {/* Provider */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">Provider</label>
              <div className="flex gap-2 flex-wrap">
                {(Object.keys(providerModels) as Provider[]).map((p) => (
                  <Badge
                    key={p}
                    variant={provider === p ? 'default' : 'outline'}
                    className="cursor-pointer capitalize"
                    onClick={() => handleProviderChange(p)}
                  >
                    {p}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Model */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">Model</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {providerModels[provider].map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* Temperature + Max Tokens */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Temperature: {temperature}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Max Tokens</label>
                <Input
                  type="number"
                  min={256}
                  max={32768}
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value) || 4096)}
                />
              </div>
            </div>

            {/* System Prompt */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">System Prompt</label>
              <textarea
                placeholder="Instructions for the agent..."
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              />
            </div>

            {/* Auto-start */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoStart}
                onChange={(e) => setAutoStart(e.target.checked)}
                className="rounded accent-primary"
              />
              <span className="text-sm">Start agent immediately after creation</span>
            </label>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              Spawn Agent
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
