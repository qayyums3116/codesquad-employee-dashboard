'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { TicketPriority } from '@/types/database'

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

export async function assignTicket(data: {
  employeeId: string
  title: string
  description: string
  priority: TicketPriority
  dueDate: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('tickets').insert({
    title: data.title,
    description: data.description,
    priority: data.priority,
    status: 'Open',
    assigned_to: data.employeeId,
    assigned_by: user.id,
    due_date: data.dueDate || null,
  })
  if (error) return { error: error.message }

  // Notify the employee
  await supabase.from('notifications').insert({
    user_id: data.employeeId,
    title: 'New Ticket Assigned',
    message: `You have been assigned a new ticket: "${data.title}"`,
    type: 'info',
  })

  revalidatePath(`/admin/employees/${data.employeeId}`)
  return { success: true }
}

export async function saveTicketFeedback(data: {
  ticketId: string
  employeeId: string
  feedbackText: string
  feedbackRating: number
}) {
  const supabase = await createClient()
  const { error } = await supabase.from('tickets')
    .update({ feedback_text: data.feedbackText, feedback_rating: data.feedbackRating })
    .eq('id', data.ticketId)
  if (error) return { error: error.message }
  revalidatePath(`/admin/employees/${data.employeeId}`)
  return { success: true }
}

export async function deleteTicket(ticketId: string, employeeId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('tickets').delete().eq('id', ticketId)
  if (error) return { error: error.message }
  revalidatePath(`/admin/employees/${employeeId}`)
  return { success: true }
}
