'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { TicketStatus } from '@/types/database'

export async function updateTicketStatus(ticketId: string, status: TicketStatus) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('tickets')
    .update({ status })
    .eq('id', ticketId)
    .eq('assigned_to', user.id)

  if (error) return { error: error.message }

  revalidatePath('/employee/tickets')
  revalidatePath('/employee/dashboard')
  return { success: true }
}
