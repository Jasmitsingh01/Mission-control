import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { AGENTS, AGENT_MAP, STATUS_LABELS } from '@/lib/constants'
import { useTaskStore } from '@/stores/taskStore'
import { useActivityStore, type ActivityEvent } from '@/stores/activityStore'
import { useAgentStore } from '@/stores/agentStore'

// ─── Types ───
type FeedFilter = 'all' | 'tasks' | 'agents' | 'system'

interface TerminalLine {
  id: string
  html: string
}

// ─── Helpers ───
function pick<T>(a: T[]): T { return a[Math.floor(Math.random() * a.length)] }
function rand(min: number, max: number) { return min + Math.random() * (max - min) }
function uid() { return Math.random().toString(36).slice(2, 10) }

function relativeTime(ts: number) {
  const diff = Date.now() - ts
  const s = Math.floor(diff / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

function eventToCategory(type: string): 'tasks' | 'agents' | 'system' {
  if (type.startsWith('task_')) return 'tasks'
  if (type.startsWith('agent_') || type.startsWith('job_')) return 'agents'
  return 'system'
}

function severityDotColor(severity: string) {
  if (severity === 'success') return '#2d9a4e'
  if (severity === 'error') return '#cf4a3e'
  if (severity === 'warning') return '#d4870b'
  return '#3b7dd8'
}

// Terminal templates use real task titles and agent names — injected at generation time
const TERMINAL_TEMPLATES = [
  (t: string, a: string) => `<span class="text-[#6c7086]">[{t}]</span> <span class="text-[#a6e3a1]">INFO</span>  api.server — Request <span class="text-[#94e2d5]">GET /api/v2/tasks</span> completed in <span class="text-[#f9e2af]">${Math.floor(rand(8, 120))}ms</span>`,
  (t: string, a: string) => `<span class="text-[#6c7086]">[{t}]</span> <span class="text-[#a6e3a1]">INFO</span>  task.engine — <span class="text-[#94e2d5]">${a}</span> processing queue`,
  (t: string, a: string) => `<span class="text-[#6c7086]">[{t}]</span> <span class="text-[#a6e3a1]">INFO</span>  cache.redis — Cache HIT <span class="text-[#94e2d5]">board:${uid()}</span> TTL=${Math.floor(rand(60, 300))}s`,
  (t: string, a: string) => `<span class="text-[#6c7086]">[{t}]</span> <span class="text-[#a6e3a1]">INFO</span>  db.postgres — Query returned ${Math.floor(rand(1, 500))} rows in <span class="text-[#f9e2af]">${Math.floor(rand(1, 40))}ms</span>`,
  (t: string, a: string) => `<span class="text-[#6c7086]">[{t}]</span> <span class="text-[#89b4fa]">DEBUG</span> ws.connection — ${Math.floor(rand(1, 20))} active connections`,
  (t: string, a: string) => `<span class="text-[#6c7086]">[{t}]</span> <span class="text-[#a6e3a1]">INFO</span>  health.check — All services healthy — <span class="text-[#f9e2af]">${Math.floor(rand(10, 60))}ms</span>`,
  (t: string, a: string) => `<span class="text-[#6c7086]">[{t}]</span> <span class="text-[#f9e2af]">WARN</span>  rate.limit — IP 203.0.113.${Math.floor(rand(1, 254))} near threshold (${Math.floor(rand(70, 95))}/100)`,
  (t: string, a: string) => `<span class="text-[#6c7086]">[{t}]</span> <span class="text-[#a6e3a1]">INFO</span>  queue.bull — Job <span class="text-[#94e2d5]">task:sync</span> completed — ${Math.floor(rand(1, 30))} items`,
]

// ─── Component ───
export function LiveFeed() {
  const tasks = useTaskStore((s) => s.tasks)
  const activityEvents = useActivityStore((s) => s.events)
  const storeAgents = useAgentStore((s) => s.agents)

  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([])
  const [activeTab, setActiveTab] = useState<FeedFilter>('all')
  const [activeActorFilter, setActiveActorFilter] = useState<string | null>(null)
  const feedRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<HTMLDivElement>(null)

  // ─── Terminal simulation (the only simulated part — cosmetic system log) ───
  const generateTerminalLine = useCallback((): TerminalLine => {
    const now = new Date()
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
    const agentName = storeAgents.length > 0 ? pick(storeAgents).name : (AGENTS.length > 0 ? pick(AGENTS).name : 'System')
    const gen = pick(TERMINAL_TEMPLATES)
    const html = gen(time, agentName).replace('{t}', time)
    return { id: uid(), html }
  }, [storeAgents])

  useEffect(() => {
    const init: TerminalLine[] = []
    for (let i = 0; i < 5; i++) init.push(generateTerminalLine())
    setTerminalLines(init)

    const interval = setInterval(() => {
      setTerminalLines(prev => {
        const next = [...prev, generateTerminalLine()]
        return next.length > 60 ? next.slice(-60) : next
      })
    }, rand(1200, 3000))
    return () => clearInterval(interval)
  }, [generateTerminalLine])

  useEffect(() => {
    if (termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight
  }, [terminalLines])

  // ─── Feed is 100% dynamic from activityStore ───
  const filteredEvents = useMemo(() => {
    let events = [...activityEvents]
    if (activeTab !== 'all') {
      events = events.filter(e => eventToCategory(e.type) === activeTab)
    }
    if (activeActorFilter) {
      events = events.filter(e => e.actorId === activeActorFilter || e.relatedAgentId === activeActorFilter)
    }
    return events.slice(0, 100) // activityStore is already newest-first
  }, [activityEvents, activeTab, activeActorFilter])

  // Tab counts
  const tabCounts = useMemo(() => ({
    tasks: activityEvents.filter(e => eventToCategory(e.type) === 'tasks').length,
    agents: activityEvents.filter(e => eventToCategory(e.type) === 'agents').length,
    system: activityEvents.filter(e => eventToCategory(e.type) === 'system').length,
  }), [activityEvents])

  // Unique actors in the feed
  const feedActors = useMemo(() => {
    const actorCounts = new Map<string, { name: string; color: string; count: number }>()
    for (const e of activityEvents) {
      const id = e.actorId || e.relatedAgentId
      if (!id) continue
      const existing = actorCounts.get(id)
      if (existing) { existing.count++; continue }
      // Try to resolve name
      const storeAgent = storeAgents.find(a => a.id === id)
      const constAgent = AGENT_MAP[id]
      actorCounts.set(id, {
        name: storeAgent?.name || constAgent?.name || id,
        color: constAgent?.color || '#71695e',
        count: 1,
      })
    }
    return actorCounts
  }, [activityEvents, storeAgents])

  // Auto-scroll feed
  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = 0 // newest at top
  }, [filteredEvents.length])

  const TABS: { filter: FeedFilter; label: string; countKey?: keyof typeof tabCounts }[] = [
    { filter: 'all', label: 'All' },
    { filter: 'tasks', label: 'Tasks', countKey: 'tasks' },
    { filter: 'agents', label: 'Agents', countKey: 'agents' },
    { filter: 'system', label: 'System', countKey: 'system' },
  ]

  return (
    <div className="bg-white border-l border-[#e6e2da] flex flex-col overflow-hidden w-[300px] shrink-0">
      {/* Header */}
      <div className="flex items-center gap-2 px-3.5 pt-3 pb-2 shrink-0">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2d9a4e] opacity-60" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2d9a4e]" />
        </span>
        <span className="text-[0.62rem] font-bold tracking-[0.1em] uppercase text-[#71695e]">
          Live Feed
        </span>
        <span className="text-[0.52rem] font-semibold text-[#a19a8f] ml-auto tabular-nums">
          {activityEvents.length} events
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-[3px] px-3 pb-1.5 flex-wrap shrink-0">
        {TABS.map(tab => (
          <button
            key={tab.filter}
            onClick={() => setActiveTab(tab.filter)}
            className={cn(
              'text-[0.58rem] font-medium px-2 py-[2px] border rounded-full cursor-pointer transition-all flex items-center gap-1',
              activeTab === tab.filter
                ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]'
                : 'border-[#e6e2da] text-[#71695e] hover:bg-[#f4f1eb]'
            )}
          >
            {tab.label}
            {tab.countKey !== undefined && (
              <span className={cn('text-[0.5rem] font-bold tabular-nums', activeTab === tab.filter ? 'text-white/70' : 'text-[#a19a8f]')}>
                {tabCounts[tab.countKey]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Actor Filters (derived from real events) */}
      {feedActors.size > 0 && (
        <div className="flex flex-wrap gap-1 px-3 pb-2 shrink-0">
          <button
            onClick={() => setActiveActorFilter(null)}
            className={cn(
              'text-[0.55rem] font-medium px-1.5 py-[1px] border rounded-md cursor-pointer transition-all',
              !activeActorFilter ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]' : 'border-[#e6e2da] text-[#71695e] hover:bg-[#f4f1eb]'
            )}
          >
            All
          </button>
          {[...feedActors.entries()].slice(0, 8).map(([id, info]) => (
            <button
              key={id}
              onClick={() => setActiveActorFilter(activeActorFilter === id ? null : id)}
              className={cn(
                'text-[0.55rem] font-medium px-1.5 py-[1px] border rounded-md cursor-pointer transition-all flex items-center gap-1',
                activeActorFilter === id
                  ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]'
                  : 'border-[#e6e2da] text-[#71695e] hover:bg-[#f4f1eb]'
              )}
            >
              <span className="w-[5px] h-[5px] rounded-full shrink-0" style={{ background: activeActorFilter === id ? '#fff' : info.color }} />
              {info.name}
              <span className={cn('text-[0.48rem] font-bold tabular-nums', activeActorFilter === id ? 'text-white/70' : 'text-[#a19a8f]')}>
                {info.count}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Feed Messages — 100% from activityStore */}
      <div ref={feedRef} className="flex-1 overflow-y-auto px-3 min-h-0">
        {filteredEvents.length > 0 ? filteredEvents.map((event: ActivityEvent) => (
          <div key={event.id} className="flex gap-2 py-2 border-b border-[#eeebe4]/80 animate-fade-in">
            <span
              className="w-[6px] h-[6px] rounded-full mt-[5px] shrink-0"
              style={{ background: severityDotColor(event.severity) }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-[0.68rem] font-medium text-[#1a1a1a] leading-snug">
                {event.actorId && (
                  <span className="text-[#d4870b] font-semibold">
                    {(() => {
                      const sa = storeAgents.find(a => a.id === event.actorId)
                      const ca = event.actorId ? AGENT_MAP[event.actorId] : null
                      return sa?.name || ca?.name || event.actorId
                    })()}
                  </span>
                )}{' '}
                {event.message}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[0.52rem] text-[#a19a8f] tabular-nums">{relativeTime(event.timestamp)}</span>
                <span className={cn(
                  'text-[0.48rem] font-bold uppercase tracking-wider px-1 py-px rounded',
                  event.severity === 'error' ? 'bg-[#cf4a3e]/10 text-[#cf4a3e]'
                    : event.severity === 'success' ? 'bg-[#2d9a4e]/10 text-[#2d9a4e]'
                    : event.severity === 'warning' ? 'bg-[#d4870b]/10 text-[#d4870b]'
                    : 'bg-[#3b7dd8]/8 text-[#3b7dd8]'
                )}>
                  {event.type.replace(/_/g, ' ')}
                </span>
              </div>
            </div>
          </div>
        )) : (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <div className="w-10 h-10 rounded-full bg-[#f4f1eb] flex items-center justify-center">
              <span className="text-[#a19a8f] text-lg">~</span>
            </div>
            <p className="text-[0.66rem] text-[#a19a8f] text-center leading-relaxed">
              No activity yet.<br />
              <span className="text-[0.58rem]">Events will appear as you create tasks, run agents, and interact with the board.</span>
            </p>
          </div>
        )}
      </div>

      {/* Terminal Log */}
      <div className="shrink-0">
        <div className="flex items-center gap-2 px-3 py-1 bg-[#2a2a3d]">
          <div className="flex gap-[3px]">
            <span className="w-[7px] h-[7px] rounded-full bg-[#ff5f57]" />
            <span className="w-[7px] h-[7px] rounded-full bg-[#ffbd2e]" />
            <span className="w-[7px] h-[7px] rounded-full bg-[#28c840]" />
          </div>
          <span className="text-[0.55rem] text-[#8b8ba7] font-semibold font-mono">system.log</span>
        </div>
        <div
          ref={termRef}
          className="bg-[#1e1e2e] font-mono text-[0.55rem] leading-relaxed px-3 py-1.5 h-[100px] overflow-y-auto text-[#cdd6f4]"
        >
          {terminalLines.map(line => (
            <div key={line.id} className="whitespace-nowrap animate-fade-in" dangerouslySetInnerHTML={{ __html: line.html }} />
          ))}
        </div>
      </div>
    </div>
  )
}
