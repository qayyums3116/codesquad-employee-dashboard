'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { Loader2, CalendarDays, Clock, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { DailyTask } from '@/types/database'
import { getStatusColor } from '@/lib/utils'
import { useRouter } from 'next/navigation'

const taskSchema = z.object({
  task_description: z.string().min(10, 'Please describe your task in at least 10 characters'),
  hours_worked: z.number().min(0.5, 'Minimum 0.5 hours').max(24, 'Maximum 24 hours'),
  completion_status: z.enum(['Completed', 'In Progress', 'Blocked']),
})
type TaskForm = z.infer<typeof taskSchema>

interface TaskSubmitFormProps {
  existingTask: DailyTask | null
  employeeId: string
  today: string
}

export function TaskSubmitForm({ existingTask, employeeId, today }: TaskSubmitFormProps) {
  const router = useRouter()
  const isEdit = !!existingTask

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<TaskForm>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      task_description: existingTask?.task_description ?? '',
      hours_worked: existingTask?.hours_worked ?? 8,
      completion_status: existingTask?.completion_status ?? 'In Progress',
    },
  })

  const statusValue = watch('completion_status')

  async function onSubmit(data: TaskForm) {
    const supabase = createClient()

    if (isEdit) {
      const { error } = await supabase.from('daily_tasks').update(data).eq('id', existingTask!.id)
      if (error) { toast.error('Could not update task: ' + error.message); return }
      toast.success("Today's task updated successfully!")
    } else {
      const { error } = await supabase.from('daily_tasks').insert({
        ...data,
        employee_id: employeeId,
        task_date: today,
      })
      if (error) { toast.error('Could not submit task: ' + error.message); return }
      toast.success("Today's task submitted!")
    }
    router.refresh()
  }

  return (
    <div className="max-w-2xl">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{isEdit ? 'Update Task' : 'Submit Daily Task'}</CardTitle>
              <CardDescription className="flex items-center gap-1.5 mt-1">
                <CalendarDays className="h-3.5 w-3.5" />
                {format(new Date(), 'EEEE, MMMM d, yyyy')}
              </CardDescription>
            </div>
            {isEdit && (
              <Badge className={getStatusColor(existingTask!.completion_status)}>
                {existingTask!.completion_status}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="task_description">Task Description *</Label>
              <Textarea
                id="task_description"
                {...register('task_description')}
                placeholder="Describe what you worked on today in detail. Include tasks completed, meetings attended, blockers encountered, etc."
                rows={5}
              />
              {errors.task_description && (
                <p className="text-sm text-destructive">{errors.task_description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hours_worked">
                  <Clock className="inline h-3.5 w-3.5 mr-1" />
                  Hours Worked *
                </Label>
                <Input
                  id="hours_worked"
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="24"
                  {...register('hours_worked', { valueAsNumber: true })}
                />
                {errors.hours_worked && (
                  <p className="text-sm text-destructive">{errors.hours_worked.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>
                  <CheckCircle2 className="inline h-3.5 w-3.5 mr-1" />
                  Status *
                </Label>
                <Select
                  value={statusValue}
                  onValueChange={v => setValue('completion_status', (v ?? 'In Progress') as TaskForm['completion_status'])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Completed">✅ Completed</SelectItem>
                    <SelectItem value="In Progress">🔄 In Progress</SelectItem>
                    <SelectItem value="Blocked">🚫 Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</>
                : isEdit ? 'Update Task' : 'Submit Task'
              }
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
