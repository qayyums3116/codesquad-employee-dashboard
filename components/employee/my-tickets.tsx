'use client'

import { useState, useTransition } from 'react'
import { format, parseISO, isPast } from 'date-fns'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Ticket, ChevronDown, ChevronUp, CheckCircle2, Clock, Loader2, Star } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Ticket as TicketType, TicketStatus } from '@/types/database'
import { cn, getTicketPriorityColor, getTicketStatusColor } from '@/lib/utils'
import { updateTicketStatus } from '@/app/employee/actions'

const STATUS_FLOW: Record<string, TicketStatus | null> = {
  'Open':        'In Progress',
  'In Progress': 'Completed',
  'Completed':   null,
  'Cancelled':   null,
}

const STATUS_ACTION_LABEL: Record<string, string> = {
  'Open':        'Start Working',
  'In Progress': 'Mark Complete',
}

function TicketCard({ ticket }: { ticket: TicketType }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [expanded, setExpanded] = useState(false)

  const nextStatus = STATUS_FLOW[ticket.status]
  const actionLabel = STATUS_ACTION_LABEL[ticket.status]
  const isOverdue = ticket.due_date && ticket.status !== 'Completed' && ticket.status !== 'Cancelled'
    && isPast(parseISO(ticket.due_date))

  function handleStatusChange() {
    if (!nextStatus) return
    startTransition(async () => {
      const res = await updateTicketStatus(ticket.id, nextStatus)
      if (res.error) { toast.error(res.error); return }
      toast.success(`Ticket marked as ${nextStatus}`)
      router.refresh()
    })
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div
        className="flex flex-wrap items-start gap-3 p-4 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="font-medium text-sm">{ticket.title}</span>
            <Badge variant="outline" className={cn('text-xs shrink-0', getTicketPriorityColor(ticket.priority))}>
              {ticket.priority}
            </Badge>
            <Badge variant="outline" className={cn('text-xs shrink-0', getTicketStatusColor(ticket.status))}>
              {ticket.status}
            </Badge>
            {isOverdue && <Badge variant="destructive" className="text-xs shrink-0">Overdue</Badge>}
          </div>
          {ticket.due_date && (
            <p className={cn('text-xs', isOverdue ? 'text-destructive' : 'text-muted-foreground')}>
              Due {format(parseISO(ticket.due_date), 'MMM dd, yyyy')}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
          {actionLabel && nextStatus && (
            <Button
              size="sm"
              variant={nextStatus === 'Completed' ? 'default' : 'outline'}
              className="h-7 text-xs"
              disabled={isPending}
              onClick={handleStatusChange}
            >
              {isPending
                ? <Loader2 className="h-3 w-3 animate-spin" />
                : nextStatus === 'Completed'
                  ? <><CheckCircle2 className="h-3 w-3 mr-1" />{actionLabel}</>
                  : <><Clock className="h-3 w-3 mr-1" />{actionLabel}</>
              }
            </Button>
          )}
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t px-4 py-3 bg-muted/10 space-y-3">
          <p className="text-sm text-muted-foreground leading-relaxed">{ticket.description}</p>

          {/* Admin feedback */}
          {ticket.feedback_rating && (
            <div className="bg-background border rounded-lg p-3 space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Manager Feedback</p>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(n => (
                  <Star key={n} className={cn('h-4 w-4', n <= ticket.feedback_rating! ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/25')} />
                ))}
                <span className="text-sm font-medium ml-1">{ticket.feedback_rating}/5</span>
              </div>
              {ticket.feedback_text && (
                <p className="text-sm leading-relaxed">{ticket.feedback_text}</p>
              )}
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Assigned on {format(parseISO(ticket.created_at), 'MMM dd, yyyy')}
          </p>
        </div>
      )}
    </div>
  )
}

export function MyTickets({ tickets }: { tickets: TicketType[] }) {
  const active = tickets.filter(t => t.status === 'Open' || t.status === 'In Progress')
  const completed = tickets.filter(t => t.status === 'Completed')
  const cancelled = tickets.filter(t => t.status === 'Cancelled')

  if (tickets.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Ticket className="h-12 w-12 mb-3 opacity-30" />
          <p className="font-medium">No tickets assigned</p>
          <p className="text-sm mt-1">Your manager hasn't assigned any tickets yet.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', count: tickets.length, color: 'text-foreground' },
          { label: 'Active', count: active.length, color: 'text-blue-600' },
          { label: 'Completed', count: completed.length, color: 'text-green-600' },
          { label: 'Cancelled', count: cancelled.length, color: 'text-gray-500' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">{s.label}</p>
              <p className={cn('text-2xl font-bold mt-1', s.color)}>{s.count}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {active.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" /> Active Tickets ({active.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-2">
            {active.map(t => <TicketCard key={t.id} ticket={t} />)}
          </CardContent>
        </Card>
      )}

      {completed.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" /> Completed ({completed.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-2">
            {completed.map(t => <TicketCard key={t.id} ticket={t} />)}
          </CardContent>
        </Card>
      )}

      {cancelled.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground">
              Cancelled ({cancelled.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-2">
            {cancelled.map(t => <TicketCard key={t.id} ticket={t} />)}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
