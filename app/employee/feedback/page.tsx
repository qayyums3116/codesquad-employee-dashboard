import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, Star } from 'lucide-react'
import { formatWeekRange, getRatingColor } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { format, parseISO } from 'date-fns'

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={cn('h-4 w-4', i <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30')}
        />
      ))}
      <span className={cn('ml-1.5 text-sm font-semibold', getRatingColor(rating))}>
        {rating}/5
      </span>
    </div>
  )
}

export default async function EmployeeFeedbackPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: feedback } = await supabase
    .from('feedback')
    .select('*, admin:profiles!feedback_admin_id_fkey(full_name)')
    .eq('employee_id', user.id)
    .order('created_at', { ascending: false })

  const allFeedback = feedback ?? []
  const avgRating = allFeedback.length
    ? (allFeedback.reduce((s, f) => s + f.performance_rating, 0) / allFeedback.length).toFixed(1)
    : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Feedback</h1>
        <p className="text-muted-foreground text-sm mt-1">Weekly performance feedback from your manager</p>
      </div>

      {/* Summary row */}
      {allFeedback.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Reviews</p>
              <p className="text-2xl font-bold mt-1">{allFeedback.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Average Rating</p>
              <div className="flex items-baseline gap-1 mt-1">
                <p className={cn('text-2xl font-bold', avgRating && getRatingColor(Number(avgRating)))}>{avgRating}</p>
                <span className="text-sm text-muted-foreground">/5</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Latest Rating</p>
              <div className="mt-1">
                <StarRating rating={allFeedback[0].performance_rating} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Feedback cards */}
      {allFeedback.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mb-3 opacity-30" />
            <p className="font-medium">No feedback yet</p>
            <p className="text-sm mt-1">Your manager hasn't submitted feedback yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {allFeedback.map((f, i) => (
            <Card key={f.id} className={cn('card-hover', i === 0 && 'border-primary/30 bg-primary/5 dark:bg-primary/5')}>
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-sm font-semibold">
                        {formatWeekRange(f.week_start, f.week_end)}
                      </CardTitle>
                      {i === 0 && <Badge className="text-xs bg-primary/10 text-primary">Latest</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Submitted {format(parseISO(f.created_at), 'MMM d, yyyy')}
                      {f.admin && ` by ${(f.admin as { full_name: string }).full_name}`}
                    </p>
                  </div>
                  <StarRating rating={f.performance_rating} />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm leading-relaxed">{f.feedback_text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
