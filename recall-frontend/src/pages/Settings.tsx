import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Settings, User, Lock, Moon, Sun, Monitor, Trash2, LogOut, ChevronRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { ConfirmDialog } from '../components/ui/Dialog'
import { Divider } from '../components/ui/index'
import { api } from '../api'
import { cn } from '../lib/utils'
import toast from 'react-hot-toast'
import type { Theme } from '../types'

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Required'),
  newPassword: z.string().min(8, 'At least 8 characters'),
  confirmPassword: z.string().min(1, 'Required'),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type ProfileValues = z.infer<typeof profileSchema>
type PasswordValues = z.infer<typeof passwordSchema>

const THEMES: { value: Theme; label: string; icon: React.ElementType }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
]

export default function SettingsPage() {
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()
  const [showDeleteAccount, setShowDeleteAccount] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isSavingPassword, setIsSavingPassword] = useState(false)

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name || '', email: user?.email || '' },
  })

  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
  })

  const handleSaveProfile = async (values: ProfileValues) => {
    setIsSavingProfile(true)
    try {
      await api.user.updateProfile(values)
      toast.success('Profile updated')
    } catch (e: unknown) {
      toast.error((e as Error).message || 'Failed to update profile')
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleChangePassword = async (values: PasswordValues) => {
    setIsSavingPassword(true)
    try {
      await api.user.changePassword(values.currentPassword, values.newPassword)
      toast.success('Password changed')
      passwordForm.reset()
    } catch (e: unknown) {
      toast.error((e as Error).message || 'Failed to change password')
    } finally {
      setIsSavingPassword(false)
    }
  }

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true)
    try {
      await api.user.deleteAccount()
      toast.success('Account deleted')
      navigate('/login')
    } catch (e: unknown) {
      toast.error((e as Error).message || 'Failed to delete account')
    } finally {
      setIsDeletingAccount(false)
    }
  }

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h2 className="text-base font-semibold text-foreground mb-4">{children}</h2>
  )

  return (
    <div className="p-6 max-w-2xl mx-auto animate-fade-in space-y-8">
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Settings className="w-5 h-5 text-muted-foreground" /> Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your account and preferences</p>
      </div>

      {/* Profile */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center text-lg font-bold">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <p className="font-semibold text-foreground">{user?.name}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <SectionTitle>Profile</SectionTitle>
        <form onSubmit={profileForm.handleSubmit(handleSaveProfile)} className="space-y-4">
          <Input
            label="Full Name"
            error={profileForm.formState.errors.name?.message}
            {...profileForm.register('name')}
          />
          <Input
            label="Email Address"
            type="email"
            error={profileForm.formState.errors.email?.message}
            {...profileForm.register('email')}
          />
          <div className="flex justify-end">
            <Button type="submit" size="sm" isLoading={isSavingProfile}>
              Save Profile
            </Button>
          </div>
        </form>
      </div>

      {/* Password */}
      <div className="bg-card border border-border rounded-xl p-6">
        <SectionTitle>Change Password</SectionTitle>
        <form onSubmit={passwordForm.handleSubmit(handleChangePassword)} className="space-y-4">
          <Input
            label="Current Password"
            type="password"
            error={passwordForm.formState.errors.currentPassword?.message}
            {...passwordForm.register('currentPassword')}
          />
          <Input
            label="New Password"
            type="password"
            error={passwordForm.formState.errors.newPassword?.message}
            helper="At least 8 characters"
            {...passwordForm.register('newPassword')}
          />
          <Input
            label="Confirm New Password"
            type="password"
            error={passwordForm.formState.errors.confirmPassword?.message}
            {...passwordForm.register('confirmPassword')}
          />
          <div className="flex justify-end">
            <Button type="submit" size="sm" isLoading={isSavingPassword}>
              Change Password
            </Button>
          </div>
        </form>
      </div>

      {/* Theme */}
      <div className="bg-card border border-border rounded-xl p-6">
        <SectionTitle>Appearance</SectionTitle>
        <div className="grid grid-cols-3 gap-2">
          {THEMES.map(t => {
            const Icon = t.icon
            return (
              <button
                key={t.value}
                onClick={() => setTheme(t.value)}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-sm font-medium',
                  theme === t.value
                    ? 'border-primary bg-accent text-accent-foreground'
                    : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                )}
                id={`theme-${t.value}`}
              >
                <Icon className="w-5 h-5" />
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-card border border-destructive/30 rounded-xl p-6">
        <h2 className="text-base font-semibold text-destructive mb-4">Danger Zone</h2>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Delete Account</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Permanently delete your account and all associated data. This cannot be undone.
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteAccount(true)}
          >
            Delete Account
          </Button>
        </div>

        <Divider className="my-4" />

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Log Out</p>
            <p className="text-xs text-muted-foreground mt-0.5">Sign out of your account on this device.</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<LogOut className="w-3.5 h-3.5" />}
            onClick={() => { logout(); navigate('/login') }}
          >
            Log Out
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteAccount}
        onClose={() => setShowDeleteAccount(false)}
        onConfirm={handleDeleteAccount}
        title="Delete Account"
        description="Are you absolutely sure? All your sections, notes, tags, and review history will be permanently deleted. This cannot be undone."
        confirmLabel="Delete My Account"
        isDestructive
        isLoading={isDeletingAccount}
      />
    </div>
  )
}
