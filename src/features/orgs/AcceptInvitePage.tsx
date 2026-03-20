import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { useOrgStore } from '@/stores/orgStore'
import { useAuthStore } from '@/stores/authStore'

export function AcceptInvitePage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const acceptInvitation = useOrgStore((s) => s.acceptInvitation)

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!isAuthenticated) {
      // Store invite token and redirect to login
      localStorage.setItem('mc_pending_invite', token || '')
      navigate('/login')
      return
    }

    if (!token) {
      setStatus('error')
      setMessage('Invalid invitation link.')
      return
    }

    acceptInvitation(token)
      .then(() => {
        setStatus('success')
        setMessage('You have joined the organization!')
        localStorage.removeItem('mc_pending_invite')
        setTimeout(() => navigate('/dashboard'), 2000)
      })
      .catch((err) => {
        setStatus('error')
        setMessage(err.message || 'Failed to accept invitation.')
      })
  }, [token, isAuthenticated])

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="bg-surface-container-low rounded-2xl p-8 w-full max-w-sm border border-outline-variant/10 shadow-xl text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-on-surface text-sm">Accepting invitation...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle2 className="h-8 w-8 text-primary mx-auto mb-4" />
            <p className="text-on-surface text-sm font-medium">{message}</p>
            <p className="text-outline text-xs mt-2">Redirecting to dashboard...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <AlertCircle className="h-8 w-8 text-error mx-auto mb-4" />
            <p className="text-on-surface text-sm font-medium">{message}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="mt-4 h-9 px-4 rounded-lg bg-primary text-on-primary font-mono text-[11px] uppercase tracking-widest font-bold hover:bg-primary/90 transition-colors"
            >
              Go to Dashboard
            </button>
          </>
        )}
      </div>
    </div>
  )
}
