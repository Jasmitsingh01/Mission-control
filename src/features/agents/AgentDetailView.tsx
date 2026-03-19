import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent } from '@/components/ui/card'
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Trash2,
  Clock,
  Cpu,
  Thermometer,
  FileText,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAgentStore } from '@/stores/agentStore'
import type { Agent, AgentStatus } from '@/stores/agentStore'

const statusColors: Record<AgentStatus, string> = {
  running: 'bg-green-500/20 text-green-400',
  idle: 'bg-muted text-muted-foreground',
  paused: 'bg-yellow-500/20 text-yellow-400',
  stopped: 'bg-muted text-muted-foreground',
  error: 'bg-red-500/20 text-red-400',
}

function formatDuration(ms: number): string {
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  if (h > 24) return `${Math.floor(h / 24)}d ${h % 24}h ${m}m`
  return `${h}h ${m}m`
}

interface AgentDetailViewProps {
  agent: Agent | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AgentDetailView({ agent, open, onOpenChange }: AgentDetailViewProps) {
  const { setAgentStatus, deleteAgent } = useAgentStore()

  if (!agent) return null

  const handleDelete = () => {
    deleteAgent(agent.id)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{agent.name}</SheetTitle>
        </SheetHeader>

        <div className="space-y-5 mt-6">
          {/* Status + Controls */}
          <div className="flex items-center gap-2">
            <Badge className={cn('text-xs', statusColors[agent.status])}>
              {agent.status}
            </Badge>
            <div className="flex gap-1 ml-auto">
              {agent.status !== 'running' && (
                <Button size="sm" variant="outline" onClick={() => setAgentStatus(agent.id, 'running')}>
                  <Play className="h-3.5 w-3.5 mr-1" /> Start
                </Button>
              )}
              {agent.status === 'running' && (
                <Button size="sm" variant="outline" onClick={() => setAgentStatus(agent.id, 'paused')}>
                  <Pause className="h-3.5 w-3.5 mr-1" /> Pause
                </Button>
              )}
              {agent.status !== 'stopped' && (
                <Button size="sm" variant="outline" onClick={() => setAgentStatus(agent.id, 'stopped')}>
                  <Square className="h-3.5 w-3.5 mr-1" /> Stop
                </Button>
              )}
              {agent.status === 'error' && (
                <Button size="sm" variant="outline" onClick={() => setAgentStatus(agent.id, 'running')}>
                  <RotateCcw className="h-3.5 w-3.5 mr-1" /> Restart
                </Button>
              )}
            </div>
          </div>

          <p className="text-sm text-muted-foreground">{agent.description}</p>

          {/* Error */}
          {agent.errorMessage && (
            <div className="rounded-md bg-red-500/10 border border-red-500/20 px-3 py-2">
              <p className="text-sm text-red-400">{agent.errorMessage}</p>
            </div>
          )}

          <Separator />

          {/* Model Config */}
          <div>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Model Configuration</h3>
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="pt-3 pb-3 px-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Cpu className="h-3.5 w-3.5" /> Provider
                  </div>
                  <p className="text-sm font-medium capitalize">{agent.provider}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-3 pb-3 px-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <FileText className="h-3.5 w-3.5" /> Model
                  </div>
                  <p className="text-sm font-mono text-xs">{agent.model}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-3 pb-3 px-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Thermometer className="h-3.5 w-3.5" /> Temperature
                  </div>
                  <p className="text-sm font-medium">{agent.config.temperature}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-3 pb-3 px-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <FileText className="h-3.5 w-3.5" /> Max Tokens
                  </div>
                  <p className="text-sm font-medium">{agent.config.maxTokens.toLocaleString()}</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* System Prompt */}
          {agent.config.systemPrompt && (
            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">System Prompt</h3>
              <div className="rounded-md bg-muted/50 border border-border p-3">
                <p className="text-xs font-mono leading-relaxed whitespace-pre-wrap">{agent.config.systemPrompt}</p>
              </div>
            </div>
          )}

          <Separator />

          {/* Stats */}
          <div>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Statistics</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-xl font-bold">{agent.tasksCompleted}</p>
                <p className="text-[11px] text-muted-foreground">Completed</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold">{agent.tasksAssigned}</p>
                <p className="text-[11px] text-muted-foreground">Assigned</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold">{formatDuration(agent.uptime)}</p>
                <p className="text-[11px] text-muted-foreground">Uptime</p>
              </div>
            </div>
          </div>

          {/* Skills */}
          {agent.enabledSkills.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Enabled Skills</h3>
              <div className="flex flex-wrap gap-1.5">
                {agent.enabledSkills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="text-xs">
                    <Zap className="h-3 w-3 mr-1" />
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="space-y-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5" />
              Created {new Date(agent.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
            {agent.lastActiveAt && (
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5" />
                Last active {new Date(agent.lastActiveAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
          </div>

          <Separator />

          <Button variant="destructive" className="w-full" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Agent
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
