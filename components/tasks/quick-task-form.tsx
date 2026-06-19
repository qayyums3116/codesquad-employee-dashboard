'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { Loader2, Zap } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { DailyTask } from '@/types/database'
import { useRouter } from 'next/navigation'

const taskSchema = z.object({
  task_description: z.string().min(10, 'Describe your task (min 10 characters)'),
  hours_worked: z.number().min(0.5, 'Min 0.5h').max(24, 'Max 24h'),
  completion_status: z.enum(['Completed', 'In Progress', 'Blocked']),
})
type TaskForm = z.infer<typeof taskSchema>

interface QuickTaskFormProps {
  existingTask: DailyTask | null
  employeeId: string
}

export function QuickTaskForm({ existingTask, employeeId }: QuickTaskFormProps) {
  const router = useRouter()
  const today = format(new Date(), 'yyyy-MM-dd')

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

    if (existingTask) {
      const { error } = await supabase.from('daily_tasks').update(data).eq('id', existingTask.id)
      if (error) { toast.error('Failed to update task'); return }
      toast.success('Task updated!')
    } else {
      const { error } = await supabase.from('daily_tasks').insert({
        ...data,
        employee_id: employeeId,
        task_date: today,
      })
      if (error) { toast.error('Failed to submit task'); return }
      toast.success('Task submitted!')
    }
    router.refresh()
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          {existingTask ? "Update Today's Task" : "Submit Today's Task"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Task Description</Label>
            <Textarea
              {...register('task_description')}
              placeholder="What did you work on today?"
              rows={3}
              className="text-sm resize-none"
            />
            {errors.task_description && (
              <p className="text-xs text-destructive">{errors.task_description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Hours Worked</Label>
              <Input
                type="number"
                step="0.5"
                min="0.5"
                max="24"
                {...register('hours_worked', { valueAsNumber: true })}
                className="text-sm"
              />
              {errors.hours_worked && (
                <p className="text-xs text-destructive">{errors.hours_worked.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Status</Label>
              <Select value={statusValue} onValueChange={v => setValue('completion_status', (v ?? 'In Progress') as TaskForm['completion_status'])}>
                <SelectTrigger className="text-sm">
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

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</> : existingTask ? 'Update Task' : 'Submit Task'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
