import { Monitor, Bell, Shield, Database, Palette } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useTheme } from '@/hooks/useTheme'

export function SettingsPage() {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Configure your Mission Control instance
        </p>
      </div>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Theme</p>
              <p className="text-xs text-muted-foreground">Switch between dark and light mode</p>
            </div>
            <Button variant="outline" size="sm" onClick={toggleTheme} className="capitalize">
              {theme === 'dark' ? 'Dark' : 'Light'} Mode
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: 'Task Updates', desc: 'Get notified when tasks change status', enabled: true },
            { label: 'Agent Errors', desc: 'Alert when an agent encounters an error', enabled: true },
            { label: 'Job Completions', desc: 'Notify when scheduled jobs finish', enabled: false },
            { label: 'Activity Digest', desc: 'Daily summary of all activity', enabled: false },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <Badge variant={item.enabled ? 'default' : 'secondary'} className="text-xs cursor-pointer">
                {item.enabled ? 'On' : 'Off'}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* API Keys */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            API Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">OpenRouter (Mission Planner)</p>
              <p className="text-xs text-muted-foreground font-mono">
                {import.meta.env.VITE_OPENROUTER_API_KEY ? '••••••••' + import.meta.env.VITE_OPENROUTER_API_KEY.slice(-8) : 'Not configured'}
              </p>
            </div>
            <Badge variant={import.meta.env.VITE_OPENROUTER_API_KEY ? 'default' : 'secondary'} className="text-xs">
              {import.meta.env.VITE_OPENROUTER_API_KEY ? 'Active' : 'Missing'}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Planner Model</p>
              <p className="text-xs text-muted-foreground font-mono">
                {import.meta.env.VITE_OPENROUTER_MODEL || 'google/gemini-2.0-flash-001'}
              </p>
            </div>
            <Badge variant="secondary" className="text-xs">via .env</Badge>
          </div>
          <Separator className="my-2" />
          {[
            { provider: 'Anthropic', configured: false },
            { provider: 'OpenAI', configured: false },
            { provider: 'Google AI', configured: false },
          ].map((key) => (
            <div key={key.provider} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{key.provider}</p>
                <p className="text-xs text-muted-foreground font-mono">
                  {key.configured ? '••••••••••••••••' : 'Not configured'}
                </p>
              </div>
              <Button variant="outline" size="sm" className="text-xs">
                {key.configured ? 'Update' : 'Add Key'}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* System */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            System Info
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-y-2 gap-x-6 text-sm">
            <span className="text-muted-foreground">Version</span>
            <span className="font-mono">1.0.0-beta</span>
            <span className="text-muted-foreground">Runtime</span>
            <span className="font-mono">Vite + React 19</span>
            <span className="text-muted-foreground">Backend</span>
            <span className="font-mono">Convex (pending setup)</span>
            <span className="text-muted-foreground">Environment</span>
            <span className="font-mono">Development</span>
          </div>
          <Separator className="my-4" />
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Currently using local Zustand stores. Connect Convex for real-time sync.
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
