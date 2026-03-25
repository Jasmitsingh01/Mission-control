import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, CheckCircle2, ArrowLeft } from 'lucide-react'
import { apiFetch } from '@/lib/api'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [devLink, setDevLink] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email) { setError('Please enter your email.'); return }
    setIsLoading(true)
    try {
      const data = await apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      })
      setSent(true)
      if (data.devResetUrl) setDevLink(data.devResetUrl)
    } catch (err: any) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 pt-16 bg-surface-dim">
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center">
              <span className="text-xs font-bold text-on-primary">AF</span>
            </div>
            <span className="text-lg font-bold tracking-tight text-on-surface">AgentForge</span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-on-surface">Reset password</h1>
          <p className="text-on-surface-variant mt-2 text-sm">Enter your email to receive a reset link</p>
        </div>

        <div className="bg-white rounded-xl border border-outline-variant/30 p-8">
          {!sent ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="rounded-lg bg-error/10 border border-error/20 px-4 py-3">
                  <p className="text-sm text-error">{error}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium mb-2 block text-on-surface">Email</label>
                <input
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface-container-lowest text-on-surface placeholder:text-outline border border-outline-variant/30 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="w-full bg-primary text-on-primary py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Reset Link'}
              </button>
            </form>
          ) : (
            <div className="text-center py-4 space-y-4">
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-secondary/10 mb-2">
                <CheckCircle2 className="h-7 w-7 text-secondary" />
              </div>
              <h3 className="font-semibold text-on-surface">Check your inbox</h3>
              <p className="text-sm text-on-surface-variant">
                If <strong>{email}</strong> is registered, a reset link has been sent.
              </p>
              {devLink && (
                <div className="bg-surface-container rounded-lg p-4 text-left">
                  <p className="text-xs font-mono text-secondary mb-2 uppercase tracking-widest">Dev Mode — Reset Link:</p>
                  <a href={devLink} className="text-xs text-primary break-all underline">{devLink}</a>
                </div>
              )}
            </div>
          )}
        </div>

        <p className="text-center text-sm text-on-surface-variant mt-6">
          <Link to="/login" className="text-primary hover:underline font-medium flex items-center justify-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to login
          </Link>
        </p>
      </div>
    </div>
  )
}
