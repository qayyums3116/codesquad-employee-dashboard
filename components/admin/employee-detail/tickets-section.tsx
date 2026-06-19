'use client'

import { useState, useTransition } from 'react'
import { format, parseISO, isPast } from 'date-fns'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Ticket, Star, Pencil, Trash2, ChevronDown, ChevronUp, Loader2, Check, X,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Ticket as TicketType } from '@/types/database'
import { cn, getTicketPriorityColor, getTicketStatusColor } from '@/lib/utils'
import { AssignTicketDialog } from './assign-ticket-dialog'
import { saveTicketFeedback, deleteTicket } from '@/app/admin/employees/[id]/actions'

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          className={cn(
            'text-xl leading-none transition-colors select-none cursor-pointer hover:scale-110',
            (hovered || value) >= n ? 'text-yellow-400' : 'text-muted-foreground/25',
          )}
        >★</button>
      ))}
    </div>
  )
}

function TicketCard({ ticket, employeeId }: { ticket: TicketType; employeeId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [expanded, setExpanded] = useState(false)
  const [feedbackMode, setFeedbackMode] = useState(false)
  const [feedbackText, setFeedbackText] = useState(ticket.feedback_text ?? '')
  const [feedbackRating, setFeedbackRating] = useState(ticket.feedback_rating ?? 0)

  const isOverdue = ticket.due_date && ticket.status !== 'Completed' && ticket.status !== 'Cancelled'
    && isPast(parseISO(ticket.due_date))

  function handleSaveFeedback() {
    if (!feedbackRating || !feedbackText.trim()) {
      toast.error('Please add a rating and feedback text')
      return
    }
    startTransition(async () => {
      const res = await saveTicketFeedback({
        ticketId: ticket.id, employeeId,
        feedbackText: feedbackText.trim(), feedbackRating,
      })
      if (res.error) { toast.error(res.error); return }
      toast.success('Feedback saved!')
      setFeedbackMode(false)
      router.refresh()
    })
  }

  function handleDelete() {
    if (!confirm(`Delete ticket "${ticket.title}"?`)) return
    startTransition(async () => {
      const res = await deleteTicket(ticket.id, employeeId)
      if (res.error) { toast.error(res.error); return }
      toast.success('Ticket deleted')
      router.refresh()
    })
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header row */}
      <div
        className="flex flex-wrap items-start gap-3 p-4 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="font-medium text-sm truncate">{ticket.title}</span>
            <Badge variant="outline" className={cn('text-xs shrink-0', getTicketPriorityColor(ticket.priority))}>
              {ticket.priority}
            </Badge>
            <Badge variant="outline" className={cn('text-xs shrink-0', getTicketStatusColor(ticket.status))}>
              {ticket.status}
            </Badge>
            {isOverdue && (
              <Badge variant="destructive" className="text-xs shrink-0">Overdue</Badge>
            )}
          </div>
          {ticket.due_date && (
            <p className={cn('text-xs', isOverdue ? 'text-destructive' : 'text-muted-foreground')}>
              Due {format(parseISO(ticket.due_date), 'MMM dd, yyyy')}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
          {ticket.status === 'Completed' && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => { setExpanded(true); setFeedbackMode(true) }}
            >
              <Star className="h-3 w-3 mr-1" />
              {ticket.feedback_rating ? 'Edit Feedback' : 'Add Feedback'}
            </Button>
          )}
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div className="border-t px-4 py-3 bg-muted/10 space-y-3">
          <p className="text-sm text-muted-foreground leading-relaxed">{ticket.description}</p>

          {/* Existing feedback display */}
          {ticket.feedback_rating && !feedbackMode && (
            <div className="bg-background border rounded-lg p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Admin Feedback</p>
                <button
                  onClick={() => setFeedbackMode(true)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(n => (
                  <span key={n} className={cn('text-lg', n <= ticket.feedback_rating! ? 'text-yellow-400' : 'text-muted-foreground/25')}>★</span>
                ))}
              </div>
              <p className="text-sm">{ticket.feedback_text}</p>
            </div>
          )}

          {/* Feedback form */}
          {feedbackMode && (
            <div className="bg-background border rounded-lg p-3 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {ticket.feedback_rating ? 'Edit Feedback' : 'Add Feedback'}
              </p>
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Rating *</p>
                <StarPicker value={feedbackRating} onChange={setFeedbackRating} />
              </div>
              <Textarea
                value={feedbackText}
                onChange={e => setFeedbackText(e.target.value)}
                placeholder="Write feedback on this ticket…"
                rows={3}
                className="text-sm resize-none"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveFeedback} disabled={isPending || !feedbackRating}>
                  {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-1" />}
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setFeedbackMode(false)}>
                  <X className="h-3.5 w-3.5 mr-1" /> Cancel
                </Button>
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Assigned {format(parseISO(ticket.created_at), 'MMM dd, yyyy')}
          </p>
        </div>
      )}
    </div>
  )
}

interface TicketsSectionProps {
  tickets: TicketType[]
  employeeId: string
}

export function TicketsSection({ tickets, employeeId }: TicketsSectionProps) {
  const open = tickets.filter(t => t.status === 'Open' || t.status === 'In Progress')
  const done = tickets.filter(t => t.status === 'Completed' || t.status === 'Cancelled')

  return (
    <Card>
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Ticket className="h-4 w-4 text-primary" />
            Tickets
            {tickets.length > 0 && (
              <span className="text-xs font-normal text-muted-foreground">({tickets.length})</span>
            )}
          </CardTitle>
          <AssignTicketDialog employeeId={employeeId} />
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {tickets.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No tickets assigned yet. Click "Assign Ticket" to create one.
          </div>
        ) : (
          <>
            {open.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Active ({open.length})
                </p>
                {open.map(t => <TicketCard key={t.id} ticket={t} employeeId={employeeId} />)}
              </div>
            )}
            {done.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Completed / Cancelled ({done.length})
                </p>
                {done.map(t => <TicketCard key={t.id} ticket={t} employeeId={employeeId} />)}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
