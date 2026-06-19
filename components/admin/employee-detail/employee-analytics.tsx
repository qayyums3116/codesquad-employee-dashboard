'use client'

import { useMemo } from 'react'
import { format, parseISO, startOfWeek } from 'date-fns'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DailyTask } from '@/types/database'
import { Clock, CheckCircle2, AlertCircle, Star } from 'lucide-react'

interface EmployeeAnalyticsProps {
  tasks: DailyTask[]
  feedbackList: any[]
}

export function EmployeeAnalytics({ tasks, feedbackList }: EmployeeAnalyticsProps) {
  const stats = useMemo(() => {
    const totalHours = tasks.reduce((s, t) => s + t.hours_worked, 0)
    const completed = tasks.filter(t => t.completion_status === 'Completed').length
    const blocked = tasks.filter(t => t.completion_status === 'Blocked').length
    const rate = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0
    const ratings = feedbackList.filter(f => f.performance_rating > 0)
    const avgRating = ratings.length > 0
      ? (ratings.reduce((s: number, f: any) => s + f.performance_rating, 0) / ratings.length).toFixed(1)
      : null
    return { totalHours, completed, blocked, rate, avgRating, total: tasks.length }
  }, [tasks, feedbackList])

  const weeklyData = useMemo(() => {
    const map = new Map<string, number>()
    tasks.forEach(t => {
      const key = format(startOfWeek(parseISO(t.task_date), { weekStartsOn: 1 }), 'MMM dd')
      map.set(key, (map.get(key) ?? 0) + t.hours_worked)
    })
    return [...map.entries()].map(([week, hours]) => ({ week, hours: Number(hours.toFixed(1)) }))
  }, [tasks])

  if (tasks.length === 0) return null

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Clock className="h-3.5 w-3.5" /> Avg Hours/Day
            </div>
            <p className="text-2xl font-bold">{(stats.totalHours / stats.total).toFixed(1)}h</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> Completion
            </div>
            <p className="text-2xl font-bold">{stats.rate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <AlertCircle className="h-3.5 w-3.5" /> Blocked Days
            </div>
            <p className="text-2xl font-bold">{stats.blocked}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Star className="h-3.5 w-3.5" /> Avg Rating
            </div>
            <p className="text-2xl font-bold">{stats.avgRating ? `${stats.avgRating}/5` : '—'}</p>
          </CardContent>
        </Card>
      </div>

      {weeklyData.length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Weekly Hours Worked</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={weeklyData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: any) => [`${v}h`, 'Hours']} />
                <Bar dataKey="hours" fill="#2563EB" radius={[4, 4, 0, 0]} fillOpacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
