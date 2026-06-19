import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format, startOfWeek, endOfWeek, subDays } from 'date-fns'
import { CheckCircle2, Clock, MessageSquare, Star, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatCard } from '@/components/dashboard/stat-card'
import { WeeklyTaskChart } from '@/components/dashboard/weekly-task-chart'
import { RatingTrendChart } from '@/components/dashboard/rating-trend-chart'
import { QuickTaskForm } from '@/components/tasks/quick-task-form'
import { TodayTicketCard } from '@/components/employee/today-ticket-card'
import { getStatusColor, formatDate, formatWeekRange, getRatingColor } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { DailyTask, Feedback, Ticket } from '@/types/database'

export default async function EmployeeDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const today = format(new Date(), 'yyyy-MM-dd')
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd')

  // Mark any past tickets that weren't actioned as Incomplete
  await supabase
    .from('tickets')
    .update({ status: 'Incomplete' })
    .eq('assigned_to', user.id)
    .in('status', ['Open', 'In Progress'])
    .lt('due_date', today)

  const [tasksRes, feedbackRes, todayTaskRes, todayTicketRes] = await Promise.all([
    supabase.from('daily_tasks').select('*')
      .eq('employee_id', user.id)
      .gte('task_date', thirtyDaysAgo)
      .order('task_date', { ascending: false }),
    supabase.from('feedback').select('*')
      .eq('employee_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase.from('daily_tasks').select('*')
      .eq('employee_id', user.id)
      .eq('task_date', today)
      .maybeSingle(),
    supabase.from('tickets').select('*')
      .eq('assigned_to', user.id)
      .eq('due_date', today)
      .maybeSingle(),
  ])

  const allTasks = (tasksRes.data ?? []) as DailyTask[]
  const allFeedback = (feedbackRes.data ?? []) as Feedback[]
  const todayTask = (todayTaskRes.data ?? null) as DailyTask | null
  const todayTicket = (todayTicketRes.data ?? null) as Ticket | null

  // Stats
  const weekTasks = allTasks.filter(t => t.task_date >= weekStart && t.task_date <= weekEnd)
  const avgRating = allFeedback.length
    ? (allFeedback.reduce((s, f) => s + f.performance_rating, 0) / allFeedback.length).toFixed(1)
    : 'N/A'

  // Weekly chart data (last 7 days)
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd')
    const task = allTasks.find(t => t.task_date === d)
    return {
      date: format(subDays(new Date(), 6 - i), 'EEE'),
      hours: task?.hours_worked ?? 0,
      status: task?.completion_status ?? null,
    }
  })

  // Rating trend
  const ratingTrend = allFeedback.slice().reverse().slice(-6).map(f => ({
    week: formatWeekRange(f.week_start, f.week_end).split('–')[0].trim(),
    rating: f.performance_rating,
  }))

  const completionRate = allTasks.length
    ? Math.round((allTasks.filter(t => t.completion_status === 'Completed').length / allTasks.length) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">My Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </div>

      {/* Today's assigned ticket */}
      <TodayTicketCard ticket={todayTicket} />

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Task"
          value={todayTask ? todayTask.completion_status : 'Not submitted'}
          icon={<CheckCircle2 className="h-4 w-4" />}
          color={todayTask?.completion_status === 'Completed' ? 'green' : todayTask ? 'blue' : 'gray'}
        />
        <StatCard
          title="Tasks This Week"
          value={weekTasks.length}
          icon={<Clock className="h-4 w-4" />}
          color="blue"
          suffix={`/ 5`}
        />
        <StatCard
          title="Feedback Received"
          value={allFeedback.length}
          icon={<MessageSquare className="h-4 w-4" />}
          color="purple"
        />
        <StatCard
          title="Avg Rating"
          value={avgRating}
          icon={<Star className="h-4 w-4" />}
          color={Number(avgRating) >= 4 ? 'green' : Number(avgRating) >= 3 ? 'yellow' : 'red'}
          suffix={avgRating !== 'N/A' ? '/5' : ''}
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Charts - left 2/3 */}
        <div className="xl:col-span-2 space-y-6">
          <WeeklyTaskChart data={last7} />
          <RatingTrendChart data={ratingTrend} />
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Quick task form */}
          <QuickTaskForm existingTask={todayTask} employeeId={user.id} />

          {/* Performance summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                30-Day Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tasks submitted</span>
                <span className="font-semibold">{allTasks.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Completion rate</span>
                <span className="font-semibold">{completionRate}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Avg hours/day</span>
                <span className="font-semibold">
                  {allTasks.length
                    ? (allTasks.reduce((s, t) => s + t.hours_worked, 0) / allTasks.length).toFixed(1)
                    : '0'}h
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Average rating</span>
                <span className={cn('font-semibold', avgRating !== 'N/A' && getRatingColor(Number(avgRating)))}>
                  {avgRating !== 'N/A' ? `${avgRating}/5` : 'No data'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent feedback */}
      {allFeedback.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Recent Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {allFeedback.slice(0, 3).map(f => (
                <div key={f.id} className="flex gap-4 p-3 rounded-lg bg-muted/50">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-muted-foreground">
                        {formatWeekRange(f.week_start, f.week_end)}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {'⭐'.repeat(f.performance_rating)}
                      </Badge>
                    </div>
                    <p className="text-sm line-clamp-2">{f.feedback_text}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
