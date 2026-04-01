/**
 * ConversationPanel — Full agent conversation view.
 *
 * Shows the complete chat thread for an execution:
 *  - User prompt
 *  - Agent responses (streamed text)
 *  - Tool calls and results
 *  - Artifacts produced
 *  - Errors
 *  - Execution stats (tokens, duration, cost)
 *
 * Opens as a Sheet from the right side.
 */

import { useEffect, useRef, useMemo } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Bot,
  User,
  Wrench,
  AlertCircle,
  CheckCircle2,
  FileText,
  Clock,
  Terminal,
  Copy,
  Check,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useConversationStore, type ConversationMessage } from '@/stores/conversationStore'
import { useExecutionStore } from '@/stores/executionStore'
import { useState, useCallback } from 'react'

interface ConversationPanelProps {
  executionId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const ROLE_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string; label: string }> = {
  user: { icon: <User className="w-3 h-3" />, color: 'text-[#3b7dd8]', bg: 'bg-[#3b7dd8]/8', label: 'You' },
  agent: { icon: <Bot className="w-3 h-3" />, color: 'text-[#2d9a4e]', bg: 'bg-[#2d9a4e]/8', label: 'Agent' },
  tool: { icon: <Wrench className="w-3 h-3" />, color: 'text-[#d4870b]', bg: 'bg-[#d4870b]/8', label: 'Tool' },
  error: { icon: <AlertCircle className="w-3 h-3" />, color: 'text-[#cf4a3e]', bg: 'bg-[#cf4a3e]/8', label: 'Error' },
  system: { icon: <Terminal className="w-3 h-3" />, color: 'text-[#71695e]', bg: 'bg-[#71695e]/8', label: 'System' },
  artifact: { icon: <FileText className="w-3 h-3" />, color: 'text-[#7c5cbf]', bg: 'bg-[#7c5cbf]/8', label: 'File' },
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function ConversationPanel({ executionId, open, onOpenChange }: ConversationPanelProps) {
  const getConversation = useConversationStore(s => s.getConversation)
  const executions = useExecutionStore(s => s.executions)
  const streamEvents = useExecutionStore(s => s.streamEvents)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Rebuild conversation when stream events change
  const conversation = useMemo(() => {
    if (!executionId) return null
    return getConversation(executionId)
  }, [executionId, getConversation, executions, streamEvents])

  const execution = executionId ? executions.find(e => e.id === executionId) : null
  const isRunning = execution?.status === 'running'

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [conversation?.messages.length])

  const handleCopy = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }, [])

  if (!conversation || !execution) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg bg-white border-l border-[#e6e2da] p-0">
          <div className="flex items-center justify-center h-full text-[#a19a8f] text-sm">
            No conversation selected
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  const statusColor = execution.status === 'completed' ? 'text-[#2d9a4e]'
    : execution.status === 'failed' ? 'text-[#cf4a3e]'
    : execution.status === 'running' ? 'text-[#3b7dd8]'
    : 'text-[#a19a8f]'

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg bg-white border-l border-[#e6e2da] p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-[#eeebe4] shrink-0">
          <div className="flex items-center justify-between pr-8">
            <div>
              <SheetTitle className="text-[0.85rem] font-bold text-[#1a1a1a] leading-tight">
                {conversation.agentName}
              </SheetTitle>
              <p className="text-[0.62rem] text-[#71695e] mt-0.5">{conversation.taskTitle}</p>
            </div>
            <div className="flex items-center gap-2">
              {isRunning && <Loader2 className="w-3.5 h-3.5 text-[#3b7dd8] animate-spin" />}
              <span className={cn('text-[0.5rem] font-bold uppercase tracking-wider', statusColor)}>
                {execution.status}
              </span>
            </div>
          </div>
        </SheetHeader>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-1 min-h-0">
          {conversation.messages.map((msg: ConversationMessage) => {
            const config = ROLE_CONFIG[msg.role] || ROLE_CONFIG.system
            const isAgent = msg.role === 'agent'
            const isLong = msg.content.length > 200

            return (
              <div key={msg.id} className={cn('flex gap-2 py-1.5 animate-fade-in', msg.role === 'user' ? 'flex-row-reverse' : '')}>
                {/* Avatar */}
                <div className={cn('w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5', config.bg)}>
                  <span className={config.color}>{config.icon}</span>
                </div>

                {/* Bubble */}
                <div className={cn(
                  'max-w-[85%] rounded-xl px-3 py-2 relative group',
                  msg.role === 'user' ? 'bg-[#3b7dd8] text-white rounded-tr-sm' :
                  msg.role === 'error' ? 'bg-[#cf4a3e]/8 border border-[#cf4a3e]/15' :
                  msg.role === 'tool' ? 'bg-[#f4f1eb] border border-[#eeebe4]' :
                  msg.role === 'artifact' ? 'bg-[#7c5cbf]/8 border border-[#7c5cbf]/15' :
                  'bg-[#faf8f3] border border-[#eeebe4]'
                )}>
                  {/* Role label */}
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={cn('text-[0.48rem] font-bold uppercase tracking-wider', msg.role === 'user' ? 'text-white/70' : config.color)}>
                      {config.label}
                    </span>
                    {msg.toolName && (
                      <span className="text-[0.48rem] font-mono text-[#d4870b] bg-[#d4870b]/10 px-1 rounded">
                        {msg.toolName}
                      </span>
                    )}
                    <span className={cn('text-[0.44rem] tabular-nums ml-auto', msg.role === 'user' ? 'text-white/50' : 'text-[#a19a8f]')}>
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>

                  {/* Content */}
                  <p className={cn(
                    'text-[0.68rem] leading-relaxed whitespace-pre-wrap break-words',
                    msg.role === 'user' ? 'text-white' :
                    msg.role === 'error' ? 'text-[#cf4a3e]' :
                    msg.role === 'tool' ? 'text-[#4a4540] font-mono text-[0.6rem]' :
                    'text-[#1a1a1a]'
                  )}>
                    {isLong ? msg.content.slice(0, 500) + '...' : msg.content}
                    {msg.streaming && (
                      <span className="inline-block w-1.5 h-3 bg-[#2d9a4e] ml-0.5 animate-pulse rounded-sm" />
                    )}
                  </p>

                  {/* Copy button */}
                  {isAgent && msg.content.length > 20 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleCopy(msg.content, msg.id) }}
                      className="absolute top-1.5 right-1.5 p-1 rounded-md bg-white/80 opacity-0 group-hover:opacity-100 transition-opacity border border-[#eeebe4]"
                    >
                      {copiedId === msg.id ? <Check className="w-2.5 h-2.5 text-[#2d9a4e]" /> : <Copy className="w-2.5 h-2.5 text-[#a19a8f]" />}
                    </button>
                  )}
                </div>
              </div>
            )
          })}

          {/* Streaming indicator */}
          {isRunning && (
            <div className="flex gap-2 py-1.5">
              <div className="w-6 h-6 rounded-full bg-[#2d9a4e]/8 flex items-center justify-center">
                <Bot className="w-3 h-3 text-[#2d9a4e]" />
              </div>
              <div className="bg-[#faf8f3] border border-[#eeebe4] rounded-xl px-3 py-2">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2d9a4e] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2d9a4e] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2d9a4e] animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Artifacts */}
        {conversation.artifacts.length > 0 && (
          <div className="px-4 py-2 border-t border-[#eeebe4] shrink-0">
            <p className="text-[0.52rem] font-bold uppercase tracking-wider text-[#71695e] mb-1.5">
              Files ({conversation.artifacts.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {conversation.artifacts.map((art, i) => (
                <div key={i} className="flex items-center gap-1.5 bg-[#faf8f3] border border-[#eeebe4] rounded-md px-2 py-1">
                  <FileText className="w-3 h-3 text-[#7c5cbf]" />
                  <span className="text-[0.58rem] text-[#1a1a1a] font-medium truncate max-w-[120px]">{art.name}</span>
                  {art.size && <span className="text-[0.48rem] text-[#a19a8f] font-mono">{art.size > 1024 ? `${(art.size/1024).toFixed(1)}K` : `${art.size}B`}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Execution Stats */}
        <div className="px-4 py-2.5 border-t border-[#eeebe4] bg-[#faf8f3] shrink-0">
          <div className="flex items-center gap-4 flex-wrap">
            {execution.usage.durationMs > 0 && (
              <span className="text-[0.52rem] text-[#71695e] font-mono flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#a19a8f]" />
                {(execution.usage.durationMs / 1000).toFixed(1)}s
              </span>
            )}
            {execution.usage.totalTurns > 0 && (
              <span className="text-[0.52rem] text-[#71695e] font-mono flex items-center gap-1">
                <Terminal className="w-3 h-3 text-[#a19a8f]" />
                {execution.usage.totalTurns} turns
              </span>
            )}
            {execution.usage.outputTokens > 0 && (
              <span className="text-[0.52rem] text-[#71695e] font-mono">
                {(execution.usage.inputTokens + execution.usage.outputTokens).toLocaleString()} tokens
              </span>
            )}
            {execution.usage.costUsd > 0 && (
              <span className="text-[0.52rem] text-[#71695e] font-mono">
                ${execution.usage.costUsd.toFixed(4)}
              </span>
            )}
            <span className={cn('text-[0.48rem] font-bold uppercase tracking-wider ml-auto', statusColor)}>
              {execution.status}
            </span>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
