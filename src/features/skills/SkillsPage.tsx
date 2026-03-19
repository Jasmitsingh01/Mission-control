import { useState, useMemo } from 'react'
import {
  Puzzle,
  Search,
  Download,
  Star,
  CheckCircle2,
  Filter,
  Plus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSkillStore } from '@/stores/skillStore'
import { SkillDetailDialog } from './SkillDetailDialog'
import type { Skill, SkillCategory } from '@/stores/skillStore'

const categoryColors: Record<SkillCategory, { bg: string; text: string; iconBg: string }> = {
  research: { bg: 'bg-blue-500/10', text: 'text-blue-400', iconBg: 'bg-blue-500/15' },
  coding: { bg: 'bg-green-500/10', text: 'text-green-400', iconBg: 'bg-green-500/15' },
  communication: { bg: 'bg-purple-500/10', text: 'text-purple-400', iconBg: 'bg-purple-500/15' },
  data: { bg: 'bg-orange-500/10', text: 'text-orange-400', iconBg: 'bg-orange-500/15' },
  utility: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', iconBg: 'bg-cyan-500/15' },
  custom: { bg: 'bg-pink-500/10', text: 'text-pink-400', iconBg: 'bg-pink-500/15' },
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
    <div className="space-y-6 pb-8">
      {/* Hero Section */}
      <div className="relative rounded-2xl bg-surface-container-low border border-outline-variant/10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
        <div className="relative p-8">
          <span className="font-mono text-[10px] uppercase tracking-widest font-bold text-secondary">
            Marketplace
          </span>
          <h2 className="text-4xl font-extrabold text-on-surface mt-2 tracking-tight">
            AI Skills Marketplace
          </h2>
          <p className="text-sm text-on-surface-variant mt-2 max-w-lg">
            Browse and install AI capabilities for your agents
          </p>
          <div className="flex items-center gap-6 mt-4">
            <span className="font-mono text-[11px] text-primary">
              {stats.installed} installed
            </span>
            <span className="font-mono text-[11px] text-on-surface-variant">
              {stats.total} available
            </span>
            <span className="font-mono text-[11px] text-on-surface-variant">
              {stats.community} community
            </span>
          </div>
        </div>
      </div>

      {/* Search + Install Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" />
          <input
            placeholder="Search skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-lg bg-surface-container-lowest border-none text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-1 focus:ring-primary/40"
          />
        </div>
        <div className="flex items-center gap-1.5">
          {(['all', 'installed', 'available'] as const).map((f) => (
            <button
              key={f}
              className={cn(
                'h-8 px-4 rounded-full font-[\'JetBrains_Mono\'] text-[10px] uppercase tracking-widest font-bold transition-colors',
                installFilter === f
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
              )}
              onClick={() => setInstallFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <Filter className="h-3.5 w-3.5 text-outline mr-1" />
        <button
          className={cn(
            'h-7 px-3 rounded-full font-[\'JetBrains_Mono\'] text-[10px] uppercase tracking-widest font-bold transition-colors',
            categoryFilter === 'all'
              ? 'bg-primary text-on-primary'
              : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
          )}
          onClick={() => setCategoryFilter('all')}
        >
          All Categories
        </button>
        {(Object.keys(categoryColors) as SkillCategory[]).map((cat) => (
          <button
            key={cat}
            className={cn(
              'h-7 px-3 rounded-full font-[\'JetBrains_Mono\'] text-[10px] uppercase tracking-widest font-bold capitalize transition-colors',
              categoryFilter === cat
                ? 'bg-primary text-on-primary'
                : cn('bg-surface-container-high hover:text-on-surface', categoryColors[cat].text)
            )}
            onClick={() => setCategoryFilter(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Skill Grid */}
      {filteredSkills.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSkills.map((skill) => {
            const catColor = categoryColors[skill.category]
            return (
              <div
                key={skill.id}
                className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/10 hover:border-primary/30 transition-colors cursor-pointer group"
                onClick={() => { setSelectedSkill(skill); setDetailOpen(true) }}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={cn('rounded-lg p-2.5', catColor.iconBg)}>
                      <Puzzle className={cn('h-4 w-4', catColor.text)} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-on-surface">{skill.name}</h3>
                      <span className="font-mono text-[10px] text-outline">v{skill.version}</span>
                    </div>
                  </div>
                  {skill.installed && (
                    <CheckCircle2 className="h-4 w-4 text-secondary shrink-0" />
                  )}
                </div>

                {/* Category tag */}
                <span className={cn(
                  'inline-block font-[\'JetBrains_Mono\'] text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full mb-2',
                  catColor.bg, catColor.text
                )}>
                  {skill.category}
                </span>

                {/* Description */}
                <p className="text-xs text-on-surface-variant line-clamp-2 mb-3">{skill.description}</p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {skill.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant border border-outline-variant/10">
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 font-mono text-[11px] text-on-surface-variant">
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-tertiary" />
                      {skill.rating}
                    </span>
                    <span className="flex items-center gap-1">
                      <Download className="h-3 w-3" />
                      {skill.downloads > 999 ? `${(skill.downloads / 1000).toFixed(1)}k` : skill.downloads}
                    </span>
                    <span className="text-outline">{skill.author}</span>
                  </div>
                  <button
                    className={cn(
                      'font-[\'JetBrains_Mono\'] text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100',
                      skill.installed
                        ? 'bg-surface-container-highest text-primary border border-primary/20'
                        : 'bg-secondary text-on-secondary'
                    )}
                    onClick={(e) => {
                      e.stopPropagation()
                      skill.installed ? uninstallSkill(skill.id) : installSkill(skill.id)
                    }}
                  >
                    {skill.installed ? 'Installed' : 'Install'}
                  </button>
                </div>
              </div>
            )
          })}

          {/* Build Custom Skill CTA */}
          <div className="p-6 rounded-xl border-2 border-dashed border-outline-variant/20 flex flex-col items-center justify-center text-center min-h-[200px] hover:border-primary/30 transition-colors cursor-pointer group">
            <div className="rounded-lg p-3 bg-surface-container-high mb-3 group-hover:bg-primary/10 transition-colors">
              <Plus className="h-6 w-6 text-on-surface-variant group-hover:text-primary transition-colors" />
            </div>
            <h3 className="font-semibold text-sm text-on-surface mb-1">Build Custom Skill</h3>
            <p className="text-xs text-on-surface-variant">Create a tailored AI capability for your workflow</p>
            <span className="font-mono text-[10px] uppercase tracking-widest font-bold text-primary mt-3">
              Get Started
            </span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-on-surface-variant">
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
