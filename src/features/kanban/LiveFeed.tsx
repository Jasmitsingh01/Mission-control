/**
 * LiveFeed — Real-time activity feed showing all agent executions and conversations.
 *
 * Properly parses agent names from "[Agent Name] mission" execution titles.
 * Shows distinct colors/labels for started/completed/failed/running/tool events.
 * Click any item to open ConversationPanel with full chat history.
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { useConversationStore, type UnifiedFeedItem, type FeedEventKind } from '@/stores/conversationStore'
import { useExecutionStore } from '@/stores/executionStore'
import { useActivityStore } from '@/stores/activityStore'
import { useAgentStore } from '@/stores/agentStore'
import { useTaskStore } from '@/stores/taskStore'
import { AGENT_MAP } from '@/lib/constants'
import { ConversationPanel } from './ConversationPanel'

// ─── Types ───
type FeedFilter = 'all' | 'executions' | 'tasks' | 'system'

// ─── Visual config per event kind ───
const KIND_CONFIG: Record<FeedEventKind, { dot: string; badge: string; badgeBg: string; label: string }> = {
  started:   { dot: '#3b7dd8', badge: 'text-[#3b7dd8]', badgeBg: 'bg-[#3b7dd8]/8',  label: 'STARTED' },
  completed: { dot: '#2d9a4e', badge: 'text-[#2d9a4e]', badgeBg: 'bg-[#2d9a4e]/8',  label: 'DONE' },
  failed:    { dot: '#cf4a3e', badge: 'text-[#cf4a3e]', badgeBg: 'bg-[#cf4a3e]/8',  label: 'FAILED' },
  running:   { dot: '#3b7dd8', badge: 'text-[#3b7dd8]', badgeBg: 'bg-[#3b7dd8]/8',  label: 'RUNNING' },
  tool:      { dot: '#d4870b', badge: 'text-[#d4870b]', badgeBg: 'bg-[#d4870b]/8',  label: 'TOOL' },
  text:      { dot: '#2d9a4e', badge: 'text-[#2d9a4e]', badgeBg: 'bg-[#2d9a4e]/8',  label: 'AGT' },
  artifact:  { dot: '#7c5cbf', badge: 'text-[#7c5cbf]', badgeBg: 'bg-[#7c5cbf]/8',  label: 'FILE' },
  status:    { dot: '#71695e', badge: 'text-[#71695e]', badgeBg: 'bg-[#71695e]/8',  label: 'SYS' },
  activity:  { dot: '#9e9a93', badge: 'text-[#9e9a93]', badgeBg: 'bg-[#9e9a93]/8',  label: 'EVT' },
}

function relativeTime(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 5) return 'now'
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

// Assign stable colors to agent names
const AGENT_COLORS = ['#7c5cbf', '#3b7dd8', '#d45c8a', '#d4870b', '#2d9a4e', '#cf4a3e', '#2a9d8f', '#e5a100']
const agentColorCache = new Map<string, string>()
function getAgentColor(name: string): string {
  if (!name) return '#71695e'
  const cached = agentColorCache.get(name)
  if (cached) return cached
  // Check static AGENT_MAP
  for (const a of Object.values(AGENT_MAP)) {
    if (a.name === name) { agentColorCache.set(name, a.color); return a.color }
  }
  // Hash-based color assignment
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0
  const color = AGENT_COLORS[Math.abs(hash) % AGENT_COLORS.length]
  agentColorCache.set(name, color)
  return color
}

// ─── Component ───
export function LiveFeed() {
  const getUnifiedFeed = useConversationStore(s => s.getUnifiedFeed)
  const activityEvents = useActivityStore(s => s.events)
  const executions = useExecutionStore(s => s.executions)
  const streamEvents = useExecutionStore(s => s.streamEvents)
  const isConnected = useExecutionStore(s => s.isConnected)
  const storeAgents = useAgentStore(s => s.agents)
  const tasks = useTaskStore(s => s.tasks)

  const [activeTab, setActiveTab] = useState<FeedFilter>('all')
  const [activeAgent, setActiveAgent] = useState<string | null>(null)
  const [selectedExecId, setSelectedExecId] = useState<string | null>(null)
  const [convoPanelOpen, setConvoPanelOpen] = useState(false)
  const feedRef = useRef<HTMLDivElement>(null)

  // Rebuild feed whenever underlying data changes
  const feed = useMemo(() => getUnifiedFeed(300), [getUnifiedFeed, activityEvents, executions, streamEvents])

  // Filter
  const filteredFeed = useMemo(() => {
    let items = feed
    if (activeTab === 'executions') items = items.filter(i => i.type === 'execution_event')
    else if (activeTab === 'tasks') items = items.filter(i => i.activityEvent?.type?.startsWith('task_'))
    else if (activeTab === 'system') items = items.filter(i => i.type === 'activity_event' && !i.activityEvent?.type?.startsWith('task_'))

    if (activeAgent) {
      items = items.filter(i => {
        if (i.agentName === activeAgent) return true
        if (i.activityEvent?.actorId === activeAgent || i.activityEvent?.relatedAgentId === activeAgent) return true
        return false
      })
    }
    return items
  }, [feed, activeTab, activeAgent])

  // Tab counts
  const counts = useMemo(() => ({
    executions: feed.filter(i => i.type === 'execution_event').length,
    tasks: feed.filter(i => i.activityEvent?.type?.startsWith('task_')).length,
    system: feed.filter(i => i.type === 'activity_event' && !i.activityEvent?.type?.startsWith('task_')).length,
  }), [feed])

  // Unique agents from executions (by parsed name)
  const feedAgents = useMemo(() => {
    const map = new Map<string, { name: string; color: string; count: number }>()
    for (const item of feed) {
      const name = item.agentName
      if (!name) continue
      const existing = map.get(name)
      if (existing) { existing.count++; continue }
      map.set(name, { name, color: getAgentColor(name), count: 1 })
    }
    return map
  }, [feed])

  // Auto-scroll
  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = 0
  }, [filteredFeed.length])

  const openConversation = useCallback((execId: string) => {
    setSelectedExecId(execId)
    setConvoPanelOpen(true)
  }, [])

  // ─── Terminal from real execution streams ───
  const terminalLines = useMemo(() => {
    const lines: { id: string; html: string }[] = []
    for (const exec of executions.slice(0, 10)) {
      const events = streamEvents.get(exec.id) || []
      for (const ev of events.slice(-15)) {
        const time = new Date(ev.timestamp).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
        const esc = (s: string) => s.replace(/</g, '&lt;').replace(/>/g, '&gt;')
        let html = ''
        if (ev.type === 'text') html = `<span class="text-[#6c7086]">[${time}]</span> <span class="text-[#a6e3a1]">AGT</span> ${esc(ev.content?.slice(0, 100) || '')}`
        else if (ev.type === 'tool_use') html = `<span class="text-[#6c7086]">[${time}]</span> <span class="text-[#f9e2af]">TOOL</span> <span class="text-[#94e2d5]">${esc(ev.toolName || 'unknown')}</span>`
        else if (ev.type === 'tool_result') html = `<span class="text-[#6c7086]">[${time}]</span> <span class="text-[#89b4fa]">RES</span> ${esc(ev.content?.slice(0, 80) || '(ok)')}`
        else if (ev.type === 'error') html = `<span class="text-[#6c7086]">[${time}]</span> <span class="text-[#f38ba8]">ERR</span> ${esc(ev.content?.slice(0, 80) || '')}`
        else if (ev.type === 'complete') html = `<span class="text-[#6c7086]">[${time}]</span> <span class="text-[#a6e3a1]">DONE</span> <span class="text-[#94e2d5]">${esc(exec.taskTitle)}</span>`
        else continue
        lines.push({ id: `${ev.executionId}-${ev.timestamp}`, html })
      }
    }
    lines.sort((a, b) => a.id.localeCompare(b.id))
    return lines.slice(-50)
  }, [executions, streamEvents])

  const termRef = useRef<HTMLDivElement>(null)
  useEffect(() => { if (termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight }, [terminalLines])

  const TABS: { filter: FeedFilter; label: string; count?: number }[] = [
    { filter: 'all', label: 'All' },
    { filter: 'executions', label: 'Agents', count: counts.executions },
    { filter: 'tasks', label: 'Tasks', count: counts.tasks },
    { filter: 'system', label: 'System', count: counts.system },
  ]

  const hasData = feed.length > 0
  const hasTerminal = terminalLines.length > 0

  return (
    <>
      <div className="bg-white border-l border-[#e6e2da] flex flex-col overflow-hidden w-[310px] shrink-0">
        {/* Header */}
        <div className="flex items-center gap-2 px-3.5 pt-3 pb-2 shrink-0">
          <span className="relative flex h-2 w-2">
            {isConnected ? (
              <><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2d9a4e] opacity-60" /><span className="relative inline-flex rounded-full h-2 w-2 bg-[#2d9a4e]" /></>
            ) : (
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#a19a8f]" />
            )}
          </span>
          <span className="text-[0.62rem] font-bold tracking-[0.1em] uppercase text-[#71695e]">Live Feed</span>
          <span className={cn('text-[0.46rem] font-bold uppercase tracking-wider px-1.5 py-px rounded ml-auto', isConnected ? 'bg-[#2d9a4e]/10 text-[#2d9a4e]' : 'bg-[#a19a8f]/10 text-[#a19a8f]')}>
            {isConnected ? 'Live' : 'Offline'}
          </span>
        </div>

        {/* Tabs */}
        <div className="flex gap-[3px] px-3 pb-1.5 flex-wrap shrink-0">
          {TABS.map(tab => (
            <button key={tab.filter} onClick={() => setActiveTab(tab.filter)} className={cn(
              'text-[0.56rem] font-medium px-2 py-[2px] border rounded-full transition-all flex items-center gap-1',
              activeTab === tab.filter ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]' : 'border-[#e6e2da] text-[#71695e] hover:bg-[#f4f1eb]'
            )}>
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={cn('text-[0.48rem] font-bold tabular-nums', activeTab === tab.filter ? 'text-white/70' : 'text-[#a19a8f]')}>{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Agent filters */}
        {feedAgents.size > 0 && (
          <div className="flex flex-wrap gap-1 px-3 pb-2 shrink-0 max-h-[60px] overflow-y-auto">
            <button onClick={() => setActiveAgent(null)} className={cn(
              'text-[0.52rem] font-medium px-1.5 py-px border rounded-md transition-all',
              !activeAgent ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]' : 'border-[#e6e2da] text-[#71695e] hover:bg-[#f4f1eb]'
            )}>All</button>
            {[...feedAgents.entries()].slice(0, 12).map(([name, info]) => (
              <button key={name} onClick={() => setActiveAgent(activeAgent === name ? null : name)} className={cn(
                'text-[0.52rem] font-medium px-1.5 py-px border rounded-md transition-all flex items-center gap-1',
                activeAgent === name ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]' : 'border-[#e6e2da] text-[#71695e] hover:bg-[#f4f1eb]'
              )}>
                <span className="w-[5px] h-[5px] rounded-full" style={{ background: activeAgent === name ? '#fff' : info.color }} />
                {info.name}
              </button>
            ))}
          </div>
        )}

        {/* Feed */}
        <div ref={feedRef} className="flex-1 overflow-y-auto px-2.5 min-h-0">
          {hasData ? filteredFeed.map((item: UnifiedFeedItem) => {
            const config = KIND_CONFIG[item.kind] || KIND_CONFIG.status
            const agentName = item.agentName || ''
            const agentColor = getAgentColor(agentName)
            const content = item.content || item.activityEvent?.message || ''
            const isClickable = !!item.executionId
            const missionLabel = item.missionName || item.taskTitle || ''

            return (
              <div
                key={item.id}
                className={cn(
                  'flex gap-2 py-[7px] border-b border-[#eeebe4]/60 animate-fade-in',
                  isClickable && 'cursor-pointer hover:bg-[#faf8f3] rounded-md px-1 -mx-1'
                )}
                onClick={isClickable ? () => openConversation(item.executionId!) : undefined}
              >
                {/* Agent color dot */}
                <span className="w-[6px] h-[6px] rounded-full mt-[5px] shrink-0" style={{ background: agentName ? agentColor : config.dot }} />

                <div className="flex-1 min-w-0">
                  {/* Agent name + content */}
                  <p className="text-[0.66rem] text-[#1a1a1a] leading-snug">
                    {agentName && (
                      <span className="font-semibold" style={{ color: agentColor }}>{agentName} </span>
                    )}
                    <span className="text-[#4a4540]">{content.slice(0, 150)}</span>
                  </p>

                  {/* Meta row: time + kind badge + mission name */}
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[0.46rem] text-[#a19a8f] tabular-nums">{relativeTime(item.timestamp)}</span>
                    <span className={cn('text-[0.42rem] font-bold uppercase tracking-wider px-1 py-px rounded', config.badgeBg, config.badge)}>
                      {config.label}
                    </span>
                    {missionLabel && missionLabel !== agentName && (
                      <span className="text-[0.44rem] text-[#a19a8f] truncate max-w-[90px]">{missionLabel}</span>
                    )}
                  </div>
                </div>

                {isClickable && <span className="text-[0.65rem] text-[#c5c0b8] self-center shrink-0">›</span>}
              </div>
            )
          }) : (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <div className="w-9 h-9 rounded-full bg-[#f4f1eb] flex items-center justify-center text-[#c5c0b8] text-sm">~</div>
              <p className="text-[0.6rem] text-[#a19a8f] text-center leading-relaxed max-w-[200px]">
                No activity yet. Launch a mission or run an execution to see live agent activity.
              </p>
            </div>
          )}
        </div>

        {/* Terminal */}
        <div className="shrink-0">
          <div className="flex items-center gap-2 px-3 py-1 bg-[#2a2a3d]">
            <div className="flex gap-[3px]">
              <span className="w-[6px] h-[6px] rounded-full bg-[#ff5f57]" />
              <span className="w-[6px] h-[6px] rounded-full bg-[#ffbd2e]" />
              <span className="w-[6px] h-[6px] rounded-full bg-[#28c840]" />
            </div>
            <span className="text-[0.52rem] text-[#8b8ba7] font-semibold font-mono">
              {hasTerminal ? 'agent.stream' : 'system.log'}
            </span>
            {executions.some(e => e.status === 'running') && (
              <span className="ml-auto text-[0.45rem] text-[#a6e3a1] font-mono animate-pulse">STREAMING</span>
            )}
          </div>
          <div ref={termRef} className="bg-[#1e1e2e] font-mono text-[0.52rem] leading-relaxed px-3 py-1.5 h-[90px] overflow-y-auto text-[#cdd6f4]">
            {hasTerminal ? terminalLines.map(line => (
              <div key={line.id} className="whitespace-nowrap animate-fade-in truncate" dangerouslySetInnerHTML={{ __html: line.html }} />
            )) : (
              <div className="flex items-center justify-center h-full text-[#6c7086] text-[0.5rem]">
                Awaiting agent streams...
              </div>
            )}
          </div>
        </div>
      </div>

      <ConversationPanel executionId={selectedExecId} open={convoPanelOpen} onOpenChange={setConvoPanelOpen} />
    </>
  )
}
