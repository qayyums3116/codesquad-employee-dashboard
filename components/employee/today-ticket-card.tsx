'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Ticket, CheckCircle2, Clock, Loader2, AlertTriangle, Star } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Ticket as TicketType, TicketStatus } from '@/types/database'
import { cn, getTicketPriorityColor, getTicketStatusColor } from '@/lib/utils'
import { updateTicketStatus } from '@/app/employee/actions'

const NEXT_STATUS: Partial<Record<TicketStatus, TicketStatus>> = {
  'Open':        'In Progress',
  'In Progress': 'Completed',
}
const ACTION_LABEL: Partial<Record<TicketStatus, string>> = {
  'Open':        'Start Working',
  'In Progress': 'Mark as Complete',
}

const LEFT_BORDER: Record<string, string> = {
  'Completed':   'border-l-green-500',
  'In Progress': 'border-l-yellow-500',
  'Incomplete':  'border-l-red-500',
  'Open':        'border-l-primary',
}

export function TodayTicketCard({ ticket }: { ticket: TicketType | null }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleStatus(next: TicketStatus) {
    startTransition(async () => {
      const res = await updateTicketStatus(ticket!.id, next)
      if (res.error) { toast.error(res.error); return }
      toast.success(`Ticket marked as ${next}`)
      router.refresh()
    })
  }

  if (!ticket) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="flex items-center gap-3 p-4 text-muted-foreground">
          <Ticket className="h-5 w-5 shrink-0" />
          <div>
            <p className="text-sm font-medium">No task assigned for today</p>
            <p className="text-xs mt-0.5">Your manager hasn't assigned a task yet.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const nextStatus = NEXT_STATUS[ticket.status]
  const actionLabel = ACTION_LABEL[ticket.status]
  const borderClass = LEFT_BORDER[ticket.status] ?? 'border-l-primary'

  return (
    <Card className={cn('border-l-4', borderClass)}>
      <CardHeader className="pb-2 pt-4 px-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Ticket className="h-4 w-4 text-primary" />
            Today's Assigned Task
          </CardTitle>
          <div className="flex gap-2 flex-wrap">
            <Badge variant="outline" className={cn('text-xs', getTicketPriorityColor(ticket.priority))}>
              {ticket.priority}
            </Badge>
            <Badge variant="outline" className={cn('text-xs', getTicketStatusColor(ticket.status))}>
              {ticket.status === 'Incomplete' && <AlertTriangle className="h-3 w-3 mr-1" />}
              {ticket.status}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-5 pb-4 space-y-3">
        <div>
          <p className="font-semibold">{ticket.title}</p>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{ticket.description}</p>
        </div>

        {ticket.status === 'Incomplete' && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            This task was not completed and has been marked Incomplete.
          </div>
        )}

        {nextStatus && actionLabel && (
          <Button
            size="sm"
            variant={nextStatus === 'Completed' ? 'default' : 'outline'}
            disabled={isPending}
            onClick={() => handleStatus(nextStatus)}
            className="gap-1.5"
          >
            {isPending
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : nextStatus === 'Completed'
                ? <CheckCircle2 className="h-3.5 w-3.5" />
                : <Clock className="h-3.5 w-3.5" />
            }
            {actionLabel}
          </Button>
        )}

        {ticket.status === 'Completed' && (
          <div className="flex items-center gap-1.5 text-sm">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span className="text-green-600 font-medium">Completed!</span>
            {ticket.feedback_rating ? (
              <span className="ml-2 flex items-center gap-0.5">
                {[1,2,3,4,5].map(n => (
                  <Star key={n} className={cn('h-3.5 w-3.5', n <= ticket.feedback_rating! ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30')} />
                ))}
              </span>
            ) : (
              <span className="text-muted-foreground text-xs ml-1">Awaiting feedback</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
