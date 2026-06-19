import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminTaskTable } from '@/components/admin/admin-task-table'

export default async function AdminTasksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: raw } = await supabase
    .from('daily_tasks')
    .select('*, profiles(full_name, email, department, avatar_url)')
    .order('task_date', { ascending: false })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tasks = (raw ?? []) as any[]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Task Management</h1>
        <p className="text-muted-foreground text-sm mt-1">View and manage all employee task submissions</p>
      </div>
      <AdminTaskTable tasks={tasks} />
    </div>
  )
}
