import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns'
import { Users, CheckSquare, MessageSquare, TrendingUp, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { StatCard } from '@/components/dashboard/stat-card'
import { AdminActivityChart } from '@/components/dashboard/admin-activity-chart'
import { DepartmentChart } from '@/components/dashboard/department-chart'
import { getInitials, getStatusColor, formatDate, cn } from '@/lib/utils'
import { Profile, DailyTask, Feedback } from '@/types/database'

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const today = format(new Date(), 'yyyy-MM-dd')
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const sevenDaysAgo = format(subDays(new Date(), 6), 'yyyy-MM-dd')

  const [employeesRes, todayTasksRes, weekTasksRes, feedbackRes, recentTasksRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('role', 'employee'),
    supabase.from('daily_tasks').select('*, profiles(full_name, department)').eq('task_date', today),
    supabase.from('daily_tasks').select('*, profiles(full_name, department)')
      .gte('task_date', weekStart).lte('task_date', weekEnd),
    supabase.from('feedback').select('*'),
    supabase.from('daily_tasks')
      .select('*, profiles(full_name, avatar_url, department)')
      .order('created_at', { ascending: false })
      .limit(8),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const employees = (employeesRes.data ?? []) as any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const todayTasks = (todayTasksRes.data ?? []) as any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const weekTasks = (weekTasksRes.data ?? []) as any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allFeedback = (feedbackRes.data ?? []) as any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recentTasks = (recentTasksRes.data ?? []) as any[]

  const activeEmployees = employees.filter(e => e.status === 'active')
  const avgRating = allFeedback.length
    ? (allFeedback.reduce((s, f) => s + f.performance_rating, 0) / allFeedback.length).toFixed(1)
    : 'N/A'

  // Employees who submitted today
  const submittedTodayIds = new Set(todayTasks.map(t => t.employee_id))
  const pendingFeedback = activeEmployees.filter(e => !allFeedback.some(f => f.employee_id === e.id))

  // Daily activity - last 7 days
  const [allRecentTasks] = await Promise.all([
    supabase.from('daily_tasks').select('task_date, completion_status, employee_id, profiles(department)')
      .gte('task_date', sevenDaysAgo)
  ])
  const tasksByDay = Array.from({ length: 7 }, (_, i) => {
    const d = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd')
    const dayTasks = (allRecentTasks.data ?? []).filter(t => t.task_date === d)
    return {
      date: format(subDays(new Date(), 6 - i), 'EEE'),
      total: dayTasks.length,
      completed: dayTasks.filter(t => t.completion_status === 'Completed').length,
      blocked: dayTasks.filter(t => t.completion_status === 'Blocked').length,
    }
  })

  // Department breakdown
  const deptMap = new Map<string, number>()
  employees.forEach(e => {
    if (e.department) deptMap.set(e.department, (deptMap.get(e.department) ?? 0) + 1)
  })
  const deptData = Array.from(deptMap.entries()).map(([name, value]) => ({ name, value }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Total Employees" value={employees.length} icon={<Users className="h-4 w-4" />} color="blue" />
        <StatCard title="Active" value={activeEmployees.length} icon={<Users className="h-4 w-4" />} color="green" />
        <StatCard title="Submitted Today" value={todayTasks.length} icon={<CheckSquare className="h-4 w-4" />} color="purple" suffix={`/ ${activeEmployees.length}`} />
        <StatCard title="Tasks This Week" value={weekTasks.length} icon={<TrendingUp className="h-4 w-4" />} color="orange" />
        <StatCard title="Avg Rating" value={avgRating} icon={<MessageSquare className="h-4 w-4" />} color={Number(avgRating) >= 4 ? 'green' : 'yellow'} suffix={avgRating !== 'N/A' ? '/5' : ''} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <AdminActivityChart data={tasksByDay} />
        </div>
        <DepartmentChart data={deptData} />
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent activity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Recent Task Submissions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tasks submitted yet</p>
            ) : recentTasks.map(task => {
              const profile = task.profiles as { full_name: string; avatar_url: string | null; department: string | null } | null
              return (
                <div key={task.id} className="flex items-start gap-3">
                  <Avatar className="h-7 w-7 mt-0.5">
                    <AvatarImage src={profile?.avatar_url ?? undefined} />
                    <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                      {profile ? getInitials(profile.full_name) : '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{profile?.full_name}</p>
                      <Badge variant="outline" className={cn('text-xs shrink-0', getStatusColor(task.completion_status))}>
                        {task.completion_status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{task.task_description}</p>
                    <p className="text-xs text-muted-foreground/70">{formatDate(task.task_date)} · {task.hours_worked}h</p>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Pending feedback */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Feedback Pending</CardTitle>
              {pendingFeedback.length > 0 && (
                <Badge variant="destructive" className="text-xs">{pendingFeedback.length}</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {pendingFeedback.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckSquare className="h-4 w-4" />
                All employees have received feedback
              </div>
            ) : (
              <div className="space-y-2">
                {pendingFeedback.slice(0, 6).map(emp => (
                  <div key={emp.id} className="flex items-center gap-3">
                    <AlertCircle className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{emp.full_name}</p>
                      <p className="text-xs text-muted-foreground">{emp.department ?? 'No department'}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">No feedback</Badge>
                  </div>
                ))}
                {pendingFeedback.length > 6 && (
                  <p className="text-xs text-muted-foreground pt-1">+{pendingFeedback.length - 6} more</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
