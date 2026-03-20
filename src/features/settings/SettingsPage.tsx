import { useState, useEffect } from 'react'
import { Monitor, Bell, Shield, Database, Palette, CreditCard, ExternalLink, CheckCircle2, Loader2 } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { useTheme } from '@/hooks/useTheme'
import { billingApi } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { Link } from 'react-router-dom'

const planColors: Record<string, string> = {
  free: 'text-outline',
  pro: 'text-primary',
  enterprise: 'text-purple-400',
}

export function SettingsPage() {
  const { theme, toggleTheme } = useTheme()
  const user = useAuthStore((s) => s.user)
  const [billingStatus, setBillingStatus] = useState<any>(null)
  const [billingLoading, setBillingLoading] = useState(false)
  const [billingError, setBillingError] = useState('')
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  useEffect(() => {
    loadBillingStatus()
  }, [])

  async function loadBillingStatus() {
    setBillingLoading(true)
    try {
      const data = await billingApi.status()
      setBillingStatus(data)
    } catch (e: any) {
      setBillingError(e.message)
    } finally {
      setBillingLoading(false)
    }
  }

  async function handleCheckout(plan: 'pro' | 'enterprise', interval: 'monthly' | 'annual' = 'monthly') {
    setCheckoutLoading(true)
    setBillingError('')
    try {
      const { url, configured } = await billingApi.createCheckout(plan, interval)
      if (configured === false) {
        setBillingError('Stripe is not configured. Add STRIPE_SECRET_KEY and price IDs to the server environment.')
        return
      }
      if (url) window.location.href = url
    } catch (e: any) {
      setBillingError(e.message)
    } finally {
      setCheckoutLoading(false)
    }
  }

  async function handlePortal() {
    setCheckoutLoading(true)
    setBillingError('')
    try {
      const { url } = await billingApi.createPortal()
      if (url) window.open(url, '_blank')
    } catch (e: any) {
      setBillingError(e.message)
    } finally {
      setCheckoutLoading(false)
    }
  }

  const [notifications, setNotifications] = useState({
    taskUpdates: true,
    agentErrors: true,
    jobCompletions: false,
    activityDigest: false,
  })

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="space-y-6 pb-8 max-w-3xl">
      <div>
        <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">Settings</h1>
        <p className="text-sm text-on-surface-variant mt-2">
          Configure your Mission Control instance
        </p>
      </div>

      {/* Appearance */}
      <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10">
        <div className="flex items-center gap-2 mb-4">
          <Palette className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm text-on-surface">Appearance</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-on-surface">Theme</p>
            <p className="font-mono text-[10px] uppercase tracking-widest text-outline mt-1">Switch between dark and light mode</p>
          </div>
          <button
            className="font-mono text-[10px] uppercase tracking-widest font-bold px-4 py-2 rounded-lg bg-surface-container-highest text-primary border border-primary/20 hover:bg-primary/10 transition-colors"
            onClick={toggleTheme}
          >
            {theme === 'dark' ? 'Dark' : 'Light'} Mode
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm text-on-surface">Notifications</span>
        </div>
        <div className="space-y-4">
          {[
            { key: 'taskUpdates' as const, label: 'Task Updates', desc: 'Get notified when tasks change status' },
            { key: 'agentErrors' as const, label: 'Agent Errors', desc: 'Alert when an agent encounters an error' },
            { key: 'jobCompletions' as const, label: 'Job Completions', desc: 'Notify when scheduled jobs finish' },
            { key: 'activityDigest' as const, label: 'Activity Digest', desc: 'Daily summary of all activity' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-on-surface">{item.label}</p>
                <p className="font-mono text-[10px] uppercase tracking-widest text-outline mt-0.5">{item.desc}</p>
              </div>
              <button
                onClick={() => toggleNotification(item.key)}
                className={cn(
                  'relative w-10 h-5 rounded-full transition-colors',
                  notifications[item.key] ? 'bg-primary' : 'bg-surface-container-highest'
                )}
              >
                <span
                  className={cn(
                    'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform',
                    notifications[item.key] && 'translate-x-5'
                  )}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* API Keys */}
      <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm text-on-surface">API Configuration</span>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-on-surface">OpenRouter (Mission Planner)</p>
              <p className="font-mono text-[11px] text-outline mt-0.5">
                {import.meta.env.VITE_OPENROUTER_API_KEY ? '••••••••' + import.meta.env.VITE_OPENROUTER_API_KEY.slice(-8) : 'Not configured'}
              </p>
            </div>
            <span className={cn(
              "font-mono text-[10px] uppercase tracking-widest font-bold px-2.5 py-1 rounded-full",
              import.meta.env.VITE_OPENROUTER_API_KEY
                ? 'bg-secondary/10 text-secondary border border-secondary/20'
                : 'bg-surface-container-highest text-outline'
            )}>
              {import.meta.env.VITE_OPENROUTER_API_KEY ? 'Active' : 'Missing'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-on-surface">Planner Model</p>
              <p className="font-mono text-[11px] text-outline mt-0.5">
                {import.meta.env.VITE_OPENROUTER_MODEL || 'google/gemini-2.0-flash-001'}
              </p>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-widest font-bold px-2.5 py-1 rounded-full bg-surface-container-highest text-outline">
              via .env
            </span>
          </div>
          <Separator className="my-2 bg-outline-variant/10" />
          {[
            { provider: 'Anthropic', configured: false },
            { provider: 'OpenAI', configured: false },
            { provider: 'Google AI', configured: false },
          ].map((key) => (
            <div key={key.provider} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-on-surface">{key.provider}</p>
                <p className="font-mono text-[11px] text-outline mt-0.5">
                  {key.configured ? '••••••••••••••••' : 'Not configured'}
                </p>
              </div>
              <button className="font-mono text-[10px] uppercase tracking-widest font-bold px-4 py-2 rounded-lg bg-surface-container-highest text-primary border border-primary/20 hover:bg-primary/10 transition-colors">
                {key.configured ? 'Update' : 'Add Key'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Billing */}
      <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm text-on-surface">Billing & Plan</span>
        </div>

        {billingError && (
          <div className="mb-4 bg-error/10 border border-error/20 rounded-lg px-3 py-2 text-sm text-error">{billingError}</div>
        )}

        {billingLoading ? (
          <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-outline" /></div>
        ) : (
          <div className="space-y-4">
            {/* Current plan */}
            <div className="flex items-center justify-between p-4 bg-surface-container rounded-xl border border-outline-variant/10">
              <div>
                <p className="text-sm font-medium text-on-surface">Current Plan</p>
                <p className={cn('font-mono text-lg font-bold capitalize mt-0.5', planColors[billingStatus?.plan || user?.plan || 'free'])}>
                  {billingStatus?.plan || user?.plan || 'Free'}
                </p>
                {billingStatus?.subscription?.currentPeriodEnd && (
                  <p className="font-mono text-[10px] text-outline mt-1">
                    Renews {new Date(billingStatus.subscription.currentPeriodEnd).toLocaleDateString()}
                  </p>
                )}
                {billingStatus?.subscription?.cancelAtPeriodEnd && (
                  <p className="font-mono text-[10px] text-error mt-1">Cancels at period end</p>
                )}
              </div>
              {(billingStatus?.plan === 'pro' || billingStatus?.plan === 'enterprise') && (
                <button
                  onClick={handlePortal}
                  disabled={checkoutLoading}
                  className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Manage billing
                </button>
              )}
            </div>

            {/* Upgrade options */}
            {(billingStatus?.plan === 'free' || !billingStatus?.plan) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { plan: 'pro' as const, price: '$29/mo', desc: 'Unlimited agents, missions, and API access', features: ['Unlimited agents', 'Mission Launcher', 'Memory Browser', 'API Access'] },
                  { plan: 'enterprise' as const, price: '$99/mo', desc: 'Advanced security, SSO, and dedicated support', features: ['Everything in Pro', 'SSO / SAML', 'Audit Logs', 'SLA'] },
                ].map((opt) => (
                  <div key={opt.plan} className="border border-outline-variant/30 rounded-xl p-4 space-y-3">
                    <div>
                      <p className="font-semibold capitalize text-on-surface">{opt.plan}</p>
                      <p className="font-mono text-sm text-primary font-bold">{opt.price}</p>
                      <p className="text-xs text-on-surface-variant mt-1">{opt.desc}</p>
                    </div>
                    <ul className="space-y-1">
                      {opt.features.map((f) => (
                        <li key={f} className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                          <CheckCircle2 className="h-3 w-3 text-secondary shrink-0" />{f}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => handleCheckout(opt.plan)}
                      disabled={checkoutLoading}
                      className="w-full synthetic-gradient text-white py-2 rounded-lg text-xs font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {checkoutLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : `Upgrade to ${opt.plan}`}
                    </button>
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-outline text-center">
              Need a custom plan?{' '}
              <Link to="/contact" className="text-primary hover:underline">Contact sales</Link>
            </p>
          </div>
        )}
      </div>

      {/* System */}
      <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10">
        <div className="flex items-center gap-2 mb-4">
          <Monitor className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm text-on-surface">System Info</span>
        </div>
        <div className="grid grid-cols-2 gap-y-3 gap-x-6">
          {[
            { label: 'Version', value: '1.0.0-beta' },
            { label: 'Runtime', value: 'Vite + React 19' },
            { label: 'Backend', value: 'Convex (pending setup)' },
            { label: 'Environment', value: 'Development' },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-widest text-outline font-bold">{item.label}</span>
              <span className="font-mono text-[11px] text-on-surface">{item.value}</span>
            </div>
          ))}
        </div>
        <Separator className="my-4 bg-outline-variant/10" />
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-outline" />
          <span className="font-mono text-[11px] text-outline">
            Currently using local Zustand stores. Connect Convex for real-time sync.
          </span>
        </div>
      </div>
    </div>
  )
}
