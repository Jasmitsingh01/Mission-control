import { useState, useEffect, useMemo } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import {
  Trash2,
  Save,
  Clock,
  X,
  CheckCircle2,
  FileText,
  FileCode,
  Terminal,
  Copy,
  Check,
  ExternalLink,
  File,
  Image,
  Link2,
  ChevronDown,
  ChevronUp,
  Download,
  AlertCircle,
} from 'lucide-react'
import { useTaskStore } from '@/stores/taskStore'
import { useExecutionStore } from '@/stores/executionStore'
import type { ArtifactInfo } from '@/stores/executionStore'
import { STATUS_LABELS, PRIORITY_LEVELS, PRIORITY_COLORS, PRIORITY_SYMBOLS, AGENTS, AGENT_MAP } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { Task } from '@/stores/taskStore'
import type { TaskStatus, Priority } from '@/lib/constants'

function getFileIcon(type: string, name: string) {
  const ext = name.split('.').pop()?.toLowerCase() || ''
  if (['ts', 'tsx', 'js', 'jsx', 'py', 'go', 'rs', 'java', 'c', 'cpp', 'rb', 'php', 'swift', 'kt'].includes(ext)) return FileCode
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico'].includes(ext)) return Image
  if (['html', 'css', 'scss', 'json', 'yaml', 'yml', 'toml', 'xml'].includes(ext)) return FileCode
  if (type === 'code' || type === 'script') return FileCode
  if (type === 'image') return Image
  return File
}

function extractLinks(text: string): { url: string; label: string }[] {
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g
  const matches = text.match(urlRegex) || []
  const unique = [...new Set(matches)]
  return unique.map((url) => {
    try {
      const u = new URL(url)
      return { url, label: u.hostname + (u.pathname !== '/' ? u.pathname.slice(0, 40) : '') }
    } catch {
      return { url, label: url.slice(0, 50) }
    }
  })
}

function extractCodeBlocks(text: string): { language: string; code: string }[] {
  const blocks: { language: string; code: string }[] = []
  const regex = /```(\w*)\n([\s\S]*?)```/g
  let match
  while ((match = regex.exec(text)) !== null) {
    blocks.push({ language: match[1] || 'text', code: match[2].trim() })
  }
  return blocks
}

function downloadAsFile(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

interface TaskDetailPanelProps {
  task: Task | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TaskDetailPanel({ task, open, onOpenChange }: TaskDetailPanelProps) {
  const { updateTask, deleteTask } = useTaskStore()
  const executions = useExecutionStore((s) => s.executions)
  const streamOutput = useExecutionStore((s) => s.streamOutput)
  const getArtifacts = useExecutionStore((s) => s.getArtifacts)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<TaskStatus>('backlog')
  const [priority, setPriority] = useState<Priority>('medium')
  const [assignee, setAssignee] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [hasChanges, setHasChanges] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [expandedCode, setExpandedCode] = useState<number | null>(null)
  const [showAllFiles, setShowAllFiles] = useState(false)

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description)
      setStatus(task.status)
      setPriority(task.priority)
      setAssignee(task.assignee || '')
      setTags([...(task.tags?.length ? task.tags : task.labels)])
      setHasChanges(false)
      setTagInput('')
      setCopied(null)
      setExpandedCode(null)
      setShowAllFiles(false)
    }
  }, [task])

  const execution = task?.executionId ? executions.find((e) => e.id === task.executionId) : null
  const executionOutput = task?.executionId ? streamOutput.get(task.executionId) || '' : ''
  const artifacts: ArtifactInfo[] = task?.executionId ? getArtifacts(task.executionId) : []
  const taskResult = task?.result || execution?.result || ''
  const isCompleted = task?.status === 'done'
  const isFailed = execution?.status === 'failed'

  const links = useMemo(() => extractLinks(taskResult || executionOutput), [taskResult, executionOutput])
  const codeBlocks = useMemo(() => extractCodeBlocks(taskResult || executionOutput), [taskResult, executionOutput])
  const cleanResultText = useMemo(() => {
    if (!taskResult) return ''
    return taskResult.replace(/```\w*\n[\s\S]*?```/g, '').trim()
  }, [taskResult])

  if (!task) return null

  const markChanged = () => setHasChanges(true)
  const agent = task.assignee ? AGENT_MAP[task.assignee] : null

  const handleSave = () => {
    updateTask(task.id, { title, description, status, priority, assignee: assignee || null, tags, labels: [] })
    setHasChanges(false)
  }

  const handleDelete = () => {
    deleteTask(task.id)
    onOpenChange(false)
  }

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase()
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag])
      setTagInput('')
      markChanged()
    }
  }

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
    markChanged()
  }

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const createdDate = new Date(task.createdAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
  const updatedDate = new Date(task.updatedAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  const hasOutputs = artifacts.length > 0 || links.length > 0 || codeBlocks.length > 0

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto bg-white border-l border-[#e6e2da] p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-[#eeebe4]">
          <div className="flex items-center justify-between pr-8">
            <SheetTitle className="text-left text-sm font-bold text-[#1a1a1a]">
              Task Details
            </SheetTitle>
            <span className={cn(
              'text-[0.6rem] font-bold uppercase tracking-[0.08em] px-2.5 py-1 rounded-md',
              isCompleted ? 'bg-[#e8f5e9] text-[#2d9a4e]' :
              isFailed ? 'bg-[#fce4ec] text-[#cf4a3e]' :
              'bg-[#f0ece5] text-[#71695e]'
            )}>
              {STATUS_LABELS[task.status]}
            </span>
          </div>
        </SheetHeader>

        <div className="space-y-5 px-6 py-6 animate-fade-in">
          {/* Title */}
          <div>
            <label className="text-[0.7rem] font-semibold text-[#71695e] mb-2 block">Title</label>
            <Input
              value={title}
              onChange={(e) => { setTitle(e.target.value); markChanged() }}
              className="text-base font-semibold text-[#1a1a1a] bg-[#faf8f3] border-[#e6e2da] rounded-lg focus:border-[#d4870b]"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-[0.7rem] font-semibold text-[#71695e] mb-2 block">Description</label>
            <textarea
              value={description}
              onChange={(e) => { setDescription(e.target.value); markChanged() }}
              rows={3}
              className="flex w-full rounded-lg border border-[#e6e2da] bg-[#faf8f3] px-3 py-2.5 text-sm text-[#1a1a1a] placeholder:text-[#a19a8f] focus:outline-none focus:border-[#d4870b] resize-none transition-all"
            />
          </div>

          {/* Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[0.7rem] font-semibold text-[#71695e]">Progress</label>
              <span className="text-[0.62rem] font-bold text-[#71695e]">{task.progress}%</span>
            </div>
            <div className="h-2 bg-[#f4f1eb] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${task.progress}%`, background: PRIORITY_COLORS[task.priority] }}
              />
            </div>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-[0.6rem] text-[#a19a8f]">
                📋 {task.subtasks[0]}/{task.subtasks[1]} subtasks
              </span>
              <span className="text-[0.6rem] text-[#a19a8f]">
                💬 {task.comments} comments
              </span>
              {task.commits > 0 && (
                <span className="text-[0.6rem] text-[#a19a8f]">
                  📝 {task.commits} commits
                </span>
              )}
            </div>
          </div>

          {/* Assignee */}
          <div>
            <label className="text-[0.7rem] font-semibold text-[#71695e] mb-2 block">Assignee</label>
            {agent && (
              <div className="flex items-center gap-2 mb-2 p-2 bg-[#faf8f3] rounded-lg border border-[#eeebe4]">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[0.7rem] font-bold text-white"
                  style={{ background: agent.color }}
                >
                  {agent.initial}
                </div>
                <div>
                  <div className="text-[0.78rem] font-semibold text-[#1a1a1a]">{agent.name}</div>
                  <div className="text-[0.62rem] text-[#71695e]">{agent.role}</div>
                </div>
              </div>
            )}
            <select
              value={assignee}
              onChange={(e) => { setAssignee(e.target.value); markChanged() }}
              className="flex h-9 w-full rounded-lg border border-[#e6e2da] bg-[#faf8f3] px-3 py-1 text-sm text-[#1a1a1a] focus:outline-none focus:border-[#d4870b] transition-all"
            >
              <option value="">Unassigned</option>
              {AGENTS.map((a) => (
                <option key={a.id} value={a.id}>{a.name} ({a.role})</option>
              ))}
            </select>
          </div>

          {/* Files / Artifacts */}
          {artifacts.length > 0 && (
            <div className="rounded-lg border border-[#eeebe4] bg-[#faf8f3] overflow-hidden animate-fade-in">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#eeebe4]">
                <div className="flex items-center gap-2">
                  <File className="h-3.5 w-3.5 text-[#3b7dd8]" />
                  <span className="text-xs font-semibold text-[#1a1a1a]">Files Created ({artifacts.length})</span>
                </div>
                {artifacts.length > 3 && (
                  <button onClick={() => setShowAllFiles(!showAllFiles)} className="text-xs text-[#3b7dd8] font-medium flex items-center gap-1">
                    {showAllFiles ? 'Show less' : 'Show all'}
                    {showAllFiles ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>
                )}
              </div>
              <div className="divide-y divide-[#eeebe4]">
                {(showAllFiles ? artifacts : artifacts.slice(0, 3)).map((artifact, i) => {
                  const Icon = getFileIcon(artifact.type, artifact.name)
                  return (
                    <div key={i} className="px-4 py-2.5 flex items-center gap-3 hover:bg-[#f4f1eb] transition-colors">
                      <Icon className="h-4 w-4 text-[#71695e] shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#1a1a1a] truncate">{artifact.name}</p>
                        <p className="text-[10px] text-[#a19a8f] font-mono truncate">{artifact.path}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {artifact.size && (
                          <span className="text-[10px] text-[#a19a8f] font-mono">
                            {artifact.size > 1024 ? `${(artifact.size / 1024).toFixed(1)}KB` : `${artifact.size}B`}
                          </span>
                        )}
                        {artifact.content && (
                          <>
                            <button onClick={() => handleCopy(artifact.content!, `art-${i}`)} className="p-1 rounded-lg hover:bg-[#f0ece5] transition-colors">
                              {copied === `art-${i}` ? <Check className="h-3.5 w-3.5 text-[#2d9a4e]" /> : <Copy className="h-3.5 w-3.5 text-[#a19a8f]" />}
                            </button>
                            <button onClick={() => downloadAsFile(artifact.content!, artifact.name)} className="p-1 rounded-lg hover:bg-[#f0ece5] transition-colors">
                              <Download className="h-3.5 w-3.5 text-[#a19a8f]" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Code Blocks */}
          {codeBlocks.length > 0 && (
            <div className="rounded-lg border border-[#eeebe4] bg-[#faf8f3] overflow-hidden animate-fade-in">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-[#eeebe4]">
                <FileCode className="h-3.5 w-3.5 text-[#3b7dd8]" />
                <span className="text-xs font-semibold text-[#1a1a1a]">Code Output ({codeBlocks.length})</span>
              </div>
              <div className="divide-y divide-[#eeebe4]">
                {codeBlocks.map((block, i) => (
                  <div key={i}>
                    <button onClick={() => setExpandedCode(expandedCode === i ? null : i)} className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-[#f4f1eb] transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-[#3b7dd8] bg-[#3b7dd8]/10 px-2 py-0.5 rounded-md font-semibold">{block.language || 'code'}</span>
                        <span className="text-xs text-[#a19a8f]">{block.code.split('\n').length} lines</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button onClick={(e) => { e.stopPropagation(); handleCopy(block.code, `code-${i}`) }} className="p-1 rounded-lg hover:bg-[#f0ece5] transition-colors">
                          {copied === `code-${i}` ? <Check className="h-3.5 w-3.5 text-[#2d9a4e]" /> : <Copy className="h-3.5 w-3.5 text-[#a19a8f]" />}
                        </button>
                        {expandedCode === i ? <ChevronUp className="h-3.5 w-3.5 text-[#a19a8f]" /> : <ChevronDown className="h-3.5 w-3.5 text-[#a19a8f]" />}
                      </div>
                    </button>
                    {expandedCode === i && (
                      <div className="px-4 pb-3 animate-fade-in">
                        <pre className="bg-[#1e1e2e] rounded-lg p-4 text-xs font-mono text-[#cdd6f4] overflow-x-auto max-h-72 overflow-y-auto whitespace-pre-wrap break-words leading-relaxed">
                          {block.code}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Links */}
          {links.length > 0 && (
            <div className="rounded-lg border border-[#eeebe4] bg-[#faf8f3] overflow-hidden animate-fade-in">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-[#eeebe4]">
                <Link2 className="h-3.5 w-3.5 text-[#d4870b]" />
                <span className="text-xs font-semibold text-[#1a1a1a]">Links & References ({links.length})</span>
              </div>
              <div className="divide-y divide-[#eeebe4]">
                {links.slice(0, 10).map((link, i) => (
                  <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#f4f1eb] transition-colors group">
                    <ExternalLink className="h-3.5 w-3.5 text-[#a19a8f] shrink-0 group-hover:text-[#3b7dd8] transition-colors" />
                    <span className="text-sm text-[#71695e] truncate group-hover:text-[#3b7dd8] transition-colors">{link.label}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Result / Output */}
          {(isCompleted || isFailed || taskResult || executionOutput) && (
            <div className={cn(
              'rounded-lg border p-4 animate-fade-in',
              isFailed ? 'bg-[#fce4ec] border-[#cf4a3e]/20'
                : isCompleted ? 'bg-[#e8f5e9] border-[#2d9a4e]/20'
                : 'bg-[#faf8f3] border-[#eeebe4]'
            )}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {isFailed ? <AlertCircle className="h-4 w-4 text-[#cf4a3e]" />
                    : isCompleted ? <CheckCircle2 className="h-4 w-4 text-[#2d9a4e]" />
                    : <FileText className="h-4 w-4 text-[#3b7dd8]" />}
                  <span className="text-xs font-semibold text-[#1a1a1a]">
                    {isFailed ? 'Error Output' : 'Task Result'}
                  </span>
                </div>
                {(taskResult || executionOutput) && (
                  <button onClick={() => handleCopy(taskResult || executionOutput, 'result')} className="text-xs text-[#71695e] hover:text-[#1a1a1a] flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-[#f0ece5]">
                    {copied === 'result' ? <Check className="h-3.5 w-3.5 text-[#2d9a4e]" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied === 'result' ? 'Copied' : 'Copy'}
                  </button>
                )}
              </div>
              {(cleanResultText || (!codeBlocks.length && taskResult)) ? (
                <div className="text-sm text-[#1a1a1a] leading-relaxed whitespace-pre-wrap break-words max-h-72 overflow-y-auto">
                  {cleanResultText || taskResult}
                </div>
              ) : executionOutput && !taskResult ? (
                <div className="bg-[#1e1e2e] rounded-lg p-3 max-h-72 overflow-y-auto">
                  <pre className="text-xs text-[#cdd6f4] font-mono whitespace-pre-wrap break-words leading-relaxed">
                    {executionOutput}
                  </pre>
                </div>
              ) : !hasOutputs ? (
                <p className="text-xs text-[#a19a8f]">No output yet.</p>
              ) : null}

              {execution && (
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#eeebe4] flex-wrap">
                  {execution.usage.durationMs > 0 && (
                    <span className="text-[10px] text-[#a19a8f] font-mono flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {(execution.usage.durationMs / 1000).toFixed(1)}s
                    </span>
                  )}
                  {execution.usage.totalTurns > 0 && (
                    <span className="text-[10px] text-[#a19a8f] font-mono flex items-center gap-1">
                      <Terminal className="h-3 w-3" /> {execution.usage.totalTurns} turns
                    </span>
                  )}
                  {execution.usage.outputTokens > 0 && (
                    <span className="text-[10px] text-[#a19a8f] font-mono">
                      {execution.usage.inputTokens + execution.usage.outputTokens} tokens
                    </span>
                  )}
                  {execution.usage.costUsd > 0 && (
                    <span className="text-[10px] text-[#a19a8f] font-mono">
                      ${execution.usage.costUsd.toFixed(4)}
                    </span>
                  )}
                  <span className={cn(
                    'text-[10px] font-mono font-semibold uppercase ml-auto',
                    execution.status === 'completed' ? 'text-[#2d9a4e]' :
                    execution.status === 'failed' ? 'text-[#cf4a3e]' :
                    execution.status === 'running' ? 'text-[#3b7dd8]' : 'text-[#a19a8f]'
                  )}>
                    {execution.status}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Status + Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[0.7rem] font-semibold text-[#71695e] mb-2 block">Status</label>
              <select
                value={status}
                onChange={(e) => { setStatus(e.target.value as TaskStatus); markChanged() }}
                className="flex h-9 w-full rounded-lg border border-[#e6e2da] bg-[#faf8f3] px-3 py-1 text-sm text-[#1a1a1a] focus:outline-none focus:border-[#d4870b] transition-all"
              >
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[0.7rem] font-semibold text-[#71695e] mb-2 block">Priority</label>
              <div className="flex gap-1">
                {PRIORITY_LEVELS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={cn(
                      "flex-1 h-9 rounded-lg text-[0.6rem] font-bold uppercase tracking-[0.06em] flex items-center justify-center gap-1 border transition-all",
                      priority === p
                        ? 'border-current text-white'
                        : 'border-[#eeebe4] bg-[#faf8f3] text-[#a19a8f] hover:text-[#71695e] hover:border-[#e6e2da]'
                    )}
                    style={priority === p ? { background: PRIORITY_COLORS[p], borderColor: PRIORITY_COLORS[p] } : undefined}
                    onClick={() => { setPriority(p); markChanged() }}
                  >
                    {PRIORITY_SYMBOLS[p]} {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="text-[0.7rem] font-semibold text-[#71695e] mb-2 block">Tags</label>
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="Add tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                className="flex-1 bg-[#faf8f3] border-[#e6e2da] text-sm rounded-lg"
              />
              <button type="button" onClick={addTag} className="text-xs font-semibold px-3 py-2 rounded-lg border border-[#e6e2da] text-[#71695e] hover:bg-[#f4f1eb] transition-all">
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 text-[0.55rem] font-medium bg-[#f0ece5] border border-[#eeebe4] text-[#6b6560] px-2 py-0.5 rounded-[3px]">
                  {tag}
                  <button onClick={() => removeTag(tag)} className="hover:text-[#cf4a3e] transition-colors"><X className="h-3 w-3" /></button>
                </span>
              ))}
              {tags.length === 0 && <span className="text-[10px] text-[#a19a8f]">No tags</span>}
            </div>
          </div>

          {/* Metadata */}
          <div className="bg-[#faf8f3] p-4 rounded-lg space-y-2.5 border border-[#eeebe4]">
            <span className="text-xs font-semibold text-[#71695e]">Metadata</span>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs text-[#71695e]"><Clock className="h-3 w-3 text-[#a19a8f]" />Created</span>
              <span className="font-mono text-[10px] text-[#a19a8f]">{createdDate}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs text-[#71695e]"><Clock className="h-3 w-3 text-[#a19a8f]" />Updated</span>
              <span className="font-mono text-[10px] text-[#a19a8f]">{updatedDate}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#71695e]">ID</span>
              <code className="font-mono text-[10px] text-[#a19a8f]">{task.id}</code>
            </div>
            {task.executionId && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#71695e]">Execution</span>
                <code className="font-mono text-[10px] text-[#3b7dd8]">{task.executionId}</code>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className={cn(
                "flex-1 text-sm font-semibold py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all",
                hasChanges ? 'bg-[#1a1a1a] text-white hover:opacity-85 active:scale-[0.98]'
                  : 'bg-[#f4f1eb] text-[#a19a8f] border border-[#eeebe4] cursor-not-allowed'
              )}
            >
              <Save className="h-4 w-4" />
              Save Changes
            </button>
            <button
              onClick={handleDelete}
              className="text-sm font-medium px-4 py-2.5 rounded-lg bg-[#fce4ec] text-[#cf4a3e] border border-[#cf4a3e]/15 hover:bg-[#cf4a3e]/15 transition-all"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
