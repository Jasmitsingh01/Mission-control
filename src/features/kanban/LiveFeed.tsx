/**
 * LiveFeed — Production-grade real-time activity feed for the Kanban board.
 *
 * Data sources (all dynamic, zero simulation):
 *  - conversationStore.getUnifiedFeed() → execution stream events + activity events
 *  - executionStore → live WebSocket stream, connection status
 *  - activityStore → task/agent lifecycle events
 *
 * Features:
 *  - Filter by type (All / Executions / Tasks / System)
 *  - Filter by agent
 *  - Click any execution event to open ConversationPanel
 *  - Live connection indicator from executionStore.isConnected
 *  - Real terminal log from execution stream events
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { useConversationStore, type UnifiedFeedItem } from '@/stores/conversationStore'
import { useExecutionStore } from '@/stores/executionStore'
import { useActivityStore } from '@/stores/activityStore'
import { useAgentStore } from '@/stores/agentStore'
import { useTaskStore } from '@/stores/taskStore'
import { AGENT_MAP } from '@/lib/constants'
import { ConversationPanel } from './ConversationPanel'

// ─── Types ───
type FeedFilter = 'all' | 'executions' | 'tasks' | 'system'

// ─── Helpers ───
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

function roleDotColor(role?: string) {
  if (role === 'error') return '#cf4a3e'
  if (role === 'agent') return '#2d9a4e'
  if (role === 'tool') return '#d4870b'
  if (role === 'user') return '#3b7dd8'
  if (role === 'artifact') return '#7c5cbf'
  return '#9e9a93'
}

function roleLabel(role?: string) {
  if (role === 'error') return 'ERR'
  if (role === 'agent') return 'AGT'
  if (role === 'tool') return 'TOOL'
  if (role === 'user') return 'USR'
  if (role === 'artifact') return 'FILE'
  if (role === 'system') return 'SYS'
  return 'EVT'
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
  const feed = useMemo(() => {
    return getUnifiedFeed(200)
  }, [getUnifiedFeed, activityEvents, executions, streamEvents])

  // Filter feed
  const filteredFeed = useMemo(() => {
    let items = feed
    if (activeTab === 'executions') items = items.filter(i => i.type === 'execution_event')
    else if (activeTab === 'tasks') items = items.filter(i => i.activityEvent?.type.startsWith('task_'))
    else if (activeTab === 'system') items = items.filter(i => i.type === 'activity_event' && !i.activityEvent?.type.startsWith('task_'))

    if (activeAgent) {
      items = items.filter(i => {
        if (i.activityEvent?.actorId === activeAgent || i.activityEvent?.relatedAgentId === activeAgent) return true
        if (i.executionId) {
          const t = tasks.find(t => t.executionId === i.executionId)
          if (t?.assignee === activeAgent || t?.assignedAgentId === activeAgent) return true
        }
        return false
      })
    }
    return items
  }, [feed, activeTab, activeAgent, tasks])

  // Tab counts
  const counts = useMemo(() => ({
    executions: feed.filter(i => i.type === 'execution_event').length,
    tasks: feed.filter(i => i.activityEvent?.type.startsWith('task_')).length,
    system: feed.filter(i => i.type === 'activity_event' && !i.activityEvent?.type.startsWith('task_')).length,
  }), [feed])

  // Unique agents in feed
  const feedAgents = useMemo(() => {
    const map = new Map<string, { name: string; color: string; count: number }>()
    for (const item of feed) {
      const agentId = item.activityEvent?.actorId || item.activityEvent?.relatedAgentId
        || (() => {
          if (!item.executionId) return null
          const t = tasks.find(t => t.executionId === item.executionId)
          return t?.assignee || t?.assignedAgentId || null
        })()
      if (!agentId) continue
      const existing = map.get(agentId)
      if (existing) { existing.count++; continue }
      const sa = storeAgents.find(a => a.id === agentId)
      const ca = AGENT_MAP[agentId]
      map.set(agentId, {
        name: sa?.name || ca?.name || agentId.slice(0, 8),
        color: ca?.color || '#71695e',
        count: 1,
      })
    }
    return map
  }, [feed, storeAgents, tasks])

  // Auto-scroll
  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = 0
  }, [filteredFeed.length])

  const openConversation = useCallback((execId: string) => {
    setSelectedExecId(execId)
    setConvoPanelOpen(true)
  }, [])

  // ─── Terminal lines from real execution streams ───
  const terminalLines = useMemo(() => {
    const lines: { id: string; html: string }[] = []
    for (const exec of executions.slice(0, 5)) {
      const events = streamEvents.get(exec.id) || []
      for (const ev of events.slice(-20)) {
        const time = new Date(ev.timestamp).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
        let html = ''
        if (ev.type === 'text') {
          html = `<span class="text-[#6c7086]">[${time}]</span> <span class="text-[#a6e3a1]">AGT</span> <span class="text-[#cdd6f4]">${ev.content?.slice(0, 120).replace(/</g, '&lt;') || ''}</span>`
        } else if (ev.type === 'tool_use') {
          html = `<span class="text-[#6c7086]">[${time}]</span> <span class="text-[#f9e2af]">TOOL</span> <span class="text-[#94e2d5]">${ev.toolName || 'unknown'}</span>`
        } else if (ev.type === 'tool_result') {
          html = `<span class="text-[#6c7086]">[${time}]</span> <span class="text-[#89b4fa]">RES</span> <span class="text-[#cdd6f4]">${ev.content?.slice(0, 100).replace(/</g, '&lt;') || '(ok)'}</span>`
        } else if (ev.type === 'error') {
          html = `<span class="text-[#6c7086]">[${time}]</span> <span class="text-[#f38ba8]">ERR</span> ${ev.content?.slice(0, 100).replace(/</g, '&lt;') || ''}`
        } else if (ev.type === 'status') {
          html = `<span class="text-[#6c7086]">[${time}]</span> <span class="text-[#a6e3a1]">STS</span> ${ev.content}`
        } else if (ev.type === 'complete') {
          html = `<span class="text-[#6c7086]">[${time}]</span> <span class="text-[#a6e3a1]">DONE</span> <span class="text-[#94e2d5]">${exec.taskTitle}</span>`
        } else {
          continue
        }
        lines.push({ id: `${ev.executionId}-${ev.timestamp}`, html })
      }
    }
    lines.sort((a, b) => a.id.localeCompare(b.id))
    return lines.slice(-40)
  }, [executions, streamEvents])

  const termRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight
  }, [terminalLines])

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
      <div className="bg-white border-l border-[#e6e2da] flex flex-col overflow-hidden w-[300px] shrink-0">
        {/* Header */}
        <div className="flex items-center gap-2 px-3.5 pt-3 pb-2 shrink-0">
          <span className="relative flex h-2 w-2">
            {isConnected ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2d9a4e] opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2d9a4e]" />
              </>
            ) : (
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#a19a8f]" />
            )}
          </span>
          <span className="text-[0.62rem] font-bold tracking-[0.1em] uppercase text-[#71695e]">
            Live Feed
          </span>
          <span className={cn(
            'text-[0.48rem] font-bold uppercase tracking-wider px-1.5 py-px rounded ml-auto',
            isConnected ? 'bg-[#2d9a4e]/10 text-[#2d9a4e]' : 'bg-[#a19a8f]/10 text-[#a19a8f]'
          )}>
            {isConnected ? 'Connected' : 'Offline'}
          </span>
        </div>

        {/* Tabs */}
        <div className="flex gap-[3px] px-3 pb-1.5 flex-wrap shrink-0">
          {TABS.map(tab => (
            <button
              key={tab.filter}
              onClick={() => setActiveTab(tab.filter)}
              className={cn(
                'text-[0.56rem] font-medium px-2 py-[2px] border rounded-full cursor-pointer transition-all flex items-center gap-1',
                activeTab === tab.filter
                  ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]'
                  : 'border-[#e6e2da] text-[#71695e] hover:bg-[#f4f1eb]'
              )}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={cn('text-[0.48rem] font-bold tabular-nums', activeTab === tab.filter ? 'text-white/70' : 'text-[#a19a8f]')}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Agent filters */}
        {feedAgents.size > 0 && (
          <div className="flex flex-wrap gap-1 px-3 pb-2 shrink-0">
            <button
              onClick={() => setActiveAgent(null)}
              className={cn(
                'text-[0.52rem] font-medium px-1.5 py-px border rounded-md transition-all',
                !activeAgent ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]' : 'border-[#e6e2da] text-[#71695e] hover:bg-[#f4f1eb]'
              )}
            >All</button>
            {[...feedAgents.entries()].slice(0, 8).map(([id, info]) => (
              <button
                key={id}
                onClick={() => setActiveAgent(activeAgent === id ? null : id)}
                className={cn(
                  'text-[0.52rem] font-medium px-1.5 py-px border rounded-md transition-all flex items-center gap-1',
                  activeAgent === id ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]' : 'border-[#e6e2da] text-[#71695e] hover:bg-[#f4f1eb]'
                )}
              >
                <span className="w-1 h-1 rounded-full" style={{ background: activeAgent === id ? '#fff' : info.color }} />
                {info.name}
              </button>
            ))}
          </div>
        )}

        {/* Feed messages */}
        <div ref={feedRef} className="flex-1 overflow-y-auto px-3 min-h-0">
          {hasData ? filteredFeed.map((item: UnifiedFeedItem) => {
            const dotColor = roleDotColor(item.role)
            const label = roleLabel(item.role)
            const name = item.agentName || item.activityEvent?.actorId || ''
            const content = item.content || item.activityEvent?.message || ''
            const isClickable = !!item.executionId

            return (
              <div
                key={item.id}
                className={cn(
                  'flex gap-2 py-[6px] border-b border-[#eeebe4]/70 animate-fade-in',
                  isClickable && 'cursor-pointer hover:bg-[#faf8f3] -mx-1 px-1 rounded'
                )}
                onClick={isClickable ? () => openConversation(item.executionId!) : undefined}
              >
                <span className="w-[5px] h-[5px] rounded-full mt-[5px] shrink-0" style={{ background: dotColor }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[0.64rem] text-[#1a1a1a] leading-snug">
                    {name && <span className="font-semibold text-[#d4870b]">{name} </span>}
                    <span className="text-[#4a4540]">{content.slice(0, 140)}</span>
                  </p>
                  <div className="flex items-center gap-1.5 mt-px">
                    <span className="text-[0.48rem] text-[#a19a8f] tabular-nums">{relativeTime(item.timestamp)}</span>
                    <span className={cn(
                      'text-[0.42rem] font-bold uppercase tracking-wider px-1 py-px rounded',
                      item.role === 'error' ? 'bg-[#cf4a3e]/8 text-[#cf4a3e]' :
                      item.role === 'agent' ? 'bg-[#2d9a4e]/8 text-[#2d9a4e]' :
                      item.role === 'tool' ? 'bg-[#d4870b]/8 text-[#d4870b]' :
                      'bg-[#3b7dd8]/6 text-[#3b7dd8]'
                    )}>{label}</span>
                    {item.taskTitle && <span className="text-[0.45rem] text-[#a19a8f] truncate max-w-[100px]">{item.taskTitle}</span>}
                  </div>
                </div>
                {isClickable && <span className="text-[0.6rem] text-[#c5c0b8] self-center shrink-0">›</span>}
              </div>
            )
          }) : (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <div className="w-9 h-9 rounded-full bg-[#f4f1eb] flex items-center justify-center text-[#c5c0b8] text-sm">~</div>
              <p className="text-[0.6rem] text-[#a19a8f] text-center leading-relaxed max-w-[200px]">
                No activity yet. Events appear when you create tasks, run agents, or execute missions.
              </p>
            </div>
          )}
        </div>

        {/* Terminal — real execution stream */}
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
          <div
            ref={termRef}
            className="bg-[#1e1e2e] font-mono text-[0.52rem] leading-relaxed px-3 py-1.5 h-[90px] overflow-y-auto text-[#cdd6f4]"
          >
            {hasTerminal ? terminalLines.map(line => (
              <div key={line.id} className="whitespace-nowrap animate-fade-in truncate" dangerouslySetInnerHTML={{ __html: line.html }} />
            )) : (
              <div className="flex items-center justify-center h-full text-[#6c7086] text-[0.5rem]">
                Awaiting agent execution streams...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Conversation Panel */}
      <ConversationPanel
        executionId={selectedExecId}
        open={convoPanelOpen}
        onOpenChange={setConvoPanelOpen}
      />
    </>
  )
}
