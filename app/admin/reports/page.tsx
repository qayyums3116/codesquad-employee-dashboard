import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ProductivityChart } from '@/components/dashboard/productivity-chart'
import { StatCard } from '@/components/dashboard/stat-card'
import { BarChart3, Clock, CheckCircle2, Users, TrendingUp } from 'lucide-react'

export default async function AdminReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd')
  const monthEnd = format(endOfMonth(new Date()), 'yyyy-MM-dd')
  const thirtyDaysAgo = format(subDays(new Date(), 29), 'yyyy-MM-dd')

  const [tasksRes, feedbackRes, employeesRes] = await Promise.all([
    supabase.from('daily_tasks').select('*, profiles(full_name, department)')
      .gte('task_date', thirtyDaysAgo).order('task_date'),
    supabase.from('feedback').select('*').gte('week_start', monthStart),
    supabase.from('profiles').select('id, department, status').eq('role', 'employee'),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tasks = (tasksRes.data ?? []) as any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allFeedback = (feedbackRes.data ?? []) as any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const employees = (employeesRes.data ?? []) as any[]

  const totalHours = tasks.reduce((s, t) => s + t.hours_worked, 0)
  const avgHoursPerDay = tasks.length ? (totalHours / 30).toFixed(1) : '0'
  const completionRate = tasks.length
    ? Math.round(tasks.filter(t => t.completion_status === 'Completed').length / tasks.length * 100)
    : 0
  const avgRating = allFeedback.length
    ? (allFeedback.reduce((s, f) => s + f.performance_rating, 0) / allFeedback.length).toFixed(1)
    : 'N/A'

  // Daily productivity last 30 days
  const last30 = Array.from({ length: 30 }, (_, i) => {
    const d = format(subDays(new Date(), 29 - i), 'yyyy-MM-dd')
    const dayTasks = tasks.filter(t => t.task_date === d)
    return {
      date: format(subDays(new Date(), 29 - i), 'MMM d'),
      submissions: dayTasks.length,
      hours: dayTasks.reduce((s, t) => s + t.hours_worked, 0),
    }
  })

  // Department productivity
  const deptMap = new Map<string, { tasks: number; hours: number; employees: number }>()
  employees.forEach(e => {
    if (e.department) {
      const curr = deptMap.get(e.department) ?? { tasks: 0, hours: 0, employees: 0 }
      deptMap.set(e.department, { ...curr, employees: curr.employees + 1 })
    }
  })
  tasks.forEach(t => {
    const dept = (t.profiles as { department: string | null } | null)?.department
    if (dept) {
      const curr = deptMap.get(dept) ?? { tasks: 0, hours: 0, employees: 0 }
      deptMap.set(dept, { ...curr, tasks: curr.tasks + 1, hours: curr.hours + t.hours_worked })
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports & Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">30-day productivity overview</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Tasks (30d)" value={tasks.length} icon={<CheckCircle2 className="h-4 w-4" />} color="blue" />
        <StatCard title="Total Hours" value={Math.round(totalHours)} icon={<Clock className="h-4 w-4" />} color="purple" suffix="h" />
        <StatCard title="Completion Rate" value={`${completionRate}%`} icon={<TrendingUp className="h-4 w-4" />} color={completionRate >= 70 ? 'green' : 'yellow'} />
        <StatCard title="Avg Rating" value={avgRating} icon={<BarChart3 className="h-4 w-4" />} color="orange" suffix={avgRating !== 'N/A' ? '/5' : ''} />
      </div>

      <ProductivityChart data={last30} />

      {/* Department breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Department Productivity (30 days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium text-muted-foreground">Department</th>
                  <th className="text-left py-2 font-medium text-muted-foreground">Employees</th>
                  <th className="text-left py-2 font-medium text-muted-foreground">Tasks</th>
                  <th className="text-left py-2 font-medium text-muted-foreground">Hours</th>
                  <th className="text-left py-2 font-medium text-muted-foreground">Avg hrs/employee</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {Array.from(deptMap.entries()).map(([dept, stats]) => (
                  <tr key={dept} className="hover:bg-muted/30">
                    <td className="py-2.5 font-medium">{dept}</td>
                    <td className="py-2.5 text-muted-foreground">{stats.employees}</td>
                    <td className="py-2.5 text-muted-foreground">{stats.tasks}</td>
                    <td className="py-2.5 text-muted-foreground">{stats.hours.toFixed(1)}h</td>
                    <td className="py-2.5 text-muted-foreground">
                      {stats.employees ? (stats.hours / stats.employees).toFixed(1) : 0}h
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
