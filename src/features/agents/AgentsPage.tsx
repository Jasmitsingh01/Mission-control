import { Bot } from 'lucide-react'

export function AgentsPage() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground">
      <Bot className="h-12 w-12 mb-4 text-primary/50" />
      <h2 className="text-xl font-semibold text-foreground">Agents</h2>
      <p className="text-sm mt-1">Agent spawn control coming in Phase 3</p>
    </div>
  )
}
