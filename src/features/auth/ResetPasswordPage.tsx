import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { apiFetch } from '@/lib/api'

export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!password || !confirm) { setError('Please fill in all fields.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (!token) { setError('Missing reset token. Use the link from your email.'); return }

    setIsLoading(true)
    try {
      await apiFetch('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      })
      setDone(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to reset password.')
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
          <h1 className="text-2xl font-bold tracking-tight text-on-surface">New password</h1>
          <p className="text-on-surface-variant mt-2 text-sm">Choose a strong password for your account</p>
        </div>

        <div className="bg-white rounded-xl border border-outline-variant/30 p-8">
          {!done ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="rounded-lg bg-error/10 border border-error/20 px-4 py-3">
                  <p className="text-sm text-error">{error}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium mb-2 block text-on-surface">New Password</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-surface-container-lowest text-on-surface placeholder:text-outline border border-outline-variant/30 rounded-lg px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    autoFocus
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors">
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block text-on-surface">Confirm Password</label>
                <input
                  type="password"
                  placeholder="Same as above"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full bg-surface-container-lowest text-on-surface placeholder:text-outline border border-outline-variant/30 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-primary text-on-primary py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
                disabled={isLoading || !token}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Reset Password'}
              </button>
              {!token && (
                <p className="text-xs text-error text-center">No reset token found. Please use the link from your email.</p>
              )}
            </form>
          ) : (
            <div className="text-center py-4 space-y-4">
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-secondary/10 mb-2">
                <CheckCircle2 className="h-7 w-7 text-secondary" />
              </div>
              <h3 className="font-semibold text-on-surface">Password updated!</h3>
              <p className="text-sm text-on-surface-variant">Redirecting you to login in 3 seconds…</p>
            </div>
          )}
        </div>

        {!done && (
          <p className="text-center text-sm text-on-surface-variant mt-6">
            <Link to="/login" className="text-primary hover:underline font-medium">Back to login</Link>
          </p>
        )}
      </div>
    </div>
  )
}
