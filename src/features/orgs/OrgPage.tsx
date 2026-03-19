import { Building2 } from 'lucide-react'

export function OrgPage() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground">
      <Building2 className="h-12 w-12 mb-4 text-primary/50" />
      <h2 className="text-xl font-semibold text-foreground">Organization</h2>
      <p className="text-sm mt-1">Multi-org support coming in Phase 5</p>
    </div>
  )
}
