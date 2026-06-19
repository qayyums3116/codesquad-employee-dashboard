import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TaskSubmitForm } from '@/components/tasks/task-submit-form'
import { TaskHistoryTable } from '@/components/tasks/task-history-table'
import { DailyTask } from '@/types/database'
import { format } from 'date-fns'

export default async function EmployeeTasksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const today = format(new Date(), 'yyyy-MM-dd')

  const [todayTaskRes, allTasksRes] = await Promise.all([
    supabase.from('daily_tasks').select('*').eq('employee_id', user.id).eq('task_date', today).maybeSingle(),
    supabase.from('daily_tasks').select('*').eq('employee_id', user.id).order('task_date', { ascending: false }),
  ])

  const todayTask = (todayTaskRes.data ?? null) as DailyTask | null
  const allTasks = (allTasksRes.data ?? []) as DailyTask[]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Tasks</h1>
        <p className="text-muted-foreground text-sm mt-1">Submit and track your daily work</p>
      </div>

      <Tabs defaultValue="today" className="space-y-4">
        <TabsList>
          <TabsTrigger value="today">Today's Task</TabsTrigger>
          <TabsTrigger value="history">Task History</TabsTrigger>
        </TabsList>

        <TabsContent value="today">
          <TaskSubmitForm
            existingTask={todayTask}
            employeeId={user.id}
            today={today}
          />
        </TabsContent>

        <TabsContent value="history">
          <TaskHistoryTable tasks={allTasks} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
