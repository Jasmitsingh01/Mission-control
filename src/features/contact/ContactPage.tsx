import { useState } from 'react'
import { motion } from 'framer-motion'
import { Send, Mail, MapPin, MessageSquare, Loader2, CheckCircle2 } from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } }),
}

const contactInfo = [
  { icon: Mail, title: 'Email', value: 'hello@agentforge.dev', desc: 'We reply within 24 hours' },
  { icon: MessageSquare, title: 'Discord', value: 'discord.gg/agentforge', desc: 'Join our community' },
  { icon: MapPin, title: 'Location', value: 'Global / Remote', desc: 'Distributed team worldwide' },
]

export function ContactPage() {
  const [formState, setFormState] = useState({ name: '', email: '', subject: '', message: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    await new Promise((r) => setTimeout(r, 1500))
    setSending(false)
    setSent(true)
  }

  return (
    <div className="pt-24 pb-16 bg-surface-dim">
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 text-center py-16">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
          <span className="text-xs font-mono text-secondary uppercase tracking-widest inline-block bg-secondary/10 px-3 py-1 rounded-full">Contact</span>
        </motion.div>
        <motion.h1
          className="text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-on-surface mt-4"
          initial="hidden" animate="visible" variants={fadeUp} custom={1}
        >
          Get in <span className="text-primary">touch</span>
        </motion.h1>
        <motion.p
          className="mt-6 text-lg text-on-surface-variant max-w-xl mx-auto"
          initial="hidden" animate="visible" variants={fadeUp} custom={2}
        >
          Have a question, feedback, or want to partner with us? We'd love to hear from you.
        </motion.p>
      </section>

      {/* Contact Info Cards */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 mb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {contactInfo.map((info, i) => (
            <motion.div key={info.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
              <div className="text-center glass-panel rounded-2xl border border-outline-variant/30 p-8 hover:border-primary/30 transition-colors">
                <div className="inline-flex rounded-xl bg-primary-container/20 p-3 mb-4">
                  <info.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-1 text-on-surface">{info.title}</h3>
                <p className="text-sm text-secondary font-medium font-mono">{info.value}</p>
                <p className="text-xs text-on-surface-variant mt-1">{info.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Form */}
      <section className="max-w-2xl mx-auto px-6 lg:px-8">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
          <div className="glass-panel rounded-2xl border border-outline-variant/30 p-8">
            {sent ? (
              <div className="text-center py-12">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
                  <CheckCircle2 className="h-16 w-16 text-secondary mx-auto mb-6" />
                </motion.div>
                <h3 className="text-2xl font-bold mb-2 text-on-surface">Message Sent!</h3>
                <p className="text-on-surface-variant">Thank you for reaching out. We'll get back to you within 24 hours.</p>
                <button
                  className="mt-6 border border-outline-variant text-on-surface-variant px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-surface-container transition-colors"
                  onClick={() => { setSent(false); setFormState({ name: '', email: '', subject: '', message: '' }) }}
                >
                  Send Another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <h3 className="text-xl font-bold mb-2 text-on-surface">Send us a message</h3>
                <p className="text-sm text-on-surface-variant mb-6">Fill out the form below and we'll respond as soon as possible.</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block text-on-surface font-mono">Name</label>
                    <input
                      placeholder="Your name"
                      value={formState.name}
                      onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                      className="w-full bg-surface-container-lowest text-on-surface placeholder:text-outline border border-outline-variant/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-transparent transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block text-on-surface font-mono">Email</label>
                    <input
                      type="email"
                      placeholder="you@company.com"
                      value={formState.email}
                      onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                      className="w-full bg-surface-container-lowest text-on-surface placeholder:text-outline border border-outline-variant/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-transparent transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block text-on-surface font-mono">Subject</label>
                  <input
                    placeholder="How can we help?"
                    value={formState.subject}
                    onChange={(e) => setFormState({ ...formState, subject: e.target.value })}
                    className="w-full bg-surface-container-lowest text-on-surface placeholder:text-outline border border-outline-variant/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block text-on-surface font-mono">Message</label>
                  <textarea
                    placeholder="Tell us more..."
                    rows={5}
                    value={formState.message}
                    onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                    className="w-full bg-surface-container-lowest text-on-surface placeholder:text-outline border border-outline-variant/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-transparent resize-none transition-all"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full synthetic-gradient text-white py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                  disabled={sending}
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4" /> Send Message</>}
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </section>
    </div>
  )
}
