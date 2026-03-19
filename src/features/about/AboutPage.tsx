import { motion } from 'framer-motion'
import { Target, Users, Lightbulb, Heart, Code2, Globe, Zap, Shield } from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } }),
}

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.8 } },
}

const values = [
  { icon: Lightbulb, title: 'Innovation First', desc: 'We push the boundaries of what AI orchestration can do, constantly evolving our platform.' },
  { icon: Users, title: 'Developer-Centric', desc: 'Built by developers, for developers. Every feature is designed for real-world workflows.' },
  { icon: Shield, title: 'Security & Privacy', desc: 'Self-hostable, open-source, and your data never leaves your infrastructure.' },
  { icon: Heart, title: 'Open Source', desc: 'Transparent, community-driven development. Contribute, fork, or self-host freely.' },
]

const team = [
  { name: 'Digital Guru Ji', role: 'Founder & CEO', avatar: 'DG', desc: 'Full-stack developer with a passion for AI automation and trading systems.' },
  { name: 'AI Core Team', role: 'Engineering', avatar: 'AI', desc: 'A distributed team of AI researchers and platform engineers.' },
  { name: 'Community', role: 'Contributors', avatar: 'OS', desc: 'Open-source contributors from around the world making AgentForge better.' },
]

const milestones = [
  { year: '2024', title: 'Idea Born', desc: 'Concept of a unified AI agent dashboard conceived during trading bot development.' },
  { year: '2025 Q1', title: 'First Prototype', desc: 'Kanban board, agent management, and activity feed built and tested.' },
  { year: '2025 Q2', title: 'Mission Launcher', desc: 'AI-powered project planning with automatic agent team generation.' },
  { year: '2025 Q3', title: 'Public Launch', desc: 'Open-source release with self-hosting support and skill marketplace.' },
]

export function AboutPage() {
  return (
    <div className="pt-24 pb-16 bg-surface-dim">
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 text-center py-16">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
          <span className="text-xs font-mono text-secondary uppercase tracking-widest mb-4 inline-block bg-secondary/10 px-3 py-1 rounded-full">About Us</span>
        </motion.div>
        <motion.h1
          className="text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-on-surface mt-4"
          initial="hidden" animate="visible" variants={fadeUp} custom={1}
        >
          Building the future of
          <br /><span className="text-primary">AI orchestration</span>
        </motion.h1>
        <motion.p
          className="mt-6 text-lg text-on-surface-variant max-w-2xl mx-auto leading-relaxed"
          initial="hidden" animate="visible" variants={fadeUp} custom={2}
        >
          AgentForge was born from the frustration of managing multiple AI agents across
          different terminals and tools. We built the command center we wished existed.
        </motion.p>
      </section>

      {/* Mission */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <span className="text-xs font-mono text-secondary uppercase tracking-widest mb-4 inline-block">Our Mission</span>
            <h2 className="text-3xl font-extrabold tracking-tight mb-4 text-on-surface">
              Make AI agents as manageable as human teams
            </h2>
            <p className="text-on-surface-variant leading-relaxed mb-6">
              We believe the future of software development involves coordinating teams of AI agents,
              each with specialized skills and responsibilities. AgentForge provides the infrastructure
              to make that vision practical today.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Code2, label: 'Open Source' },
                { icon: Globe, label: 'Self-Hostable' },
                { icon: Zap, label: 'Real-time' },
                { icon: Target, label: 'Task-Focused' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3 rounded-xl border border-outline-variant/30 bg-surface-container-low p-3 hover:border-primary/30 transition-colors">
                  <item.icon className="h-5 w-5 text-primary shrink-0" />
                  <span className="text-sm font-medium text-on-surface">{item.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
          <motion.div
            className="rounded-2xl border border-outline-variant/30 bg-surface-container-low p-8"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
          >
            <div className="grid grid-cols-2 gap-6 text-center">
              {[
                { value: '10+', label: 'AI Models' },
                { value: '500+', label: 'GitHub Stars' },
                { value: '50+', label: 'Contributors' },
                { value: '24/7', label: 'Agent Uptime' },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-3xl font-extrabold text-primary font-mono">{stat.value}</p>
                  <p className="text-sm text-on-surface-variant mt-1 font-mono">{stat.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-surface-container-lowest border-y border-outline-variant/20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div className="text-center mb-12" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}>
            <span className="text-xs font-mono text-secondary uppercase tracking-widest mb-4 block">Our Values</span>
            <h2 className="text-3xl font-extrabold tracking-tight text-on-surface">What drives us</h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, i) => (
              <motion.div key={v.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
                <div className="h-full text-center glass-panel rounded-2xl border border-outline-variant/30 p-8 hover:border-primary/30 transition-colors">
                  <div className="inline-flex rounded-xl bg-primary-container/20 p-3 mb-4">
                    <v.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2 text-on-surface">{v.title}</h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed">{v.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div className="text-center mb-12" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}>
          <span className="text-xs font-mono text-secondary uppercase tracking-widest mb-4 block">Team</span>
          <h2 className="text-3xl font-extrabold tracking-tight text-on-surface">The people behind AgentForge</h2>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {team.map((t, i) => (
            <motion.div key={t.name} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
              <div className="text-center glass-panel rounded-2xl border border-outline-variant/30 p-8 hover:border-primary/30 transition-colors">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary-container/20 text-primary font-bold text-xl font-mono mb-4">
                  {t.avatar}
                </div>
                <h3 className="font-semibold text-lg text-on-surface">{t.name}</h3>
                <p className="text-sm text-secondary mb-3 font-mono">{t.role}</p>
                <p className="text-sm text-on-surface-variant leading-relaxed">{t.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 bg-surface-container-lowest border-y border-outline-variant/20">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <motion.div className="text-center mb-12" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}>
            <span className="text-xs font-mono text-secondary uppercase tracking-widest mb-4 block">Journey</span>
            <h2 className="text-3xl font-extrabold tracking-tight text-on-surface">Our story so far</h2>
          </motion.div>
          <div className="space-y-8">
            {milestones.map((m, i) => (
              <motion.div
                key={m.year}
                className="flex gap-6"
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i}
              >
                <div className="flex flex-col items-center">
                  <div className="h-10 w-10 rounded-full bg-primary-container/20 flex items-center justify-center shrink-0 border border-primary-container/30">
                    <div className="h-3 w-3 rounded-full bg-primary" />
                  </div>
                  {i < milestones.length - 1 && <div className="w-px flex-1 bg-outline-variant/30 mt-2" />}
                </div>
                <div className="pb-8">
                  <p className="text-xs font-bold text-secondary mb-1 font-mono tracking-wider">{m.year}</p>
                  <h3 className="font-semibold text-lg text-on-surface">{m.title}</h3>
                  <p className="text-sm text-on-surface-variant mt-1">{m.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
