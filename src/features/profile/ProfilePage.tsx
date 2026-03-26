import { useState } from 'react'
import { User, Mail, Calendar, Shield, Camera, Loader2, CheckCircle2, Key, LogOut } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { authApi } from '@/lib/api'
import { useNavigate } from 'react-router-dom'

export function ProfilePage() {
  const { user, logout, loadUser } = useAuthStore()
  const navigate = useNavigate()

  const [name, setName] = useState(user?.name || '')
  const [email] = useState(user?.email || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  // Password change
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwSaved, setPwSaved] = useState(false)
  const [pwError, setPwError] = useState('')

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaved(false)
    if (!name.trim()) { setError('Name is required.'); return }
    setSaving(true)
    try {
      await authApi.updateProfile({ name: name.trim() })
      await loadUser()
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwError('')
    setPwSaved(false)
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwError('All fields are required.')
      return
    }
    if (newPassword.length < 6) {
      setPwError('New password must be at least 6 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match.')
      return
    }
    setPwSaving(true)
    try {
      await authApi.updateProfile({ currentPassword, newPassword })
      setPwSaved(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPwSaved(false), 3000)
    } catch (err: any) {
      setPwError(err.message || 'Failed to change password.')
    } finally {
      setPwSaving(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Unknown'

  const planLabel = user?.plan === 'enterprise' ? 'Enterprise' : user?.plan === 'pro' ? 'Pro' : 'Free'

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="pt-2">
        <p className="font-mono text-xs uppercase tracking-widest text-secondary mb-2">Account</p>
        <h1 className="text-2xl font-bold text-on-surface tracking-tight">Profile</h1>
        <p className="text-sm text-on-surface-variant mt-1">Manage your account information</p>
      </div>

      {/* Avatar & Overview */}
      <div className="bg-surface-container-low rounded-xl border border-outline-variant/10 p-6">
        <div className="flex items-center gap-6">
          {/* Avatar */}
          <div className="relative group">
            <div className="h-20 w-20 rounded-full bg-primary flex items-center justify-center text-on-primary text-2xl font-bold">
              {user?.avatar || 'U'}
            </div>
            <button className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="h-5 w-5 text-white" />
            </button>
          </div>

          {/* Info */}
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-on-surface">{user?.name || 'User'}</h2>
            <p className="text-sm text-on-surface-variant">{user?.email}</p>
            <div className="flex items-center gap-4 mt-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                <Shield className="h-3 w-3" />
                {planLabel} Plan
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-on-surface-variant">
                <Calendar className="h-3 w-3" />
                Member since {memberSince}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile */}
      <div className="bg-surface-container-low rounded-xl border border-outline-variant/10 p-6">
        <div className="flex items-center gap-2 mb-5">
          <User className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm text-on-surface">Personal Information</span>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-error/10 border border-error/20 px-4 py-3">
              <p className="text-sm text-error">{error}</p>
            </div>
          )}
          {saved && (
            <div className="rounded-lg bg-green-500/10 border border-green-500/20 px-4 py-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <p className="text-sm text-green-600">Profile updated successfully.</p>
            </div>
          )}

          <div>
            <label className="text-sm font-medium mb-2 block text-on-surface">Full Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-surface-container-lowest text-on-surface placeholder:text-outline border border-outline-variant/30 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block text-on-surface">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-outline" />
              <input
                value={email}
                disabled
                className="w-full bg-surface-container text-on-surface-variant border border-outline-variant/30 rounded-lg pl-10 pr-4 py-2.5 text-sm cursor-not-allowed opacity-60"
              />
            </div>
            <p className="text-xs text-outline mt-1.5">Email cannot be changed. Contact support if needed.</p>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving || name.trim() === user?.name}
              className="bg-primary text-on-primary px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Change Password */}
      <div className="bg-surface-container-low rounded-xl border border-outline-variant/10 p-6">
        <div className="flex items-center gap-2 mb-5">
          <Key className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm text-on-surface">Change Password</span>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4">
          {pwError && (
            <div className="rounded-lg bg-error/10 border border-error/20 px-4 py-3">
              <p className="text-sm text-error">{pwError}</p>
            </div>
          )}
          {pwSaved && (
            <div className="rounded-lg bg-green-500/10 border border-green-500/20 px-4 py-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <p className="text-sm text-green-600">Password changed successfully.</p>
            </div>
          )}

          <div>
            <label className="text-sm font-medium mb-2 block text-on-surface">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              className="w-full bg-surface-container-lowest text-on-surface placeholder:text-outline border border-outline-variant/30 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block text-on-surface">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full bg-surface-container-lowest text-on-surface placeholder:text-outline border border-outline-variant/30 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block text-on-surface">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="w-full bg-surface-container-lowest text-on-surface placeholder:text-outline border border-outline-variant/30 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={pwSaving || !currentPassword || !newPassword || !confirmPassword}
              className="bg-primary text-on-primary px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {pwSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="bg-surface-container-low rounded-xl border border-error/20 p-6">
        <div className="flex items-center gap-2 mb-4">
          <LogOut className="h-4 w-4 text-error" />
          <span className="font-semibold text-sm text-error">Danger Zone</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-on-surface">Sign out of your account</p>
            <p className="text-xs text-on-surface-variant mt-0.5">You will need to log in again to access the dashboard.</p>
          </div>
          <button
            onClick={handleLogout}
            className="border border-error/30 text-error px-5 py-2 rounded-lg text-sm font-medium hover:bg-error/10 transition-colors flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Log Out
          </button>
        </div>
      </div>
    </div>
  )
}
