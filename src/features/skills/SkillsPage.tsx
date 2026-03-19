import { useState, useMemo } from 'react'
import {
  Puzzle,
  Search,
  Download,
  Star,
  CheckCircle2,
  Filter,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useSkillStore } from '@/stores/skillStore'
import { SkillDetailDialog } from './SkillDetailDialog'
import type { Skill, SkillCategory } from '@/stores/skillStore'

const categoryColors: Record<SkillCategory, string> = {
  research: 'bg-blue-500/10 text-blue-400',
  coding: 'bg-green-500/10 text-green-400',
  communication: 'bg-purple-500/10 text-purple-400',
  data: 'bg-orange-500/10 text-orange-400',
  utility: 'bg-cyan-500/10 text-cyan-400',
  custom: 'bg-pink-500/10 text-pink-400',
}

export function SkillsPage() {
  const { skills, installSkill, uninstallSkill } = useSkillStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<SkillCategory | 'all'>('all')
  const [installFilter, setInstallFilter] = useState<'all' | 'installed' | 'available'>('all')
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const filteredSkills = useMemo(() => {
    return skills.filter((s) => {
      if (categoryFilter !== 'all' && s.category !== categoryFilter) return false
      if (installFilter === 'installed' && !s.installed) return false
      if (installFilter === 'available' && s.installed) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.tags.some((t) => t.includes(q))
      }
      return true
    })
  }, [skills, categoryFilter, installFilter, searchQuery])

  const stats = useMemo(() => ({
    total: skills.length,
    installed: skills.filter((s) => s.installed).length,
    builtIn: skills.filter((s) => s.isBuiltIn).length,
    community: skills.filter((s) => !s.isBuiltIn).length,
  }), [skills])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Skill Marketplace</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Browse and install AI capabilities for your agents
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{stats.installed} installed</span>
          <span>{stats.total} available</span>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1.5">
          {(['all', 'installed', 'available'] as const).map((f) => (
            <Button
              key={f}
              variant={installFilter === f ? 'default' : 'ghost'}
              size="sm"
              className="h-8 text-xs capitalize"
              onClick={() => setInstallFilter(f)}
            >
              {f}
            </Button>
          ))}
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <Filter className="h-3.5 w-3.5 text-muted-foreground mr-1" />
        <Button
          variant={categoryFilter === 'all' ? 'default' : 'ghost'}
          size="sm"
          className="h-7 text-xs"
          onClick={() => setCategoryFilter('all')}
        >
          All Categories
        </Button>
        {(Object.keys(categoryColors) as SkillCategory[]).map((cat) => (
          <Button
            key={cat}
            variant={categoryFilter === cat ? 'default' : 'ghost'}
            size="sm"
            className={cn('h-7 text-xs capitalize', categoryFilter !== cat && categoryColors[cat])}
            onClick={() => setCategoryFilter(cat)}
          >
            {cat}
          </Button>
        ))}
      </div>

      {/* Skill Grid */}
      {filteredSkills.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSkills.map((skill) => (
            <Card
              key={skill.id}
              className="hover:border-primary/30 transition-colors cursor-pointer group"
              onClick={() => { setSelectedSkill(skill); setDetailOpen(true) }}
            >
              <CardContent className="pt-4 pb-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={cn('rounded-lg p-2', categoryColors[skill.category])}>
                      <Puzzle className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-medium text-sm">{skill.name}</h3>
                      <span className="text-[11px] text-muted-foreground font-mono">v{skill.version}</span>
                    </div>
                  </div>
                  {skill.installed && (
                    <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
                  )}
                </div>

                {/* Description */}
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{skill.description}</p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {skill.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0">
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-400" />
                      {skill.rating}
                    </span>
                    <span className="flex items-center gap-1">
                      <Download className="h-3 w-3" />
                      {skill.downloads > 999 ? `${(skill.downloads / 1000).toFixed(1)}k` : skill.downloads}
                    </span>
                    <span className="text-muted-foreground/50">{skill.author}</span>
                  </div>
                  <Button
                    variant={skill.installed ? 'outline' : 'default'}
                    size="sm"
                    className="h-7 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation()
                      skill.installed ? uninstallSkill(skill.id) : installSkill(skill.id)
                    }}
                  >
                    {skill.installed ? 'Remove' : 'Install'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Puzzle className="h-10 w-10 mb-3 opacity-50" />
          <p className="text-sm">No skills match your search</p>
        </div>
      )}

      <SkillDetailDialog
        skill={selectedSkill}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  )
}
