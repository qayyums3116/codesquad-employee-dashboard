import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { EmployeeTable } from '@/components/admin/employee-table'
import { CreateEmployeeButton } from '@/components/admin/create-employee-button'
import { Profile } from '@/types/database'

export default async function AdminEmployeesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: raw } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'employee')
    .order('full_name')

  const employees = (raw ?? []) as Profile[]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Employee Management</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {employees.length} employee{employees.length !== 1 ? 's' : ''}
          </p>
        </div>
        <CreateEmployeeButton />
      </div>
      <EmployeeTable employees={employees} />
    </div>
  )
}
