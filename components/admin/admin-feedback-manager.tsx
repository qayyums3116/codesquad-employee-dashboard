'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { format, startOfWeek, endOfWeek } from 'date-fns'
import { Loader2, Star, Edit, Trash2, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import { Feedback } from '@/types/database'
import { getInitials, formatWeekRange, getRatingColor } from '@/lib/utils'
import { cn } from '@/lib/utils'

const schema = z.object({
  employee_id: z.string().min(1, 'Select an employee'),
  week_start: z.string().min(1, 'Required'),
  week_end: z.string().min(1, 'Required'),
  feedback_text: z.string().min(20, 'Feedback must be at least 20 characters'),
})
type FormData = z.infer<typeof schema>

type Employee = { id: string; full_name: string; email: string; department: string | null; avatar_url: string | null }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FeedbackWithEmployee = any

interface AdminFeedbackManagerProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  employees: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  feedback: any[]
  adminId: string
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i} type="button"
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(i)}
          className="focus:outline-none"
        >
          <Star className={cn(
            'h-7 w-7 transition-colors',
            i <= (hover || value) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'
          )} />
        </button>
      ))}
      <span className="ml-2 text-sm font-medium self-center">{value}/5</span>
    </div>
  )
}

export function AdminFeedbackManager({ employees, feedback: initialFeedback, adminId }: AdminFeedbackManagerProps) {
  const router = useRouter()
  const [feedback, setFeedback] = useState(initialFeedback)
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<FeedbackWithEmployee | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [rating, setRating] = useState(3)

  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { employee_id: '', week_start: weekStart, week_end: weekEnd, feedback_text: '' },
  })

  function openCreate() {
    setEditTarget(null)
    reset({ employee_id: '', week_start: weekStart, week_end: weekEnd, feedback_text: '' })
    setRating(3)
    setFormOpen(true)
  }

  function openEdit(fb: FeedbackWithEmployee) {
    setEditTarget(fb)
    reset({
      employee_id: fb.employee_id,
      week_start: fb.week_start,
      week_end: fb.week_end,
      feedback_text: fb.feedback_text,
    })
    setRating(fb.performance_rating)
    setFormOpen(true)
  }

  async function onSubmit(data: FormData) {
    const supabase = createClient()
    const payload = { ...data, performance_rating: rating }

    if (editTarget) {
      const { data: updated, error } = await supabase
        .from('feedback').update(payload).eq('id', editTarget.id).select('*, employee:profiles!feedback_employee_id_fkey(full_name, department)').single()
      if (error) { toast.error('Failed to update feedback'); return }
      setFeedback((prev: FeedbackWithEmployee[]) => prev.map((f: FeedbackWithEmployee) => f.id === editTarget.id ? updated : f))
      toast.success('Feedback updated!')
    } else {
      const { data: created, error } = await supabase
        .from('feedback').insert({ ...payload, admin_id: adminId }).select('*, employee:profiles!feedback_employee_id_fkey(full_name, department)').single()
      if (error) { toast.error('Failed to submit feedback: ' + error.message); return }
      setFeedback((prev: FeedbackWithEmployee[]) => [created, ...prev])
      toast.success('Feedback submitted!')
    }

    setFormOpen(false)
    router.refresh()
  }

  async function deleteFeedback() {
    if (!deleteTarget) return
    setDeleting(true)
    const supabase = createClient()
    await supabase.from('feedback').delete().eq('id', deleteTarget)
    setFeedback(prev => prev.filter(f => f.id !== deleteTarget))
    toast.success('Feedback deleted')
    setDeleteTarget(null)
    setDeleting(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Add Feedback
        </Button>
      </div>

      {/* Feedback list */}
      {feedback.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Star className="h-12 w-12 mb-3 opacity-30" />
            <p className="font-medium">No feedback submitted yet</p>
            <p className="text-sm mt-1">Click "Add Feedback" to give an employee their first review.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {feedback.map(fb => {
            const emp = fb.employee as { full_name: string; department: string | null } | null
            return (
              <Card key={fb.id} className="card-hover">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{emp?.full_name ?? 'Unknown'}</span>
                        {emp?.department && (
                          <Badge variant="secondary" className="text-xs">{emp.department}</Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {formatWeekRange(fb.week_start, fb.week_end)}
                        </span>
                      </div>
                      <div className="flex items-center gap-0.5 mt-1.5">
                        {[1, 2, 3, 4, 5].map(i => (
                          <Star key={i} className={cn('h-3.5 w-3.5', i <= fb.performance_rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/20')} />
                        ))}
                        <span className={cn('text-xs font-semibold ml-1.5', getRatingColor(fb.performance_rating))}>
                          {fb.performance_rating}/5
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{fb.feedback_text}</p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(fb)}>
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(fb.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create/Edit dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editTarget ? 'Edit Feedback' : 'Submit Feedback'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Employee *</Label>
              <Select
                value={watch('employee_id')}
                onValueChange={v => setValue('employee_id', v ?? '')}
                disabled={!!editTarget}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee…" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map(e => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.full_name} {e.department ? `· ${e.department}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.employee_id && <p className="text-xs text-destructive">{errors.employee_id.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Week Start *</Label>
                <Input type="date" {...register('week_start')} />
              </div>
              <div className="space-y-2">
                <Label>Week End *</Label>
                <Input type="date" {...register('week_end')} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Performance Rating *</Label>
              <StarPicker value={rating} onChange={r => setRating(r)} />
            </div>

            <div className="space-y-2">
              <Label>Feedback *</Label>
              <Textarea
                {...register('feedback_text')}
                placeholder="Provide detailed, constructive feedback about this employee's performance for the week…"
                rows={4}
              />
              {errors.feedback_text && <p className="text-xs text-destructive">{errors.feedback_text.message}</p>}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : editTarget ? 'Update' : 'Submit'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Feedback</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">This will permanently delete the feedback and notify the employee.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={deleteFeedback} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
