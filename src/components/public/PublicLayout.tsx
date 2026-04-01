import { Outlet, Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'

const navLinks = [
  { to: '/', label: 'Features' },
  { to: '/about', label: 'Skills' },
  { to: '/blog', label: 'Blog' },
  { to: '/pricing', label: 'Pricing' },
]

export function PublicLayout() {
  const { isAuthenticated } = useAuthStore()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => setMobileOpen(false), [location])

  return (
    <div className="min-h-screen bg-surface-dim">
      {/* Navbar */}
      <nav className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-surface/85 backdrop-blur-2xl shadow-sm shadow-black/5 border-b border-outline-variant/10'
          : 'bg-transparent'
      )}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl synthetic-gradient flex items-center justify-center shadow-md shadow-primary/20">
                <span className="text-xs font-bold text-white">AF</span>
              </div>
              <span className="text-lg font-bold tracking-tight text-on-surface font-[family-name:var(--font-headline)]">AgentForge</span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={cn(
                    'px-4 py-2 text-sm font-medium transition-colors rounded-lg',
                    location.pathname === link.to
                      ? 'text-primary'
                      : 'text-on-surface-variant/70 hover:text-on-surface'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Auth buttons */}
            <div className="hidden md:flex items-center gap-3">
              {isAuthenticated ? (
                <Link to="/dashboard">
                  <button className="synthetic-gradient text-white px-5 py-2 rounded-xl text-sm font-semibold hover:opacity-90 hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-[0.98]">
                    Dashboard
                  </button>
                </Link>
              ) : (
                <>
                  <Link to="/login">
                    <button className="text-sm font-medium text-on-surface-variant/70 hover:text-on-surface transition-colors px-4 py-2">
                      Login
                    </button>
                  </Link>
                  <Link to="/signup">
                    <button className="synthetic-gradient text-white px-5 py-2 rounded-xl text-sm font-semibold hover:opacity-90 hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-[0.98]">
                      Sign Up
                    </button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button className="md:hidden text-on-surface-variant hover:text-on-surface p-2 rounded-lg" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-outline-variant/10 bg-surface/95 backdrop-blur-2xl animate-fade-in">
            <div className="px-6 py-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={cn(
                    'block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors',
                    location.pathname === link.to
                      ? 'text-primary bg-primary/8'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-3 border-t border-outline-variant/10 space-y-2">
                {isAuthenticated ? (
                  <Link to="/dashboard">
                    <button className="w-full synthetic-gradient text-white py-2.5 rounded-xl text-sm font-semibold">Dashboard</button>
                  </Link>
                ) : (
                  <>
                    <Link to="/login">
                      <button className="w-full border border-outline-variant/20 text-on-surface-variant py-2.5 rounded-xl text-sm font-medium hover:bg-surface-container transition-colors">
                        Login
                      </button>
                    </Link>
                    <Link to="/signup">
                      <button className="w-full synthetic-gradient text-white py-2.5 rounded-xl text-sm font-semibold">Sign Up</button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Page content */}
      <Outlet />

      {/* Footer */}
      <footer className="bg-surface border-t border-outline-variant/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-7 w-7 rounded-lg synthetic-gradient flex items-center justify-center">
                  <span className="text-[10px] font-bold text-white">AF</span>
                </div>
                <span className="text-lg font-bold tracking-tight text-on-surface font-[family-name:var(--font-headline)]">AgentForge</span>
              </div>
              <p className="text-sm text-on-surface-variant/60 leading-relaxed">
                The AI agent orchestration platform that turns your ideas into reality.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-[10px] text-on-surface mb-4 font-mono uppercase tracking-[0.2em]">Platform</h4>
              <ul className="space-y-2.5 text-sm text-on-surface-variant/60">
                <li><Link to="/" className="hover:text-primary transition-colors">Features</Link></li>
                <li><Link to="/pricing" className="hover:text-primary transition-colors">Pricing</Link></li>
                <li><span className="cursor-default hover:text-primary transition-colors">Changelog</span></li>
                <li><span className="cursor-default hover:text-primary transition-colors">Roadmap</span></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-[10px] text-on-surface mb-4 font-mono uppercase tracking-[0.2em]">Company</h4>
              <ul className="space-y-2.5 text-sm text-on-surface-variant/60">
                <li><Link to="/about" className="hover:text-primary transition-colors">About</Link></li>
                <li><Link to="/blog" className="hover:text-primary transition-colors">Blog</Link></li>
                <li><Link to="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
                <li><span className="cursor-default hover:text-primary transition-colors">Careers</span></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-[10px] text-on-surface mb-4 font-mono uppercase tracking-[0.2em]">Social</h4>
              <ul className="space-y-2.5 text-sm text-on-surface-variant/60">
                <li><span className="hover:text-on-surface cursor-pointer transition-colors">Twitter</span></li>
                <li><span className="hover:text-on-surface cursor-pointer transition-colors">GitHub</span></li>
                <li><span className="hover:text-on-surface cursor-pointer transition-colors">Discord</span></li>
                <li><span className="hover:text-on-surface cursor-pointer transition-colors">YouTube</span></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-outline-variant/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-outline/40">&copy; {new Date().getFullYear()} AgentForge. All rights reserved.</p>
            <div className="flex items-center gap-6 text-sm text-outline/40">
              <span className="hover:text-on-surface cursor-pointer transition-colors">Privacy Policy</span>
              <span className="hover:text-on-surface cursor-pointer transition-colors">Terms</span>
              <span className="hover:text-on-surface cursor-pointer transition-colors">Security</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
