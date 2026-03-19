import { useState } from 'react'
import { Monitor, Bell, Shield, Database, Palette } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { useTheme } from '@/hooks/useTheme'

export function SettingsPage() {
  const { theme, toggleTheme } = useTheme()
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
