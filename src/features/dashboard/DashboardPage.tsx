import {
  KanbanSquare,
  Bot,
  Clock,
  Activity,
  ArrowUpRight,
  TrendingUp,
  Rocket,
  Terminal,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTaskStore } from '@/stores/taskStore'
import { useAgentStore } from '@/stores/agentStore'
import { useJobStore } from '@/stores/jobStore'
import { useActivityStore } from '@/stores/activityStore'

const severityColors: Record<string, string> = {
  success: 'text-emerald-500',
  info: 'text-secondary',
  error: 'text-error',
  warning: 'text-tertiary',
}

const severityDotColors: Record<string, string> = {
  success: 'bg-emerald-500',
  info: 'bg-secondary',
  error: 'bg-error',
  warning: 'bg-tertiary',
}

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export function DashboardPage() {
  const tasks = useTaskStore((s) => s.tasks)
  const agents = useAgentStore((s) => s.agents)
  const jobs = useJobStore((s) => s.jobs)
  const events = useActivityStore((s) => s.events)

  const activeTasks = tasks.filter((t) => t.status !== 'done').length
  const doneTasks = tasks.filter((t) => t.status === 'done').length
  const runningAgents = agents.filter((a) => a.status === 'running').length
  const idleAgents = agents.filter((a) => a.status === 'idle').length
  const activeJobs = jobs.filter((j) => j.enabled).length
  const nextJob = jobs.filter((j) => j.enabled).sort((a, b) => a.nextRunAt - b.nextRunAt)[0]
  const nextJobTime = nextJob ? Math.max(0, Math.floor((nextJob.nextRunAt - Date.now()) / 60000)) : 0
  const errorEvents = events.filter((e) => e.severity === 'error').length

  const isEmpty = tasks.length === 0 && agents.length === 0

  const stats = [
    { title: 'Active Tasks', value: activeTasks, change: doneTasks > 0 ? `${doneTasks} done` : 'No tasks yet', icon: KanbanSquare, color: 'text-primary', bgColor: 'bg-primary/8', href: '/dashboard/board' },
    { title: 'Running Agents', value: runningAgents, change: idleAgents > 0 ? `${idleAgents} idle` : agents.length > 0 ? `${agents.length} total` : 'No agents yet', icon: Bot, color: 'text-secondary', bgColor: 'bg-secondary/8', href: '/dashboard/agents' },
    { title: 'Scheduled Jobs', value: activeJobs, change: nextJob ? `Next in ${nextJobTime}m` : 'No jobs yet', icon: Clock, color: 'text-tertiary', bgColor: 'bg-tertiary/8', href: '/dashboard/jobs' },
    { title: 'Events', value: events.length, change: errorEvents > 0 ? `${errorEvents} errors` : 'No events yet', icon: Activity, color: 'text-on-surface', bgColor: 'bg-on-surface/5', href: '/dashboard/activity' },
  ]

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="pt-1">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary font-semibold mb-2">Command Center</p>
        <h1 className="text-4xl font-bold text-on-surface tracking-tight font-[family-name:var(--font-headline)]">Mission Control</h1>
        <p className="text-sm text-on-surface-variant/70 mt-2">Your AI agent orchestration command center</p>
      </div>

      {/* Empty state CTA */}
      {isEmpty && (
        <div className="relative bg-surface rounded-2xl border border-outline-variant/10 p-10 overflow-hidden card-elevated animate-fade-in">
          <div className="absolute inset-0 bg-grid opacity-50" />
          <div className="relative flex flex-col items-center text-center">
            <div className="rounded-2xl synthetic-gradient p-5 mb-6 shadow-lg shadow-primary/20">
              <Rocket className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-on-surface mb-3 font-[family-name:var(--font-headline)]">Launch Your First Mission</h2>
            <p className="text-sm text-on-surface-variant max-w-lg mb-8 leading-relaxed">
              Describe what you want to build and Mission Control will assemble the perfect AI agent team, break down tasks, and assign work automatically.
            </p>
            <Link to="/dashboard/mission">
              <button className="synthetic-gradient text-white text-sm font-semibold px-8 py-3 rounded-xl flex items-center gap-2 hover:opacity-90 hover:shadow-lg hover:shadow-primary/25 transition-all active:scale-[0.98]">
                <Rocket className="h-4 w-4" />
                Launch Mission
              </button>
            </Link>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Link key={stat.title} to={stat.href}>
            <div className={`bg-surface rounded-2xl border border-outline-variant/10 p-5 hover:border-primary/20 transition-all cursor-pointer group card-elevated animate-fade-in stagger-${i + 1}`}>
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-on-surface-variant/70 font-medium">{stat.title}</span>
                <div className={`rounded-xl p-2 ${stat.bgColor} transition-colors`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <span className={`font-mono text-3xl font-bold ${stat.color}`}>{stat.value}</span>
                <span className="flex items-center gap-1 font-mono text-[10px] text-on-surface-variant/50">
                  {stat.change}
                  <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Activity */}
        <div className="bg-surface rounded-2xl border border-outline-variant/10 overflow-hidden card-elevated animate-fade-in stagger-5">
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-outline-variant/8">
            <div className="flex items-center gap-2.5">
              <div className="rounded-lg bg-secondary/10 p-1.5">
                <Terminal className="h-3.5 w-3.5 text-secondary" />
              </div>
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-on-surface-variant/70">Recent Activity</span>
            </div>
            <Link to="/dashboard/activity" className="font-mono text-[10px] uppercase tracking-[0.15em] text-primary/60 hover:text-primary transition-colors font-medium">View all</Link>
          </div>
          <div className="px-6 py-4">
            {events.length > 0 ? (
              <div className="space-y-3">
                {events.slice(0, 5).map((event) => (
                  <div key={event.id} className="flex items-start gap-3 group">
                    <div className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${severityDotColors[event.severity] || 'bg-outline'}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] text-on-surface leading-relaxed">{event.message}</p>
                      <p className="font-mono text-[10px] text-outline/50 mt-0.5">{timeAgo(event.timestamp)}</p>
                    </div>
                    <span className={`font-mono text-[10px] font-bold uppercase ${severityColors[event.severity] || 'text-outline'}`}>
                      {event.severity}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-14 text-on-surface-variant">
                <div className="rounded-2xl bg-surface-container p-4 mb-3">
                  <Activity className="h-7 w-7 opacity-20" />
                </div>
                <p className="text-sm font-medium">No activity yet</p>
                <p className="font-mono text-[10px] text-outline/50 mt-1">Launch a mission to see events here</p>
              </div>
            )}
          </div>
        </div>

        {/* Agents */}
        <div className="bg-surface rounded-2xl border border-outline-variant/10 overflow-hidden card-elevated animate-fade-in stagger-6">
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-outline-variant/8">
            <div className="flex items-center gap-2.5">
              <div className="rounded-lg bg-primary/10 p-1.5">
                <Bot className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-on-surface-variant/70">Agent Status</span>
            </div>
            <Link to="/dashboard/agents" className="font-mono text-[10px] uppercase tracking-[0.15em] text-primary/60 hover:text-primary transition-colors font-medium">Manage</Link>
          </div>
          <div className="px-6 py-4">
            {agents.length > 0 ? (
              <div className="space-y-2.5">
                {agents.map((agent) => (
                  <div key={agent.id} className="flex items-center gap-3 bg-surface-container/50 p-3.5 rounded-xl group hover:bg-surface-container transition-all">
                    <div className={`h-2 w-2 rounded-full shrink-0 ${
                      agent.status === 'running' ? 'bg-emerald-500 animate-pulse-subtle'
                      : agent.status === 'error' ? 'bg-error'
                      : 'bg-outline/40'
                    }`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-on-surface truncate">{agent.name}</p>
                      <p className="font-mono text-[10px] text-outline/50 mt-0.5">{agent.model}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {agent.tasksAssigned > 0 && (
                        <span className="font-mono text-[10px] font-bold bg-surface-container-highest/80 px-2 py-0.5 rounded-md text-on-surface-variant">
                          {agent.tasksAssigned} tasks
                        </span>
                      )}
                      <TrendingUp className="h-3.5 w-3.5 text-outline/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-14 text-on-surface-variant">
                <div className="rounded-2xl bg-surface-container p-4 mb-3">
                  <Bot className="h-7 w-7 opacity-20" />
                </div>
                <p className="text-sm font-medium">No agents deployed</p>
                <p className="font-mono text-[10px] text-outline/50 mt-1">Spawn agents or launch a mission</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
