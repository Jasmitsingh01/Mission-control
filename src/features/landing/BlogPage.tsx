import { useState } from 'react'
import { motion } from 'framer-motion'
import { Clock, ArrowRight, Send, BookOpen, Cpu, Brain, Zap, Users, Sparkles } from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } }),
}

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
    icon: Sparkles,
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
        <motion.h1
          className="text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-on-surface"
          initial="hidden" animate="visible" variants={fadeUp} custom={0}
        >
          AI Automation{' '}
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Insights
          </span>
        </motion.h1>
        <motion.p
          className="mt-6 text-lg text-on-surface-variant max-w-xl mx-auto"
          initial="hidden" animate="visible" variants={fadeUp} custom={1}
        >
          Tutorials, deep dives, and case studies on building with AI agent teams.
        </motion.p>
      </section>

      {/* Featured Post */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 mb-16">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2}>
          <div className="glass-panel rounded-2xl border border-outline-variant/30 overflow-hidden group cursor-pointer hover:border-primary/30 transition-all">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
              {/* Image placeholder */}
              <div className="bg-surface-container-lowest h-64 lg:h-auto flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-container/20 to-secondary/10" />
                <featuredPost.icon className="h-24 w-24 text-primary/20 relative z-10" />
              </div>
              {/* Content */}
              <div className="p-8 lg:p-10 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-mono text-secondary bg-secondary/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                    {featuredPost.tag}
                  </span>
                  <span className="text-xs font-mono text-outline">{featuredPost.date}</span>
                </div>
                <h2 className="text-2xl lg:text-3xl font-bold text-on-surface mb-3 group-hover:text-primary transition-colors">
                  {featuredPost.title}
                </h2>
                <p className="text-on-surface-variant leading-relaxed mb-4">{featuredPost.desc}</p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-xs text-outline font-mono">
                    <Clock className="h-3.5 w-3.5" />
                    {featuredPost.readTime}
                  </div>
                  <span className="text-primary text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                    Read more <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Blog Grid */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article, i) => (
            <motion.div
              key={article.title}
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={fadeUp} custom={i}
            >
              <div className="h-full glass-panel rounded-2xl border border-outline-variant/30 overflow-hidden group cursor-pointer hover:border-primary/30 transition-all flex flex-col">
                {/* Image placeholder */}
                <div className="bg-surface-container-lowest h-40 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-container/10 to-transparent" />
                  <article.icon className="h-12 w-12 text-primary/20 relative z-10" />
                </div>
                {/* Content */}
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-[10px] font-mono text-secondary bg-secondary/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {article.tag}
                    </span>
                    <span className="text-[10px] font-mono text-outline">{article.date}</span>
                  </div>
                  <h3 className="font-semibold text-on-surface mb-2 group-hover:text-primary transition-colors leading-snug">
                    {article.title}
                  </h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed flex-1">{article.desc}</p>
                  <div className="flex items-center gap-1.5 mt-4 text-xs text-outline font-mono">
                    <Clock className="h-3 w-3" />
                    {article.readTime}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Newsletter Card */}
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={5}
          >
            <div className="h-full bg-primary-container rounded-2xl p-6 flex flex-col justify-center">
              <BookOpen className="h-10 w-10 text-on-primary-container mb-4" />
              <h3 className="font-bold text-lg text-on-primary-container mb-2">Stay in the loop</h3>
              <p className="text-sm text-on-primary-container/80 mb-5 leading-relaxed">
                Get the latest AI automation insights, tutorials, and product updates delivered to your inbox.
              </p>
              {subscribed ? (
                <div className="text-sm font-medium text-on-primary-container">
                  Thanks for subscribing! Check your inbox.
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="space-y-3">
                  <input
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-on-primary/20 text-on-primary-container placeholder:text-on-primary-container/50 border-0 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-on-primary-container/30"
                    required
                  />
                  <button
                    type="submit"
                    className="w-full bg-on-primary-container text-primary-container py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                  >
                    <Send className="h-4 w-4" />
                    Subscribe
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
