import { Brain } from 'lucide-react'

export function MemoryPage() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground">
      <Brain className="h-12 w-12 mb-4 text-primary/50" />
      <h2 className="text-xl font-semibold text-foreground">Memory Browser</h2>
      <p className="text-sm mt-1">Memory browser coming in Phase 6</p>
    </div>
  )
}
