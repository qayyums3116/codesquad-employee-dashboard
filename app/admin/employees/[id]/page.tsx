import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Profile, DailyTask, Feedback } from '@/types/database'
import { EmployeeDetailClient } from '@/components/admin/employee-detail/employee-detail-client'

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: empRaw }, { data: tasksRaw }, { data: feedbackRaw }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', id).single(),
    supabase.from('daily_tasks').select('*').eq('employee_id', id).order('task_date', { ascending: false }),
    supabase.from('feedback').select('*').eq('employee_id', id).order('week_start', { ascending: false }),
  ])

  if (!empRaw) notFound()

  return (
    <EmployeeDetailClient
      employee={empRaw as unknown as Profile}
      tasks={(tasksRaw ?? []) as unknown as DailyTask[]}
      feedbackList={(feedbackRaw ?? []) as unknown as Feedback[]}
    />
  )
}
