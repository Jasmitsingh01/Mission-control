import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Rocket, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react'
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
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary-container/10 rounded-full blur-[100px]" />
      </div>

      <motion.div
        className="relative w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <Rocket className="h-6 w-6 text-primary" />
            <span className="text-xl font-black tracking-tighter text-on-surface">AgentForge</span>
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight text-on-surface">Reset password</h1>
          <p className="text-on-surface-variant mt-2">Enter your email to receive a reset link</p>
        </div>

        <div className="glass-panel rounded-2xl border border-outline-variant/30 p-8">
          {!sent ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="rounded-xl bg-error/10 border border-error/20 px-4 py-3">
                  <p className="text-sm text-error">{error}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium mb-2 block text-on-surface font-mono">Email</label>
                <input
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface-container-lowest text-on-surface placeholder:text-outline border border-outline-variant/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-transparent"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="w-full synthetic-gradient text-white py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Reset Link'}
              </button>
            </form>
          ) : (
            <div className="text-center py-4 space-y-4">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-secondary/10 mb-2">
                <CheckCircle2 className="h-8 w-8 text-secondary" />
              </div>
              <h3 className="font-semibold text-on-surface">Check your inbox</h3>
              <p className="text-sm text-on-surface-variant">
                If <strong>{email}</strong> is registered, a reset link has been sent.
              </p>
              {devLink && (
                <div className="bg-surface-container rounded-xl p-4 text-left">
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
      </motion.div>
    </div>
  )
}
