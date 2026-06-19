'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, User, Lock, Palette, Upload } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Switch } from '@/components/ui/switch'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types/database'
import { getInitials } from '@/lib/utils'

const profileSchema = z.object({
  full_name: z.string().min(2, 'Name is required'),
})

const passwordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm: z.string(),
}).refine(d => d.password === d.confirm, { message: "Passwords don't match", path: ['confirm'] })

type ProfileForm = z.infer<typeof profileSchema>
type PasswordForm = z.infer<typeof passwordSchema>

interface SettingsFormProps {
  profile: Profile
}

export function SettingsForm({ profile }: SettingsFormProps) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: profile.full_name },
  })

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  })

  async function updateProfile(data: ProfileForm) {
    const supabase = createClient()
    const { error } = await supabase.from('profiles').update({ full_name: data.full_name }).eq('id', profile.id)
    if (error) { toast.error('Failed to update profile'); return }
    toast.success('Profile updated!')
    router.refresh()
  }

  async function updatePassword(data: PasswordForm) {
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: data.password })
    if (error) { toast.error('Failed to update password: ' + error.message); return }
    toast.success('Password updated!')
    passwordForm.reset()
  }

  return (
    <div className="space-y-6">
      {/* Profile info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4 text-primary" /> Profile Information
          </CardTitle>
          <CardDescription>Update your display name and account details</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={profileForm.handleSubmit(updateProfile)} className="space-y-4">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={profile.avatar_url ?? undefined} />
                <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                  {getInitials(profile.full_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{profile.full_name}</p>
                <p className="text-xs text-muted-foreground">{profile.email}</p>
                <Badge className="mt-1 text-xs capitalize" role={profile.role} />
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input {...profileForm.register('full_name')} />
              {profileForm.formState.errors.full_name && (
                <p className="text-xs text-destructive">{profileForm.formState.errors.full_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input value={profile.email} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Department</Label>
                <Input value={profile.department ?? ''} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Position</Label>
                <Input value={profile.position ?? ''} disabled className="bg-muted" />
              </div>
            </div>

            <Button type="submit" disabled={profileForm.formState.isSubmitting}>
              {profileForm.formState.isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock className="h-4 w-4 text-primary" /> Change Password
          </CardTitle>
          <CardDescription>Update your account password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={passwordForm.handleSubmit(updatePassword)} className="space-y-4">
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input type="password" {...passwordForm.register('password')} placeholder="At least 8 characters" />
              {passwordForm.formState.errors.password && (
                <p className="text-xs text-destructive">{passwordForm.formState.errors.password.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Confirm Password</Label>
              <Input type="password" {...passwordForm.register('confirm')} placeholder="Confirm new password" />
              {passwordForm.formState.errors.confirm && (
                <p className="text-xs text-destructive">{passwordForm.formState.errors.confirm.message}</p>
              )}
            </div>
            <Button type="submit" disabled={passwordForm.formState.isSubmitting}>
              {passwordForm.formState.isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Updating…</> : 'Update Password'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Theme */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette className="h-4 w-4 text-primary" /> Appearance
          </CardTitle>
          <CardDescription>Choose your preferred theme</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            {(['light', 'dark', 'system'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`flex-1 p-4 rounded-lg border-2 text-left transition-colors ${
                  theme === t ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'
                }`}
              >
                <div className={`w-full h-10 rounded mb-2 ${
                  t === 'light' ? 'bg-white border' :
                  t === 'dark' ? 'bg-slate-900' :
                  'bg-gradient-to-r from-white to-slate-900'
                }`} />
                <p className="text-sm font-medium capitalize">{t}</p>
                {theme === t && <p className="text-xs text-primary mt-0.5">Active</p>}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function Badge({ role, className }: { role: string; className?: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
      role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    } ${className ?? ''}`}>
      {role}
    </span>
  )
}
