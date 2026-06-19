'use client'

import { useState, useTransition, useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, MessageSquare, Pencil, X, Check, Star } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { DailyTask, Feedback } from '@/types/database'
import { getStatusColor } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { saveTaskNote, saveWeeklyFeedback } from '@/app/admin/employees/[id]/actions'

function StarPicker({ value, onChange, readonly }: { value: number; onChange?: (n: number) => void; readonly?: boolean }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(n)}
          onMouseEnter={() => !readonly && setHovered(n)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={cn(
            'text-xl leading-none transition-colors select-none',
            (hovered || value) >= n ? 'text-yellow-400' : 'text-muted-foreground/25',
            !readonly && 'hover:scale-110 cursor-pointer'
          )}
        >
          ★
        </button>
      ))}
    </div>
  )
}

interface WeeklySectionProps {
  weekStart: string
  weekEnd: string
  tasks: DailyTask[]
  feedbackList: Feedback[]
  employeeId: string
}

export function WeeklySection({ weekStart, weekEnd, tasks, feedbackList, employeeId }: WeeklySectionProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [noteText, setNoteText] = useState('')
  const [weeklyMode, setWeeklyMode] = useState<'view' | 'edit'>('view')
  const [weeklyRating, setWeeklyRating] = useState(0)
  const [weeklyText, setWeeklyText] = useState('')

  const weeklyFeedback = useMemo(
    () => feedbackList.find(f => f.week_start === weekStart),
    [feedbackList, weekStart]
  )

  const weekLabel = `${format(parseISO(weekStart), 'MMM dd (EEE)')} – ${format(parseISO(weekEnd), 'MMM dd (EEE)')}`
  const totalHours = tasks.reduce((s, t) => s + t.hours_worked, 0)
  const sortedTasks = [...tasks].sort((a, b) => a.task_date.localeCompare(b.task_date))

  function startNoteEdit(task: DailyTask) {
    setNoteText((task as any).admin_notes ?? '')
    setEditingTaskId(task.id)
  }

  function handleSaveNote(task: DailyTask) {
    startTransition(async () => {
      const res = await saveTaskNote(task.id, noteText, employeeId)
      if (res.error) { toast.error(res.error); return }
      toast.success('Note saved')
      setEditingTaskId(null)
      router.refresh()
    })
  }

  function openWeeklyForm() {
    setWeeklyRating(weeklyFeedback?.performance_rating ?? 0)
    setWeeklyText(weeklyFeedback?.feedback_text ?? '')
    setWeeklyMode('edit')
  }

  function handleSaveWeekly() {
    if (weeklyRating === 0 || !weeklyText.trim()) {
      toast.error('Please set a rating and add feedback text')
      return
    }
    startTransition(async () => {
      const res = await saveWeeklyFeedback({
        employeeId, weekStart, weekEnd,
        rating: weeklyRating,
        feedbackText: weeklyText.trim(),
        existingId: weeklyFeedback?.id,
      })
      if (res.error) { toast.error(res.error); return }
      toast.success('Weekly feedback saved!')
      setWeeklyMode('view')
      router.refresh()
    })
  }

  return (
    <Card className="overflow-hidden">
      {/* Week header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-5 py-3 bg-muted/30 border-b">
        <div className="min-w-0">
          <h3 className="font-semibold text-sm truncate">🗓 {weekLabel}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {tasks.length} task{tasks.length !== 1 ? 's' : ''} · {totalHours.toFixed(1)}h total
          </p>
        </div>
        {weeklyFeedback && (
          <StarPicker value={weeklyFeedback.performance_rating} readonly />
        )}
      </div>

      {/* Task table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/20">
              <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground w-32">Date</th>
              <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground">Task Description</th>
              <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground w-16">Hours</th>
              <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground w-28">Status</th>
              <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground w-60">Daily Note (Optional)</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {sortedTasks.map(task => {
              const adminNote = (task as any).admin_notes as string | null
              const isEditing = editingTaskId === task.id
              return (
                <tr key={task.id} className="hover:bg-muted/20 align-top">
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {format(parseISO(task.task_date), 'EEE, MMM dd')}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm leading-snug whitespace-pre-wrap">{task.task_description}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{task.hours_worked}h</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={cn('text-xs', getStatusColor(task.completion_status))}>
                      {task.completion_status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <div className="space-y-1.5">
                        <Textarea
                          value={noteText}
                          onChange={e => setNoteText(e.target.value)}
                          placeholder="Add a note for this day…"
                          rows={2}
                          className="text-xs resize-none min-h-0 py-1.5"
                          autoFocus
                        />
                        <div className="flex gap-1">
                          <Button size="sm" className="h-6 px-2 text-xs" onClick={() => handleSaveNote(task)} disabled={isPending}>
                            {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                          </Button>
                          <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => setEditingTaskId(null)}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ) : adminNote ? (
                      <div className="flex items-start gap-1.5 group">
                        <p className="text-xs text-muted-foreground line-clamp-2 flex-1">{adminNote}</p>
                        <button
                          onClick={() => startNoteEdit(task)}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity mt-0.5 flex-shrink-0"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startNoteEdit(task)}
                        className="flex items-center gap-1 text-xs text-muted-foreground/60 hover:text-primary transition-colors"
                      >
                        <MessageSquare className="h-3 w-3" />
                        <span>Add note</span>
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Weekly feedback section */}
      <div className="border-t p-4 bg-muted/10">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold flex items-center gap-1.5">
            <Star className="h-3.5 w-3.5 text-yellow-500" />
            Weekly Feedback
          </h4>
          {weeklyFeedback && weeklyMode === 'view' && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={openWeeklyForm}>
              <Pencil className="h-3 w-3 mr-1" /> Edit
            </Button>
          )}
        </div>

        {weeklyMode === 'view' && weeklyFeedback ? (
          <div className="space-y-2">
            <StarPicker value={weeklyFeedback.performance_rating} readonly />
            <p className="text-sm text-muted-foreground leading-relaxed">{weeklyFeedback.feedback_text}</p>
          </div>
        ) : weeklyMode === 'view' ? (
          <button
            onClick={openWeeklyForm}
            className="text-sm text-muted-foreground/60 hover:text-primary transition-colors flex items-center gap-1.5"
          >
            <Star className="h-3.5 w-3.5" />
            Add weekly feedback & rating…
          </button>
        ) : (
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Performance Rating *</p>
              <StarPicker value={weeklyRating} onChange={setWeeklyRating} />
            </div>
            <Textarea
              value={weeklyText}
              onChange={e => setWeeklyText(e.target.value)}
              placeholder="Write weekly performance feedback for the employee…"
              rows={3}
              className="text-sm resize-none"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSaveWeekly} disabled={isPending || weeklyRating === 0}>
                {isPending ? <><Loader2 className="mr-1.5 h-3 w-3 animate-spin" />Saving…</> : 'Save Feedback'}
              </Button>
              {weeklyFeedback && (
                <Button size="sm" variant="ghost" onClick={() => setWeeklyMode('view')}>Cancel</Button>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
