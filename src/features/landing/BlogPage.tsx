import { useState } from 'react'
import { Clock, ArrowRight, Send, BookOpen, Cpu, Brain, Zap, Users } from 'lucide-react'

const featuredPost = {
  tag: 'AI Orchestration',
  title: 'The Future of Multi-Agent Systems: Why Teams Beat Solo Agents',
  desc: 'Discover why coordinated AI agent teams consistently outperform single-agent approaches in complex tasks, and how AgentForge makes orchestration seamless.',
  readTime: '8 min read',
  date: 'Mar 15, 2026',
  icon: Users,
}

const articles = [
  {
    tag: 'Tutorial',
    title: 'Building Your First Agent Team in 5 Minutes',
    desc: 'A step-by-step guide to creating, configuring, and deploying a multi-agent team using the Mission Launcher.',
    readTime: '5 min read',
    date: 'Mar 10, 2026',
    icon: Zap,
  },
  {
    tag: 'Deep Dive',
    title: 'How Memory Sharing Works Between Agents',
    desc: 'Under the hood of AgentForge\'s context sharing system and how agents build on each other\'s knowledge.',
    readTime: '12 min read',
    date: 'Mar 5, 2026',
    icon: Brain,
  },
  {
    tag: 'Case Study',
    title: 'How DataFlow Reduced Pipeline Costs by 60%',
    desc: 'Learn how a data analytics company automated their entire ETL pipeline with AI agent teams.',
    readTime: '7 min read',
    date: 'Feb 28, 2026',
    icon: Cpu,
  },
  {
    tag: 'Product Update',
    title: 'Introducing Smart Task Dependencies',
    desc: 'New feature: define task relationships and let AgentForge automatically schedule execution in the right order.',
    readTime: '4 min read',
    date: 'Feb 20, 2026',
    icon: Zap,
  },
  {
    tag: 'Best Practices',
    title: 'Prompt Engineering for Agent Specialization',
    desc: 'Tips and patterns for crafting effective system prompts that make your AI agents experts in their domain.',
    readTime: '10 min read',
    date: 'Feb 15, 2026',
    icon: BookOpen,
  },
]

export function BlogPage() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      setSubscribed(true)
      setEmail('')
    }
  }

  return (
    <div className="pt-24 pb-16 bg-surface-dim">
      {/* Header */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 text-center py-16">
        <h1 className="text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1] text-on-surface">
          AI Automation <span className="text-primary">Insights</span>
        </h1>
        <p className="mt-6 text-base text-on-surface-variant max-w-xl mx-auto">
          Tutorials, deep dives, and case studies on building with AI agent teams.
        </p>
      </section>

      {/* Featured Post */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 mb-16">
        <div className="bg-white rounded-xl border border-outline-variant/30 overflow-hidden group cursor-pointer hover:border-primary/20 transition-colors">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Image placeholder */}
            <div className="bg-surface-container h-64 lg:h-auto flex items-center justify-center relative overflow-hidden">
              <featuredPost.icon className="h-20 w-20 text-primary/10 relative z-10" />
            </div>
            {/* Content */}
            <div className="p-8 lg:p-10 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs font-mono text-secondary bg-secondary/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  {featuredPost.tag}
                </span>
                <span className="text-xs font-mono text-outline">{featuredPost.date}</span>
              </div>
              <h2 className="text-xl lg:text-2xl font-semibold text-on-surface mb-3 group-hover:text-primary transition-colors">
                {featuredPost.title}
              </h2>
              <p className="text-on-surface-variant leading-relaxed mb-4 text-sm">{featuredPost.desc}</p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-xs text-outline font-mono">
                  <Clock className="h-3.5 w-3.5" />
                  {featuredPost.readTime}
                </div>
                <span className="text-primary text-sm font-medium flex items-center gap-1">
                  Read more <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Blog Grid */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <div key={article.title}>
              <div className="h-full bg-white rounded-xl border border-outline-variant/30 overflow-hidden group cursor-pointer hover:border-primary/20 transition-colors flex flex-col">
                {/* Image placeholder */}
                <div className="bg-surface-container h-40 flex items-center justify-center relative overflow-hidden">
                  <article.icon className="h-10 w-10 text-primary/10 relative z-10" />
                </div>
                {/* Content */}
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-[10px] font-mono text-secondary bg-secondary/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {article.tag}
                    </span>
                    <span className="text-[10px] font-mono text-outline">{article.date}</span>
                  </div>
                  <h3 className="font-medium text-on-surface mb-2 group-hover:text-primary transition-colors leading-snug text-sm">
                    {article.title}
                  </h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed flex-1">{article.desc}</p>
                  <div className="flex items-center gap-1.5 mt-4 text-xs text-outline font-mono">
                    <Clock className="h-3 w-3" />
                    {article.readTime}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Newsletter Card */}
          <div>
            <div className="h-full bg-primary rounded-xl p-6 flex flex-col justify-center">
              <BookOpen className="h-8 w-8 text-on-primary mb-4" />
              <h3 className="font-semibold text-base text-on-primary mb-2">Stay in the loop</h3>
              <p className="text-sm text-on-primary/80 mb-5 leading-relaxed">
                Get the latest AI automation insights, tutorials, and product updates delivered to your inbox.
              </p>
              {subscribed ? (
                <div className="text-sm font-medium text-on-primary">
                  Thanks for subscribing! Check your inbox.
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="space-y-3">
                  <input
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/15 text-on-primary placeholder:text-on-primary/50 border-0 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
                    required
                  />
                  <button
                    type="submit"
                    className="w-full bg-white text-primary py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:bg-white/90 transition-colors"
                  >
                    <Send className="h-4 w-4" />
                    Subscribe
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
