import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminFeedbackManager } from '@/components/admin/admin-feedback-manager'

export default async function AdminFeedbackPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [employeesRes, feedbackRes] = await Promise.all([
    supabase.from('profiles').select('id, full_name, email, department, avatar_url').eq('role', 'employee').eq('status', 'active').order('full_name'),
    supabase.from('feedback').select('*, employee:profiles!feedback_employee_id_fkey(full_name, department)').order('created_at', { ascending: false }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Feedback Management</h1>
        <p className="text-muted-foreground text-sm mt-1">Submit and manage weekly performance feedback</p>
      </div>

      <AdminFeedbackManager
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        employees={(employeesRes.data ?? []) as any[]}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        feedback={(feedbackRes.data ?? []) as any[]}
        adminId={user.id}
      />
    </div>
  )
}
