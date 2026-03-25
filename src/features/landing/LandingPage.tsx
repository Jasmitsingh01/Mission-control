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
        <div className="relative max-w-7xl mx-auto py-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left */}
          <div className="lg:col-span-7">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-on-surface leading-[1.1]">
              Build AI Agent Teams.
              <br />
              <span className="text-primary">Describe Your Goal.</span>
              <br />
              Watch It Execute.
            </h1>

            <p className="mt-6 text-lg text-on-surface-variant max-w-xl leading-relaxed">
              AgentForge is the AI orchestration platform that turns natural language goals into
              coordinated agent teams. Describe what you want, and watch autonomous agents plan,
              execute, and deliver.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-start gap-4">
              <Link to="/signup">
                <button className="bg-primary text-on-primary px-8 py-3 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-primary/90 transition-colors">
                  Start for Free
                  <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
              <button className="border border-outline-variant text-on-surface-variant px-8 py-3 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-surface-container transition-colors">
                <Play className="h-4 w-4" />
                Watch Demo
              </button>
            </div>

            <div className="mt-10 flex items-center gap-6">
              <span className="text-xs font-mono text-outline uppercase tracking-wider">Powered by</span>
              <div className="flex items-center gap-5">
                {['OpenClaw', 'GPT-4o', 'Claude Sonnet'].map((name) => (
                  <span key={name} className="text-sm text-on-surface-variant font-medium font-mono opacity-60">
                    {name}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right - Kanban Visual */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-xl border border-outline-variant/40 p-4 shadow-sm">
              <div className="flex gap-3">
                {/* TODO Column */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-2 w-2 rounded-full bg-tertiary" />
                    <span className="text-xs font-mono text-on-surface-variant uppercase tracking-wider">TODO</span>
                    <span className="text-xs font-mono text-outline ml-auto">3</span>
                  </div>
                  <div className="space-y-2">
                    {['Research competitors', 'Draft content plan', 'Setup analytics'].map((task) => (
                      <div key={task} className="bg-surface-container-low rounded-lg p-3 border border-outline-variant/20">
                        <p className="text-xs text-on-surface font-medium">{task}</p>
                        <div className="flex items-center gap-1 mt-2">
                          <Bot className="h-3 w-3 text-primary" />
                          <span className="text-[10px] text-outline font-mono">agent-01</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* EXECUTING Column */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-2 w-2 rounded-full bg-secondary" />
                    <span className="text-xs font-mono text-on-surface-variant uppercase tracking-wider">EXECUTING</span>
                    <span className="text-xs font-mono text-outline ml-auto">2</span>
                  </div>
                  <div className="space-y-2">
                    {['Write blog post', 'Generate images'].map((task) => (
                      <div key={task} className="bg-surface-container-low rounded-lg p-3 border border-secondary/20">
                        <p className="text-xs text-on-surface font-medium">{task}</p>
                        <div className="flex items-center gap-1 mt-2">
                          <Cpu className="h-3 w-3 text-secondary" />
                          <span className="text-[10px] text-secondary font-mono">running...</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* DONE Column */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-xs font-mono text-on-surface-variant uppercase tracking-wider">DONE</span>
                    <span className="text-xs font-mono text-outline ml-auto">4</span>
                  </div>
                  <div className="space-y-2">
                    {['Define audience', 'Keyword research', 'Brand guidelines'].map((task) => (
                      <div key={task} className="bg-surface-container-low rounded-lg p-3 border border-outline-variant/20 opacity-70">
                        <p className="text-xs text-on-surface font-medium line-through">{task}</p>
                        <div className="flex items-center gap-1 mt-2">
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                          <span className="text-[10px] text-green-500 font-mono">complete</span>
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
      <section className="bg-surface-container-lowest py-12 border-y border-outline-variant/20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl lg:text-4xl font-bold text-on-surface font-mono">{stat.value}</p>
                <p className="mt-2 text-sm text-on-surface-variant">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-surface-dim">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-xs font-mono text-secondary uppercase tracking-widest mb-4 block">How It Works</span>
            <h2 className="text-3xl font-bold tracking-tight text-on-surface">From idea to execution in 3 steps</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Describe Your Goal', desc: 'Tell AgentForge what you want to achieve in plain language. Be as detailed or high-level as you like.', icon: Target },
              { step: '02', title: 'AI Builds Your Team', desc: 'Our AI analyzes your goal and assembles the perfect team of specialized agents with tasks and dependencies.', icon: Bot },
              { step: '03', title: 'Agents Execute', desc: 'Watch your agent team work in real-time. Monitor progress, review outputs, and intervene when needed.', icon: Zap },
            ].map((item) => (
              <div key={item.step} className="relative text-center">
                <div className="inline-flex items-center justify-center h-14 w-14 rounded-xl bg-surface-container border border-outline-variant/30 mb-6">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <p className="text-xs font-semibold text-secondary mb-2 font-mono tracking-wider">STEP {item.step}</p>
                <h3 className="text-lg font-semibold mb-3 text-on-surface">{item.title}</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed max-w-xs mx-auto">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section className="py-24 bg-surface-container-lowest">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-xs font-mono text-secondary uppercase tracking-widest mb-4 block">Features</span>
            <h2 className="text-3xl font-bold tracking-tight text-on-surface">Everything you need to orchestrate AI</h2>
            <p className="mt-4 text-base text-on-surface-variant max-w-2xl mx-auto">
              A complete toolkit for managing AI agent teams, from task planning to deployment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {features.map((feature) => (
              <div key={feature.title} className={feature.span}>
                <div className="h-full bg-white rounded-xl border border-outline-variant/30 p-6 hover:border-primary/20 transition-colors">
                  <div className="inline-flex rounded-lg bg-surface-container p-2.5 mb-4">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-base mb-2 text-on-surface">{feature.title}</h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-24 bg-surface-dim">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-mono text-secondary uppercase tracking-widest mb-4 block">Use Cases</span>
            <h2 className="text-3xl font-bold tracking-tight text-on-surface">Built for every workflow</h2>
          </div>

          {/* Tab buttons */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {useCaseTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container text-on-surface-variant border border-outline-variant/30 hover:bg-surface-container-high'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Use case detail */}
          <div className="bg-white rounded-xl border border-outline-variant/30 p-8 md:p-12 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-xl font-semibold text-on-surface mb-3">{currentUseCase.title}</h3>
                <p className="text-on-surface-variant leading-relaxed mb-6">{currentUseCase.desc}</p>
                <ul className="space-y-3">
                  {currentUseCase.items.map((item) => (
                    <li key={item} className="flex items-center gap-3">
                      <CheckCircle2 className="h-4 w-4 text-secondary shrink-0" />
                      <span className="text-sm text-on-surface">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-surface-container rounded-xl border border-outline-variant/20 p-6 h-64 flex items-center justify-center">
                <div className="text-center">
                  <Activity className="h-10 w-10 text-outline/30 mx-auto mb-3" />
                  <p className="text-sm text-outline font-mono">Interactive demo</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-surface-container-lowest">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <div className="rounded-xl border border-outline-variant/30 bg-white p-12">
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-on-surface">
              Ready to get started?
            </h2>
            <p className="mt-4 text-base text-on-surface-variant max-w-xl mx-auto">
              Start free. No credit card required. Deploy your first agent team in under 2 minutes.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/signup">
                <button className="bg-primary text-on-primary px-8 py-3 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-primary/90 transition-colors">
                  Get Started Free
                  <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
              <Link to="/contact">
                <button className="border border-outline-variant text-on-surface-variant px-8 py-3 rounded-lg text-sm font-medium hover:bg-surface-container transition-colors">
                  Talk to Sales
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
