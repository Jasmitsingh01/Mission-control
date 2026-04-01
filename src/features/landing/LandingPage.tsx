import { Link } from 'react-router-dom'
import { useState } from 'react'
import {
  Bot,
  Activity,
  Brain,
  Zap,
  ArrowRight,
  Play,
  MessageSquare,
  GitBranch,
  Users,
  ShieldCheck,
  CheckCircle2,
  Target,
  Cpu,
} from 'lucide-react'

const stats = [
  { value: '10,000+', label: 'Agent Tasks' },
  { value: '500+', label: 'Teams' },
  { value: '99.9%', label: 'Uptime' },
  { value: '40+', label: 'Skills' },
]

const features = [
  { icon: MessageSquare, title: 'Natural Language Team Builder', desc: 'Describe your goal in plain English and watch AI assemble the perfect agent team with tasks and dependencies.', span: 'md:col-span-1' },
  { icon: Activity, title: 'Real-Time Mission Control', desc: 'Monitor every agent action, task update, and system event in a live dashboard with filters and alerts.', span: 'md:col-span-1' },
  { icon: Users, title: 'Multi-Agent Orchestration', desc: 'Coordinate teams of specialized AI agents working in parallel on complex, multi-step projects.', span: 'md:col-span-1' },
  { icon: GitBranch, title: 'Smart Task Dependencies', desc: 'Define task relationships and let the system automatically schedule and execute in the right order.', span: 'md:col-span-1' },
  { icon: Brain, title: 'Memory & Context Sharing', desc: 'Agents share knowledge and context across sessions, building on each other\'s work intelligently.', span: 'md:col-span-1' },
  { icon: ShieldCheck, title: 'Human-in-the-Loop Approval', desc: 'Set approval gates for critical tasks. Review and approve agent work before it goes live.', span: 'md:col-span-1' },
]

const useCaseTabs = ['Content Marketing', 'Software Dev', 'Market Research', 'Sales']

const useCaseData: Record<string, { title: string; desc: string; items: string[] }> = {
  'Content Marketing': {
    title: 'Automate Your Content Pipeline',
    desc: 'From ideation to publishing, let AI agents handle the heavy lifting while you focus on strategy.',
    items: ['Research trending topics automatically', 'Generate SEO-optimized drafts', 'Schedule and publish across platforms', 'Analyze performance and iterate'],
  },
  'Software Dev': {
    title: 'Accelerate Development Cycles',
    desc: 'AI agents that write code, review PRs, run tests, and deploy -- all orchestrated from one dashboard.',
    items: ['Auto-generate boilerplate code', 'Continuous code review agents', 'Automated testing pipelines', 'Smart deployment orchestration'],
  },
  'Market Research': {
    title: 'Intelligence at Scale',
    desc: 'Deploy research agents that crawl, analyze, and synthesize market data into actionable insights.',
    items: ['Competitor monitoring agents', 'Sentiment analysis pipelines', 'Trend detection and alerts', 'Automated report generation'],
  },
  'Sales': {
    title: 'Scale Your Sales Engine',
    desc: 'AI agents that prospect, qualify leads, personalize outreach, and schedule meetings automatically.',
    items: ['Lead scoring and qualification', 'Personalized email sequences', 'CRM data enrichment', 'Meeting scheduling automation'],
  },
}

export function LandingPage() {
  const [activeTab, setActiveTab] = useState('Content Marketing')
  const currentUseCase = useCaseData[activeTab]

  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative pt-24 px-8">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-32 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px]" />
          <div className="absolute top-64 right-1/4 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-[120px]" />
          <div className="absolute inset-0 bg-dots opacity-60" />
        </div>

        <div className="relative max-w-7xl mx-auto py-20 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          {/* Left */}
          <div className="lg:col-span-7 animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-primary/8 border border-primary/15 rounded-full px-4 py-1.5 mb-8">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse-subtle" />
              <span className="text-xs font-semibold text-primary tracking-wide">Now in Public Beta</span>
            </div>

            <h1 className="text-5xl md:text-[3.5rem] lg:text-6xl font-bold tracking-tight text-on-surface leading-[1.08] font-[family-name:var(--font-headline)]">
              Build AI Agent Teams.
              <br />
              <span className="text-gradient-primary">Describe Your Goal.</span>
              <br />
              Watch It Execute.
            </h1>

            <p className="mt-7 text-lg text-on-surface-variant/80 max-w-xl leading-relaxed">
              AgentForge is the AI orchestration platform that turns natural language goals into
              coordinated agent teams. Describe what you want, and watch autonomous agents plan,
              execute, and deliver.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-start gap-4">
              <Link to="/signup">
                <button className="synthetic-gradient text-white px-8 py-3.5 rounded-xl text-sm font-semibold flex items-center gap-2 hover:opacity-90 hover:shadow-xl hover:shadow-primary/25 transition-all active:scale-[0.98]">
                  Start for Free
                  <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
              <button className="border border-outline-variant/25 text-on-surface-variant px-8 py-3.5 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-surface-container hover:border-outline-variant/40 transition-all">
                <Play className="h-4 w-4" />
                Watch Demo
              </button>
            </div>

            <div className="mt-10 flex items-center gap-6">
              <span className="text-[10px] font-mono text-outline/50 uppercase tracking-[0.2em]">Powered by</span>
              <div className="flex items-center gap-5">
                {['OpenClaw', 'GPT-4o', 'Claude Sonnet'].map((name) => (
                  <span key={name} className="text-sm text-on-surface-variant/50 font-medium font-mono">
                    {name}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right - Kanban Visual */}
          <div className="lg:col-span-5 animate-fade-in" style={{ animationDelay: '0.15s' }}>
            <div className="bg-surface rounded-2xl border border-outline-variant/20 p-5 card-elevated">
              <div className="flex gap-3">
                {/* TODO Column */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-2 w-2 rounded-full bg-tertiary" />
                    <span className="text-[10px] font-mono text-on-surface-variant/60 uppercase tracking-[0.15em] font-semibold">TODO</span>
                    <span className="text-[10px] font-mono text-outline/40 ml-auto">3</span>
                  </div>
                  <div className="space-y-2">
                    {['Research competitors', 'Draft content plan', 'Setup analytics'].map((task) => (
                      <div key={task} className="bg-surface-container-low rounded-xl p-3 border border-outline-variant/10 hover:border-outline-variant/25 transition-colors">
                        <p className="text-xs text-on-surface font-medium">{task}</p>
                        <div className="flex items-center gap-1 mt-2">
                          <Bot className="h-3 w-3 text-primary/60" />
                          <span className="text-[10px] text-outline/40 font-mono">agent-01</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* EXECUTING Column */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-2 w-2 rounded-full bg-secondary animate-pulse-subtle" />
                    <span className="text-[10px] font-mono text-on-surface-variant/60 uppercase tracking-[0.15em] font-semibold">EXECUTING</span>
                    <span className="text-[10px] font-mono text-outline/40 ml-auto">2</span>
                  </div>
                  <div className="space-y-2">
                    {['Write blog post', 'Generate images'].map((task) => (
                      <div key={task} className="bg-surface-container-low rounded-xl p-3 border border-secondary/15 hover:border-secondary/30 transition-colors">
                        <p className="text-xs text-on-surface font-medium">{task}</p>
                        <div className="flex items-center gap-1 mt-2">
                          <Cpu className="h-3 w-3 text-secondary" />
                          <span className="text-[10px] text-secondary font-mono font-medium">running...</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* DONE Column */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-mono text-on-surface-variant/60 uppercase tracking-[0.15em] font-semibold">DONE</span>
                    <span className="text-[10px] font-mono text-outline/40 ml-auto">4</span>
                  </div>
                  <div className="space-y-2">
                    {['Define audience', 'Keyword research', 'Brand guidelines'].map((task) => (
                      <div key={task} className="bg-surface-container-low rounded-xl p-3 border border-outline-variant/10 opacity-60">
                        <p className="text-xs text-on-surface font-medium line-through">{task}</p>
                        <div className="flex items-center gap-1 mt-2">
                          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                          <span className="text-[10px] text-emerald-500 font-mono font-medium">complete</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-surface py-14 border-y border-outline-variant/12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl lg:text-4xl font-bold text-on-surface font-mono tracking-tight">{stat.value}</p>
                <p className="mt-2 text-sm text-on-surface-variant/60">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-28 bg-surface-dim bg-grid">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 bg-secondary/8 border border-secondary/12 rounded-full px-4 py-1.5 text-xs font-semibold text-secondary tracking-wide mb-6">How It Works</span>
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-on-surface font-[family-name:var(--font-headline)]">From idea to execution in 3 steps</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: '01', title: 'Describe Your Goal', desc: 'Tell AgentForge what you want to achieve in plain language. Be as detailed or high-level as you like.', icon: Target },
              { step: '02', title: 'AI Builds Your Team', desc: 'Our AI analyzes your goal and assembles the perfect team of specialized agents with tasks and dependencies.', icon: Bot },
              { step: '03', title: 'Agents Execute', desc: 'Watch your agent team work in real-time. Monitor progress, review outputs, and intervene when needed.', icon: Zap },
            ].map((item) => (
              <div key={item.step} className="relative text-center bg-surface rounded-2xl border border-outline-variant/12 p-8 card-elevated hover:border-primary/15 transition-all group">
                <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/8 border border-primary/10 mb-6 group-hover:bg-primary/12 transition-colors">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <p className="text-[10px] font-bold text-primary/70 mb-2 font-mono tracking-[0.2em]">STEP {item.step}</p>
                <h3 className="text-lg font-bold mb-3 text-on-surface font-[family-name:var(--font-headline)]">{item.title}</h3>
                <p className="text-sm text-on-surface-variant/70 leading-relaxed max-w-xs mx-auto">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section className="py-28 bg-surface">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 bg-primary/8 border border-primary/12 rounded-full px-4 py-1.5 text-xs font-semibold text-primary tracking-wide mb-6">Features</span>
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-on-surface font-[family-name:var(--font-headline)]">Everything you need to orchestrate AI</h2>
            <p className="mt-4 text-base text-on-surface-variant/70 max-w-2xl mx-auto">
              A complete toolkit for managing AI agent teams, from task planning to deployment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {features.map((feature) => (
              <div key={feature.title} className={feature.span}>
                <div className="h-full bg-surface-container-lowest rounded-2xl border border-outline-variant/12 p-7 hover:border-primary/15 transition-all group card-elevated">
                  <div className="inline-flex rounded-xl bg-primary/8 border border-primary/8 p-2.5 mb-5 group-hover:bg-primary/12 transition-colors">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-bold text-[15px] mb-2.5 text-on-surface font-[family-name:var(--font-headline)]">{feature.title}</h3>
                  <p className="text-sm text-on-surface-variant/70 leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-28 bg-surface-dim bg-dots">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 bg-tertiary/8 border border-tertiary/12 rounded-full px-4 py-1.5 text-xs font-semibold text-tertiary tracking-wide mb-6">Use Cases</span>
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-on-surface font-[family-name:var(--font-headline)]">Built for every workflow</h2>
          </div>

          {/* Tab buttons */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {useCaseTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === tab
                    ? 'synthetic-gradient text-white shadow-md shadow-primary/20'
                    : 'bg-surface text-on-surface-variant border border-outline-variant/15 hover:border-outline-variant/30 hover:bg-surface-container'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Use case detail */}
          <div className="bg-surface rounded-2xl border border-outline-variant/12 p-8 md:p-12 max-w-4xl mx-auto card-elevated">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              <div>
                <h3 className="text-xl font-bold text-on-surface mb-3 font-[family-name:var(--font-headline)]">{currentUseCase.title}</h3>
                <p className="text-on-surface-variant/70 leading-relaxed mb-7">{currentUseCase.desc}</p>
                <ul className="space-y-3.5">
                  {currentUseCase.items.map((item) => (
                    <li key={item} className="flex items-center gap-3">
                      <div className="rounded-full bg-secondary/10 p-0.5">
                        <CheckCircle2 className="h-4 w-4 text-secondary" />
                      </div>
                      <span className="text-sm text-on-surface">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-surface-container rounded-2xl border border-outline-variant/10 p-6 h-64 flex items-center justify-center">
                <div className="text-center">
                  <div className="rounded-2xl bg-surface-container-high p-4 inline-block mb-3">
                    <Activity className="h-8 w-8 text-outline/20" />
                  </div>
                  <p className="text-sm text-outline/50 font-mono">Interactive demo</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-28 bg-surface">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <div className="relative rounded-2xl border border-outline-variant/12 bg-surface-container-lowest p-14 card-elevated overflow-hidden">
            <div className="absolute inset-0 bg-grid opacity-40" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-primary/5 rounded-full blur-[100px]" />
            <div className="relative">
              <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-on-surface font-[family-name:var(--font-headline)]">
                Ready to get started?
              </h2>
              <p className="mt-4 text-base text-on-surface-variant/70 max-w-xl mx-auto">
                Start free. No credit card required. Deploy your first agent team in under 2 minutes.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/signup">
                  <button className="synthetic-gradient text-white px-8 py-3.5 rounded-xl text-sm font-semibold flex items-center gap-2 hover:opacity-90 hover:shadow-xl hover:shadow-primary/25 transition-all active:scale-[0.98]">
                    Get Started Free
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </Link>
                <Link to="/contact">
                  <button className="border border-outline-variant/25 text-on-surface-variant px-8 py-3.5 rounded-xl text-sm font-medium hover:bg-surface-container hover:border-outline-variant/40 transition-all">
                    Talk to Sales
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
