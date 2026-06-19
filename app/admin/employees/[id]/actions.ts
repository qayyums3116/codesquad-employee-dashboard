'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveTaskNote(taskId: string, note: string, employeeId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('daily_tasks')
    .update({ admin_notes: note } as any)
    .eq('id', taskId)
  if (error) return { error: error.message }
  revalidatePath(`/admin/employees/${employeeId}`)
  return { success: true }
}

export async function saveWeeklyFeedback({
  employeeId, weekStart, weekEnd, rating, feedbackText, existingId,
}: {
  employeeId: string
  weekStart: string
  weekEnd: string
  rating: number
  feedbackText: string
  existingId?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  if (existingId) {
    const { error } = await supabase.from('feedback')
      .update({ feedback_text: feedbackText, performance_rating: rating })
      .eq('id', existingId)
    if (error) return { error: error.message }
  } else {
    const { error } = await supabase.from('feedback').insert({
      employee_id: employeeId,
      admin_id: user.id,
      week_start: weekStart,
      week_end: weekEnd,
      feedback_text: feedbackText,
      performance_rating: rating,
    })
    if (error) return { error: error.message }
  }

  revalidatePath(`/admin/employees/${employeeId}`)
  return { success: true }
}
