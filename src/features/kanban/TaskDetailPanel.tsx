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
  Bot,
  X,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Minus,
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
} from 'lucide-react'
import { useTaskStore } from '@/stores/taskStore'
import { useExecutionStore } from '@/stores/executionStore'
import type { ArtifactInfo } from '@/stores/executionStore'
import { STATUS_LABELS, PRIORITY_LEVELS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { Task } from '@/stores/taskStore'
import type { TaskStatus, Priority } from '@/lib/constants'

const priorityIcons: Record<Priority, React.ComponentType<{ className?: string }>> = {
  critical: AlertCircle,
  high: ArrowUp,
  medium: Minus,
  low: ArrowDown,
}

const priorityColors: Record<Priority, string> = {
  critical: 'bg-error/20 text-error border-error/30',
  high: 'bg-tertiary/20 text-tertiary border-tertiary/30',
  medium: 'bg-primary/20 text-primary border-primary/30',
  low: 'bg-surface-container-highest text-on-surface-variant border-outline-variant/20',
}

function getFileIcon(type: string, name: string) {
  const ext = name.split('.').pop()?.toLowerCase() || ''
  if (['ts', 'tsx', 'js', 'jsx', 'py', 'go', 'rs', 'java', 'c', 'cpp', 'rb', 'php', 'swift', 'kt'].includes(ext)) return FileCode
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico'].includes(ext)) return Image
  if (['html', 'css', 'scss', 'json', 'yaml', 'yml', 'toml', 'xml'].includes(ext)) return FileCode
  if (type === 'code' || type === 'script') return FileCode
  if (type === 'image') return Image
  return File
}

/** Extract URLs from text */
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

/** Extract code blocks from text */
function extractCodeBlocks(text: string): { language: string; code: string }[] {
  const blocks: { language: string; code: string }[] = []
  const regex = /```(\w*)\n([\s\S]*?)```/g
  let match
  while ((match = regex.exec(text)) !== null) {
    blocks.push({ language: match[1] || 'text', code: match[2].trim() })
  }
  return blocks
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
  const [status, setStatus] = useState<TaskStatus>('inbox')
  const [priority, setPriority] = useState<Priority>('medium')
  const [labels, setLabels] = useState<string[]>([])
  const [labelInput, setLabelInput] = useState('')
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
      setLabels([...task.labels])
      setHasChanges(false)
      setLabelInput('')
      setCopied(null)
      setExpandedCode(null)
      setShowAllFiles(false)
    }
  }, [task])

  // Derived data
  const execution = task?.executionId ? executions.find((e) => e.id === task.executionId) : null
  const executionOutput = task?.executionId ? streamOutput.get(task.executionId) || '' : ''
  const artifacts: ArtifactInfo[] = task?.executionId ? getArtifacts(task.executionId) : []
  const taskResult = task?.result || execution?.result || ''
  const isCompleted = task?.status === 'done'
  const isFailed = execution?.status === 'failed'

  // Extract links and code blocks from result
  const links = useMemo(() => extractLinks(taskResult || executionOutput), [taskResult, executionOutput])
  const codeBlocks = useMemo(() => extractCodeBlocks(taskResult || executionOutput), [taskResult, executionOutput])

  if (!task) return null

  const markChanged = () => setHasChanges(true)

  const handleSave = () => {
    updateTask(task.id, { title, description, status, priority, labels })
    setHasChanges(false)
  }

  const handleDelete = () => {
    deleteTask(task.id)
    onOpenChange(false)
  }

  const addLabel = () => {
    const label = labelInput.trim().toLowerCase()
    if (label && !labels.includes(label)) {
      setLabels([...labels, label])
      setLabelInput('')
      markChanged()
    }
  }

  const removeLabel = (label: string) => {
    setLabels(labels.filter((l) => l !== label))
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
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto bg-surface-container-low border-l border-outline-variant/20 p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-outline-variant/10">
          <SheetTitle className="text-left pr-8 text-sm font-semibold text-on-surface-variant">
            Task Details
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-5 px-6 py-6">
          {/* Title */}
          <div>
            <label className="text-xs font-medium text-on-surface-variant mb-2 block">Title</label>
            <Input
              value={title}
              onChange={(e) => { setTitle(e.target.value); markChanged() }}
              className="text-base font-semibold text-on-surface bg-surface-container-lowest border-outline-variant/20 focus:border-primary/50 focus:ring-primary/20"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-medium text-on-surface-variant mb-2 block">Description</label>
            <textarea
              value={description}
              onChange={(e) => { setDescription(e.target.value); markChanged() }}
              rows={3}
              className="flex w-full rounded-lg border border-outline-variant/20 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 resize-none"
            />
          </div>

          {/* ===== FILES / ARTIFACTS ===== */}
          {artifacts.length > 0 && (
            <div className="rounded-lg border border-outline-variant/20 bg-surface-container overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/10">
                <div className="flex items-center gap-2">
                  <File className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold text-on-surface">Files Created ({artifacts.length})</span>
                </div>
                {artifacts.length > 3 && (
                  <button
                    onClick={() => setShowAllFiles(!showAllFiles)}
                    className="text-xs text-primary flex items-center gap-1"
                  >
                    {showAllFiles ? 'Show less' : `Show all`}
                    {showAllFiles ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>
                )}
              </div>
              <div className="divide-y divide-outline-variant/10">
                {(showAllFiles ? artifacts : artifacts.slice(0, 3)).map((artifact, i) => {
                  const Icon = getFileIcon(artifact.type, artifact.name)
                  return (
                    <div key={i} className="px-4 py-2.5 flex items-center gap-3 hover:bg-surface-container-high/50 transition-colors">
                      <Icon className="h-4 w-4 text-on-surface-variant shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-on-surface truncate">{artifact.name}</p>
                        <p className="text-[10px] text-outline font-mono truncate">{artifact.path}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {artifact.size && (
                          <span className="text-[10px] text-outline font-mono">
                            {artifact.size > 1024 ? `${(artifact.size / 1024).toFixed(1)}KB` : `${artifact.size}B`}
                          </span>
                        )}
                        {artifact.content && (
                          <button
                            onClick={() => handleCopy(artifact.content!, `art-${i}`)}
                            className="p-1 rounded hover:bg-surface-container-highest transition-colors"
                            title="Copy content"
                          >
                            {copied === `art-${i}` ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 text-outline" />}
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ===== CODE BLOCKS ===== */}
          {codeBlocks.length > 0 && (
            <div className="rounded-lg border border-outline-variant/20 bg-surface-container overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-outline-variant/10">
                <FileCode className="h-4 w-4 text-secondary" />
                <span className="text-xs font-semibold text-on-surface">Code Output ({codeBlocks.length})</span>
              </div>
              <div className="divide-y divide-outline-variant/10">
                {codeBlocks.map((block, i) => (
                  <div key={i}>
                    <button
                      onClick={() => setExpandedCode(expandedCode === i ? null : i)}
                      className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-surface-container-high/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-secondary bg-secondary/10 px-2 py-0.5 rounded">
                          {block.language || 'code'}
                        </span>
                        <span className="text-xs text-on-surface-variant">
                          {block.code.split('\n').length} lines
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCopy(block.code, `code-${i}`) }}
                          className="p-1 rounded hover:bg-surface-container-highest transition-colors"
                        >
                          {copied === `code-${i}` ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 text-outline" />}
                        </button>
                        {expandedCode === i ? <ChevronUp className="h-3.5 w-3.5 text-outline" /> : <ChevronDown className="h-3.5 w-3.5 text-outline" />}
                      </div>
                    </button>
                    {expandedCode === i && (
                      <div className="px-4 pb-3">
                        <pre className="bg-surface-container-lowest rounded-lg p-3 text-xs font-mono text-on-surface overflow-x-auto max-h-64 overflow-y-auto whitespace-pre-wrap break-words">
                          {block.code}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===== LINKS / URLs ===== */}
          {links.length > 0 && (
            <div className="rounded-lg border border-outline-variant/20 bg-surface-container overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-outline-variant/10">
                <Link2 className="h-4 w-4 text-tertiary" />
                <span className="text-xs font-semibold text-on-surface">Links & References ({links.length})</span>
              </div>
              <div className="divide-y divide-outline-variant/10">
                {links.slice(0, 10).map((link, i) => (
                  <a
                    key={i}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-container-high/50 transition-colors group"
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-outline shrink-0 group-hover:text-primary" />
                    <span className="text-sm text-on-surface-variant truncate group-hover:text-primary transition-colors">
                      {link.label}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* ===== RESULT / OUTPUT ===== */}
          {(isCompleted || isFailed || taskResult || executionOutput) && (
            <div className={cn(
              'rounded-lg border p-4',
              isFailed ? 'bg-error/5 border-error/20'
                : isCompleted ? 'bg-green-500/5 border-green-500/20'
                : 'bg-surface-container border-outline-variant/20'
            )}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {isFailed ? <AlertCircle className="h-4 w-4 text-error" />
                    : isCompleted ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                    : <FileText className="h-4 w-4 text-primary" />}
                  <span className="text-xs font-semibold text-on-surface">
                    {isFailed ? 'Error Output' : 'Task Result'}
                  </span>
                </div>
                {(taskResult || executionOutput) && (
                  <button
                    onClick={() => handleCopy(taskResult || executionOutput, 'result')}
                    className="text-xs text-on-surface-variant hover:text-on-surface flex items-center gap-1 transition-colors"
                  >
                    {copied === 'result' ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied === 'result' ? 'Copied' : 'Copy'}
                  </button>
                )}
              </div>

              {taskResult ? (
                <div className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap break-words max-h-64 overflow-y-auto">
                  {taskResult}
                </div>
              ) : executionOutput ? (
                <div className="bg-surface-container-lowest rounded-lg p-3 max-h-64 overflow-y-auto">
                  <pre className="text-xs text-on-surface-variant font-mono whitespace-pre-wrap break-words">
                    {executionOutput}
                  </pre>
                </div>
              ) : (
                <p className="text-xs text-outline">No output yet.</p>
              )}

              {/* Execution stats */}
              {execution && (
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-outline-variant/10 flex-wrap">
                  {execution.usage.durationMs > 0 && (
                    <span className="text-[10px] text-on-surface-variant font-mono flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {(execution.usage.durationMs / 1000).toFixed(1)}s
                    </span>
                  )}
                  {execution.usage.totalTurns > 0 && (
                    <span className="text-[10px] text-on-surface-variant font-mono flex items-center gap-1">
                      <Terminal className="h-3 w-3" />
                      {execution.usage.totalTurns} turns
                    </span>
                  )}
                  {execution.usage.outputTokens > 0 && (
                    <span className="text-[10px] text-on-surface-variant font-mono">
                      {execution.usage.inputTokens + execution.usage.outputTokens} tokens
                    </span>
                  )}
                  {execution.usage.costUsd > 0 && (
                    <span className="text-[10px] text-on-surface-variant font-mono">
                      ${execution.usage.costUsd.toFixed(4)}
                    </span>
                  )}
                  <span className={cn(
                    'text-[10px] font-mono font-medium uppercase ml-auto',
                    execution.status === 'completed' ? 'text-green-500' :
                    execution.status === 'failed' ? 'text-error' :
                    execution.status === 'running' ? 'text-secondary' : 'text-outline'
                  )}>
                    {execution.status}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Status + Priority */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="text-xs font-medium text-on-surface-variant mb-2 block">Status</label>
              <select
                value={status}
                onChange={(e) => { setStatus(e.target.value as TaskStatus); markChanged() }}
                className="flex h-9 w-full rounded-lg border border-outline-variant/20 bg-surface-container-lowest px-3 py-1 text-sm text-on-surface focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
              >
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-on-surface-variant mb-2 block">Priority</label>
              <div className="flex gap-1.5">
                {PRIORITY_LEVELS.map((p) => {
                  const Icon = priorityIcons[p]
                  return (
                    <button
                      key={p}
                      type="button"
                      className={cn(
                        "flex-1 h-9 rounded-lg text-[10px] font-medium uppercase tracking-wider flex items-center justify-center gap-1 border transition-colors",
                        priority === p ? priorityColors[p]
                          : 'border-outline-variant/10 bg-surface-container text-outline hover:text-on-surface-variant hover:border-outline-variant/30'
                      )}
                      onClick={() => { setPriority(p); markChanged() }}
                    >
                      <Icon className="h-3 w-3" />
                      {p}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Labels */}
          <div>
            <label className="text-xs font-medium text-on-surface-variant mb-2 block">Labels</label>
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="Add label..."
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addLabel() } }}
                className="flex-1 bg-surface-container-lowest border-outline-variant/20 text-sm"
              />
              <button type="button" onClick={addLabel} className="text-xs font-medium px-3 py-2 rounded-lg border border-outline-variant/20 text-on-surface-variant hover:bg-surface-container-high transition-colors">
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {labels.map((label) => (
                <span key={label} className="inline-flex items-center gap-1 text-[10px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded">
                  {label}
                  <button onClick={() => removeLabel(label)} className="hover:text-error transition-colors"><X className="h-3 w-3" /></button>
                </span>
              ))}
              {labels.length === 0 && <span className="text-[10px] text-outline">No labels</span>}
            </div>
          </div>

          {/* Metadata */}
          <div className="bg-surface-container p-3 rounded-lg space-y-2.5">
            <span className="text-xs font-medium text-on-surface-variant">Metadata</span>
            {task.assignedAgentId && (
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs text-on-surface-variant"><Bot className="h-3 w-3 text-secondary" />Assigned Agent</span>
                <code className="font-mono text-[10px] text-primary">{task.assignedAgentId}</code>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs text-on-surface-variant"><Clock className="h-3 w-3 text-outline" />Created</span>
              <span className="font-mono text-[10px] text-on-surface-variant">{createdDate}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs text-on-surface-variant"><Clock className="h-3 w-3 text-outline" />Updated</span>
              <span className="font-mono text-[10px] text-on-surface-variant">{updatedDate}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-on-surface-variant">ID</span>
              <code className="font-mono text-[10px] text-outline">{task.id}</code>
            </div>
            {task.executionId && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-on-surface-variant">Execution</span>
                <code className="font-mono text-[10px] text-secondary">{task.executionId}</code>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className={cn(
                "flex-1 text-sm font-semibold py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors",
                hasChanges ? 'bg-primary text-on-primary hover:bg-primary/90'
                  : 'bg-surface-container text-outline border border-outline-variant/10 cursor-not-allowed'
              )}
            >
              <Save className="h-4 w-4" />
              Save Changes
            </button>
            <button
              onClick={handleDelete}
              className="text-sm font-medium px-4 py-2.5 rounded-lg bg-error/10 text-error border border-error/20 hover:bg-error/20 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
