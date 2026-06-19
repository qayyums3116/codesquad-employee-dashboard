'use client'

import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, User, Lock, Palette, Camera } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types/database'
import { getInitials } from '@/lib/utils'

const profileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.avatar_url)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: profile.full_name },
  })

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  })

  async function handleAvatarUpload(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5 MB')
      return
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    setUploading(true)
    const supabase = createClient()
    const ext = file.name.split('.').pop() ?? 'jpg'
    const filePath = `${profile.id}/avatar.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true, contentType: file.type })

    if (uploadError) {
      toast.error('Upload failed: ' + uploadError.message)
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    // Bust cache by appending a timestamp query param
    const bustedUrl = `${publicUrl}?t=${Date.now()}`

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', profile.id)

    if (updateError) {
      toast.error('Failed to save avatar: ' + updateError.message)
      setUploading(false)
      return
    }

    setAvatarUrl(bustedUrl)
    toast.success('Profile picture updated!')
    setUploading(false)
    router.refresh()
  }

  async function updateProfile(data: ProfileForm) {
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: data.full_name })
      .eq('id', profile.id)
    if (error) { toast.error('Failed to update profile'); return }
    toast.success('Name updated!')
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
      {/* ── Profile Picture ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Camera className="h-4 w-4 text-primary" /> Profile Picture
          </CardTitle>
          <CardDescription>Click your avatar to upload a new photo (max 5 MB)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {/* Clickable avatar */}
            <div
              className="relative group cursor-pointer flex-shrink-0"
              onClick={() => !uploading && fileInputRef.current?.click()}
            >
              <Avatar className="h-24 w-24 ring-4 ring-border group-hover:ring-primary transition-all duration-200">
                <AvatarImage src={avatarUrl ?? undefined} alt={profile.full_name} />
                <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
                  {getInitials(profile.full_name)}
                </AvatarFallback>
              </Avatar>
              {/* Overlay */}
              <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                {uploading
                  ? <Loader2 className="h-6 w-6 text-white animate-spin" />
                  : <Camera className="h-6 w-6 text-white" />
                }
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (file) handleAvatarUpload(file)
                  e.target.value = ''
                }}
              />
            </div>

            <div className="text-center sm:text-left">
              <p className="font-semibold text-lg">{profile.full_name}</p>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
              <RoleBadge role={profile.role} />
              <p className="text-xs text-muted-foreground mt-3">
                Supported formats: JPG, PNG, WebP, GIF
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? (
                  <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Uploading…</>
                ) : (
                  <><Camera className="mr-1.5 h-3.5 w-3.5" />Change Photo</>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Profile Info ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4 text-primary" /> Profile Information
          </CardTitle>
          <CardDescription>Update your display name</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={profileForm.handleSubmit(updateProfile)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                {...profileForm.register('full_name')}
                placeholder="Your full name"
              />
              {profileForm.formState.errors.full_name && (
                <p className="text-xs text-destructive">{profileForm.formState.errors.full_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input value={profile.email} disabled className="bg-muted cursor-not-allowed" />
              <p className="text-xs text-muted-foreground">Email address cannot be changed.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Department</Label>
                <Input value={profile.department ?? '—'} disabled className="bg-muted cursor-not-allowed" />
              </div>
              <div className="space-y-2">
                <Label>Position</Label>
                <Input value={profile.position ?? '—'} disabled className="bg-muted cursor-not-allowed" />
              </div>
            </div>

            <Button type="submit" disabled={profileForm.formState.isSubmitting}>
              {profileForm.formState.isSubmitting
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</>
                : 'Save Changes'
              }
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* ── Change Password ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock className="h-4 w-4 text-primary" /> Change Password
          </CardTitle>
          <CardDescription>Choose a strong password of at least 8 characters</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={passwordForm.handleSubmit(updatePassword)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                {...passwordForm.register('password')}
                placeholder="At least 8 characters"
                autoComplete="new-password"
              />
              {passwordForm.formState.errors.password && (
                <p className="text-xs text-destructive">{passwordForm.formState.errors.password.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                {...passwordForm.register('confirm')}
                placeholder="Repeat new password"
                autoComplete="new-password"
              />
              {passwordForm.formState.errors.confirm && (
                <p className="text-xs text-destructive">{passwordForm.formState.errors.confirm.message}</p>
              )}
            </div>
            <Button type="submit" disabled={passwordForm.formState.isSubmitting}>
              {passwordForm.formState.isSubmitting
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Updating…</>
                : 'Update Password'
              }
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* ── Appearance ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette className="h-4 w-4 text-primary" /> Appearance
          </CardTitle>
          <CardDescription>Choose your preferred colour theme</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            {(['light', 'dark', 'system'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`flex-1 p-4 rounded-lg border-2 text-left transition-colors ${
                  theme === t
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-muted-foreground/40'
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

function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${
      role === 'admin'
        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    }`}>
      {role}
    </span>
  )
}
