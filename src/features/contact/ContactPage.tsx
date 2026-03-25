import { useState } from 'react'
import { Send, Mail, MapPin, MessageSquare, Loader2, CheckCircle2 } from 'lucide-react'

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
        <span className="text-xs font-mono text-secondary uppercase tracking-widest inline-block bg-secondary/10 px-3 py-1 rounded-full">Contact</span>
        <h1 className="text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1] text-on-surface mt-4">
          Get in <span className="text-primary">touch</span>
        </h1>
        <p className="mt-6 text-base text-on-surface-variant max-w-xl mx-auto">
          Have a question, feedback, or want to partner with us? We'd love to hear from you.
        </p>
      </section>

      {/* Contact Info Cards */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 mb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {contactInfo.map((info) => (
            <div key={info.title}>
              <div className="text-center bg-white rounded-xl border border-outline-variant/30 p-8 hover:border-primary/20 transition-colors">
                <div className="inline-flex rounded-lg bg-surface-container p-2.5 mb-4">
                  <info.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-1 text-on-surface">{info.title}</h3>
                <p className="text-sm text-secondary font-medium font-mono">{info.value}</p>
                <p className="text-xs text-on-surface-variant mt-1">{info.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Form */}
      <section className="max-w-2xl mx-auto px-6 lg:px-8">
        <div className="bg-white rounded-xl border border-outline-variant/30 p-8">
          {sent ? (
            <div className="text-center py-12">
              <CheckCircle2 className="h-12 w-12 text-secondary mx-auto mb-6" />
              <h3 className="text-xl font-semibold mb-2 text-on-surface">Message Sent</h3>
              <p className="text-on-surface-variant text-sm">Thank you for reaching out. We'll get back to you within 24 hours.</p>
              <button
                className="mt-6 border border-outline-variant text-on-surface-variant px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-surface-container transition-colors"
                onClick={() => { setSent(false); setFormState({ name: '', email: '', subject: '', message: '' }) }}
              >
                Send Another
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <h3 className="text-lg font-semibold mb-2 text-on-surface">Send us a message</h3>
              <p className="text-sm text-on-surface-variant mb-6">Fill out the form below and we'll respond as soon as possible.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block text-on-surface">Name</label>
                  <input
                    placeholder="Your name"
                    value={formState.name}
                    onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                    className="w-full bg-surface-container-lowest text-on-surface placeholder:text-outline border border-outline-variant/30 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block text-on-surface">Email</label>
                  <input
                    type="email"
                    placeholder="you@company.com"
                    value={formState.email}
                    onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                    className="w-full bg-surface-container-lowest text-on-surface placeholder:text-outline border border-outline-variant/30 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block text-on-surface">Subject</label>
                <input
                  placeholder="How can we help?"
                  value={formState.subject}
                  onChange={(e) => setFormState({ ...formState, subject: e.target.value })}
                  className="w-full bg-surface-container-lowest text-on-surface placeholder:text-outline border border-outline-variant/30 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block text-on-surface">Message</label>
                <textarea
                  placeholder="Tell us more..."
                  rows={5}
                  value={formState.message}
                  onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                  className="w-full bg-surface-container-lowest text-on-surface placeholder:text-outline border border-outline-variant/30 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none transition-colors"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-primary text-on-primary py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
                disabled={sending}
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4" /> Send Message</>}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  )
}
