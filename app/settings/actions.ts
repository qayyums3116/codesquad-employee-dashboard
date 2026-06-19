'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function uploadAvatar(formData: FormData) {
  // Verify the caller is authenticated
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const file = formData.get('file') as File | null
  if (!file || file.size === 0) return { error: 'No file provided' }
  if (file.size > 5 * 1024 * 1024) return { error: 'Image must be under 5 MB' }
  if (!file.type.startsWith('image/')) return { error: 'Please select an image file' }

  const admin = createAdminClient()

  // Auto-create the avatars bucket if it doesn't exist yet
  const { error: bucketError } = await admin.storage.createBucket('avatars', {
    public: true,
    fileSizeLimit: 5 * 1024 * 1024,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  })
  if (bucketError && !bucketError.message.toLowerCase().includes('already exists')) {
    return { error: 'Storage setup failed: ' + bucketError.message }
  }

  // Upload the file using the admin client (bypasses storage RLS)
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const filePath = `${user.id}/avatar.${ext}`
  const buffer = new Uint8Array(await file.arrayBuffer())

  const { error: uploadError } = await admin.storage
    .from('avatars')
    .upload(filePath, buffer, { contentType: file.type, upsert: true })

  if (uploadError) return { error: uploadError.message }

  // Get the public URL and save it to the profile
  const { data: { publicUrl } } = admin.storage.from('avatars').getPublicUrl(filePath)

  const { error: updateError } = await admin
    .from('profiles')
    .update({ avatar_url: publicUrl })
    .eq('id', user.id)

  if (updateError) return { error: updateError.message }

  revalidatePath('/settings')
  revalidatePath('/admin/dashboard')
  revalidatePath('/employee/dashboard')

  return { success: true, url: publicUrl }
}
