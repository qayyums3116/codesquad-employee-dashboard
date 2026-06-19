'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Loader2, Ticket } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { assignTicket } from '@/app/admin/employees/[id]/actions'

const schema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  priority: z.enum(['Low', 'Medium', 'High', 'Critical']),
  dueDate: z.string(),
})
type FormData = z.infer<typeof schema>

export function AssignTicketDialog({ employeeId }: { employeeId: string }) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { priority: 'Medium', dueDate: '' },
  })

  const priority = watch('priority')

  async function onSubmit(data: FormData) {
    const result = await assignTicket({ ...data, employeeId })
    if (result.error) { toast.error(result.error); return }
    toast.success('Ticket assigned successfully!')
    reset()
    setOpen(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
        <Ticket className="h-4 w-4" />
        Assign Ticket
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign New Ticket</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label>Title *</Label>
            <Input {...register('title')} placeholder="e.g. Fix login page bug" />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Description *</Label>
            <Textarea
              {...register('description')}
              placeholder="Describe the task in detail…"
              rows={3}
              className="resize-none"
            />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={v => setValue('priority', v as FormData['priority'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">🟢 Low</SelectItem>
                  <SelectItem value="Medium">🟡 Medium</SelectItem>
                  <SelectItem value="High">🟠 High</SelectItem>
                  <SelectItem value="Critical">🔴 Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Due Date</Label>
              <input
                type="date"
                {...register('dueDate')}
                className="w-full text-sm border rounded-md px-2.5 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" />Assigning…</> : 'Assign Ticket'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
