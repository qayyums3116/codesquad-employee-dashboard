'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export async function createEmployee(data: {
  full_name: string
  email: string
  password: string
}) {
  const supabase = createAdminClient()

  // Create user with email pre-confirmed — no verification email sent
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
    user_metadata: { full_name: data.full_name, role: 'employee' },
  })

  if (authError) return { error: authError.message }

  const { error: profileError } = await supabase.from('profiles').upsert({
    id: authData.user.id,
    email: data.email,
    full_name: data.full_name,
    role: 'employee' as const,
    status: 'active' as const,
  })

  if (profileError) return { error: profileError.message }

  return { success: true }
}

export async function deleteEmployee(userId: string) {
  const supabase = createAdminClient()

  // Deletes from auth.users — cascades to profiles via FK ON DELETE CASCADE
  const { error } = await supabase.auth.admin.deleteUser(userId)
  if (error) return { error: error.message }

  return { success: true }
}
