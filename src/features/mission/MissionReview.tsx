import {
  Bot,
  ListTodo,
  ArrowRight,
  Zap,
  Layers,
  Cpu,
  Thermometer,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { STATUS_LABELS, STATUS_COLORS, PRIORITY_COLORS } from '@/lib/constants'
import type { MissionPlan } from './missionPlanner'

const providerColors: Record<string, string> = {
  anthropic: 'bg-orange-500/10 text-orange-400',
  openai: 'bg-emerald-500/10 text-emerald-400',
  google: 'bg-blue-500/10 text-blue-400',
  local: 'bg-purple-500/10 text-purple-400',
  custom: 'bg-pink-500/10 text-pink-400',
}

interface MissionReviewProps {
  plan: MissionPlan
}

export function MissionReview({ plan }: MissionReviewProps) {
  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-4">
            <div className="grid grid-cols-3 gap-6 flex-1">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">{plan.agents.length}</p>
                <p className="text-xs text-muted-foreground mt-1">AI Agents</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-foreground">{plan.tasks.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Tasks</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-muted-foreground">{plan.estimatedPhases.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Phases</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phases */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Execution Phases
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 flex-wrap">
            {plan.estimatedPhases.map((phase, i) => (
              <div key={phase} className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {i + 1}. {phase}
                </Badge>
                {i < plan.estimatedPhases.length - 1 && (
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Agent Team */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Bot className="h-4 w-4" />
            Agent Team ({plan.agents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {plan.agents.map((agent) => {
              const taskCount = plan.tasks.filter((t) => t.assignedAgentRole === agent.role).length
              return (
                <div
                  key={agent.role}
                  className="rounded-lg border border-border p-3 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-primary/10 p-2 shrink-0">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm">{agent.name}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{agent.description}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge variant="secondary" className={cn('text-[10px]', providerColors[agent.provider])}>
                          {agent.provider}
                        </Badge>
                        <span className="text-[10px] font-mono text-muted-foreground">{agent.model}</span>
                        <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                          <Thermometer className="h-3 w-3" />
                          {agent.temperature}
                        </span>
                        <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                          <Cpu className="h-3 w-3" />
                          {agent.maxTokens.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-2">
                        {agent.skills.map((skill) => (
                          <Badge key={skill} variant="outline" className="text-[10px] gap-0.5">
                            <Zap className="h-2.5 w-2.5" />
                            {skill}
                          </Badge>
                        ))}
                        <Badge variant="secondary" className="text-[10px] ml-auto">
                          {taskCount} tasks
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Task Breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ListTodo className="h-4 w-4" />
            Task Breakdown ({plan.tasks.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {plan.tasks.map((task, i) => {
              const agent = plan.agents.find((a) => a.role === task.assignedAgentRole)
              return (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-lg border border-border p-3 hover:border-primary/20 transition-colors"
                >
                  <span className="text-xs text-muted-foreground font-mono mt-0.5 w-5 shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-medium">{task.title}</h4>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{task.description}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className={cn('text-[10px]', STATUS_COLORS[task.status])}>
                        {STATUS_LABELS[task.status]}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] capitalize" style={{ color: PRIORITY_COLORS[task.priority] }}>
                        {task.priority}
                      </Badge>
                      {task.labels.map((l) => (
                        <Badge key={l} variant="outline" className="text-[10px]">{l}</Badge>
                      ))}
                      {agent && (
                        <span className="flex items-center gap-1 text-[10px] text-primary/70 ml-auto">
                          <Bot className="h-3 w-3" />
                          {agent.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
