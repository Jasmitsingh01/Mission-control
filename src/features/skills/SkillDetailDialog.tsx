import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Download, Trash2, Star, User, Tag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSkillStore } from '@/stores/skillStore'
import type { Skill } from '@/stores/skillStore'

const categoryColors: Record<string, string> = {
  research: 'bg-blue-500/10 text-blue-400',
  coding: 'bg-green-500/10 text-green-400',
  communication: 'bg-purple-500/10 text-purple-400',
  data: 'bg-orange-500/10 text-orange-400',
  utility: 'bg-cyan-500/10 text-cyan-400',
  custom: 'bg-pink-500/10 text-pink-400',
}

interface SkillDetailDialogProps {
  skill: Skill | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SkillDetailDialog({ skill, open, onOpenChange }: SkillDetailDialogProps) {
  const { installSkill, uninstallSkill } = useSkillStore()

  if (!skill) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {skill.name}
            <Badge variant="secondary" className="text-xs font-mono">v{skill.version}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={cn('capitalize', categoryColors[skill.category])}>
              {skill.category}
            </Badge>
            {skill.isBuiltIn && (
              <Badge variant="outline" className="text-xs">Built-in</Badge>
            )}
            {skill.installed && (
              <Badge className="bg-green-500/20 text-green-400 text-xs">Installed</Badge>
            )}
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground leading-relaxed">
            {skill.longDescription}
          </p>

          <Separator />

          {/* Meta */}
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Author</p>
                <p className="font-medium text-xs">{skill.author}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Downloads</p>
                <p className="font-medium text-xs">{skill.downloads.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-400" />
              <div>
                <p className="text-xs text-muted-foreground">Rating</p>
                <p className="font-medium text-xs">{skill.rating}/5.0</p>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
              <Tag className="h-3.5 w-3.5" />
              Tags
            </div>
            <div className="flex flex-wrap gap-1.5">
              {skill.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-[11px]">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Action */}
          {skill.installed ? (
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => { uninstallSkill(skill.id); onOpenChange(false) }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Uninstall Skill
            </Button>
          ) : (
            <Button
              className="w-full"
              onClick={() => { installSkill(skill.id); onOpenChange(false) }}
            >
              <Download className="h-4 w-4 mr-2" />
              Install Skill
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
