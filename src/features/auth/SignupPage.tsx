import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

const benefits = [
  'Unlimited AI agents',
  'Real-time activity monitoring',
  'Mission Launcher with AI planning',
  'Skill marketplace access',
]

export function SignupPage() {
  const navigate = useNavigate()
  const { signup, isLoading } = useAuthStore()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!name || !email || !password) { setError('Please fill in all fields'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    const success = await signup(name, email, password)
    if (success) navigate('/dashboard')
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
          <h1 className="text-2xl font-bold tracking-tight text-on-surface">Create your account</h1>
          <p className="text-on-surface-variant mt-2 text-sm">Start orchestrating AI agents in minutes</p>
        </div>

        <div className="bg-card rounded-xl border border-outline-variant/30 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg bg-error/10 border border-error/20 px-4 py-3">
                <p className="text-sm text-error">{error}</p>
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-2 block text-on-surface">Full Name</label>
              <input
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-surface-container-lowest text-on-surface placeholder:text-outline border border-outline-variant/30 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                autoFocus
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block text-on-surface">Email</label>
              <input
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface-container-lowest text-on-surface placeholder:text-outline border border-outline-variant/30 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block text-on-surface">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface-container-lowest text-on-surface placeholder:text-outline border border-outline-variant/30 rounded-lg px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Benefits */}
            <div className="space-y-2 pt-1">
              {benefits.map((b) => (
                <div key={b} className="flex items-center gap-2 text-xs text-on-surface-variant">
                  <CheckCircle2 className="h-3.5 w-3.5 text-secondary shrink-0" />
                  {b}
                </div>
              ))}
            </div>

            <button
              type="submit"
              className="w-full bg-primary text-on-primary py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Create Account'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-on-surface-variant mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:underline font-medium">Log in</Link>
        </p>
      </div>
    </div>
  )
}
