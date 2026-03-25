import { useState, useEffect, useCallback } from 'react'
import { Send, Link2, Unlink, CheckCircle2, Copy, Loader2, RefreshCw, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { telegramApi } from '@/lib/api'

export function TelegramSettings() {
  const [linked, setLinked] = useState(false)
  const [linkCode, setLinkCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const fetchStatus = useCallback(async () => {
    setLoading(true)
    try {
      const data = await telegramApi.status()
      setLinked(data.linked || false)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  const handleGenerateCode = async () => {
    setActionLoading(true)
    setError('')
    try {
      const data = await telegramApi.generateLinkCode()
      setLinkCode(data.code)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleUnlink = async () => {
    setActionLoading(true)
    setError('')
    try {
      await telegramApi.unlink()
      setLinked(false)
      setLinkCode(null)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setActionLoading(false)
    }
  }

  const copyCode = () => {
    if (!linkCode) return
    navigator.clipboard.writeText(`/link ${linkCode}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10">
        <div className="flex items-center gap-2 mb-4">
          <Send className="h-4 w-4 text-[#0088cc]" />
          <span className="font-semibold text-sm text-on-surface">Telegram Integration</span>
        </div>
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-outline" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10">
      <div className="flex items-center gap-2 mb-4">
        <Send className="h-4 w-4 text-[#0088cc]" />
        <span className="font-semibold text-sm text-on-surface">Telegram Integration</span>
        {linked && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 text-[10px] font-bold uppercase">
            <CheckCircle2 className="h-3 w-3" /> Linked
          </span>
        )}
      </div>

      <p className="text-xs text-on-surface-variant mb-4">
        Connect your Telegram to manage tasks, get notifications, and interact with agents directly from Telegram.
      </p>

      {error && (
        <div className="mb-4 flex items-center gap-2 bg-error/10 border border-error/20 rounded-lg px-3 py-2 text-sm text-error">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {linked ? (
        <div className="space-y-4">
          {/* What you can do */}
          <div className="bg-surface-container rounded-xl p-4 border border-outline-variant/10">
            <p className="font-mono text-[10px] uppercase tracking-widest text-outline font-bold mb-3">Available Commands</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { cmd: '/tasks', desc: 'List all your tasks' },
                { cmd: '/task <id>', desc: 'View task details' },
                { cmd: '/done <id>', desc: 'Mark task as done' },
                { cmd: '/create <title>', desc: 'Create a new task' },
                { cmd: '/status', desc: 'Active missions & agents' },
                { cmd: '/help', desc: 'Show all commands' },
              ].map((item) => (
                <div key={item.cmd} className="flex items-start gap-2 text-xs">
                  <code className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono text-[10px] shrink-0">{item.cmd}</code>
                  <span className="text-on-surface-variant">{item.desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleUnlink}
              disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-error bg-error/10 border border-error/20 rounded-lg hover:bg-error/20 disabled:opacity-50 transition-colors"
            >
              {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Unlink className="h-3.5 w-3.5" />}
              Unlink Telegram
            </button>
            <button
              onClick={fetchStatus}
              className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-on-surface-variant bg-surface-container border border-outline-variant/20 rounded-lg hover:bg-surface-container-high transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Step by step */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full synthetic-gradient flex items-center justify-center text-white text-xs font-bold shrink-0">1</div>
              <div>
                <p className="text-sm font-medium text-on-surface">Open our Telegram bot</p>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Search for <code className="px-1 py-0.5 rounded bg-surface-container text-primary text-[11px]">@MissionControlBot</code> on Telegram or click the link below
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full synthetic-gradient flex items-center justify-center text-white text-xs font-bold shrink-0">2</div>
              <div>
                <p className="text-sm font-medium text-on-surface">Generate a link code</p>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Click the button below to generate a one-time code (expires in 5 minutes)
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full synthetic-gradient flex items-center justify-center text-white text-xs font-bold shrink-0">3</div>
              <div>
                <p className="text-sm font-medium text-on-surface">Send the code to the bot</p>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Send <code className="px-1 py-0.5 rounded bg-surface-container text-primary text-[11px]">/link YOUR_CODE</code> to the bot
                </p>
              </div>
            </div>
          </div>

          {/* Generate code / Show code */}
          {linkCode ? (
            <div className="bg-surface-container rounded-xl p-4 border border-primary/20 space-y-3">
              <p className="font-mono text-[10px] uppercase tracking-widest text-primary font-bold">Your Link Code</p>
              <div className="flex items-center gap-3">
                <code className="flex-1 text-2xl font-bold text-center text-on-surface font-mono tracking-[0.5em] py-2 bg-surface-container-lowest rounded-lg border border-outline-variant/20">
                  {linkCode}
                </code>
                <button
                  onClick={copyCode}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors text-xs"
                >
                  {copied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p className="text-[10px] text-outline text-center">
                Send <code className="text-primary">/link {linkCode}</code> to the bot. Expires in 5 minutes.
              </p>
            </div>
          ) : (
            <button
              onClick={handleGenerateCode}
              disabled={actionLoading}
              className="w-full synthetic-gradient text-white py-2.5 rounded-lg text-xs font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Link2 className="h-3.5 w-3.5" />}
              Generate Link Code
            </button>
          )}

          <button
            onClick={fetchStatus}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-on-surface-variant bg-surface-container border border-outline-variant/20 rounded-lg hover:bg-surface-container-high transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Check Link Status
          </button>
        </div>
      )}
    </div>
  )
}
