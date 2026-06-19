'use client'

import { useState, useMemo } from 'react'
import { format, startOfWeek, endOfWeek, parseISO, subDays, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns'
import { Calendar, ChevronDown, X } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Link from 'next/link'
import { ArrowLeft, Clock, CheckCircle2, AlertCircle, Star } from 'lucide-react'
import { Profile, DailyTask, Feedback, Ticket } from '@/types/database'
import { getInitials, getStatusColor } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { WeeklySection } from './weekly-section'
import { TicketsSection } from './tickets-section'

type Preset = '7d' | '30d' | '3m' | 'all' | 'custom'

const PRESETS: { label: string; value: Preset }[] = [
  { label: 'Last 7 Days', value: '7d' },
  { label: 'Last 30 Days', value: '30d' },
  { label: 'Last 3 Months', value: '3m' },
  { label: 'All Time', value: 'all' },
  { label: 'Custom', value: 'custom' },
]

function getPresetRange(preset: Preset): { from: Date | null; to: Date | null } {
  const today = new Date()
  if (preset === '7d') return { from: subDays(today, 6), to: today }
  if (preset === '30d') return { from: subDays(today, 29), to: today }
  if (preset === '3m') return { from: subDays(today, 89), to: today }
  return { from: null, to: null }
}

interface Props {
  employee: Profile
  tasks: DailyTask[]
  feedbackList: Feedback[]
  tickets: Ticket[]
}

export function EmployeeDetailClient({ employee, tasks, feedbackList, tickets }: Props) {
  const [preset, setPreset] = useState<Preset>('7d')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [showCustom, setShowCustom] = useState(false)

  const { from, to } = useMemo(() => {
    if (preset === 'custom') {
      return {
        from: customFrom ? startOfDay(new Date(customFrom)) : null,
        to: customTo ? endOfDay(new Date(customTo)) : null,
      }
    }
    return getPresetRange(preset)
  }, [preset, customFrom, customTo])

  const filteredTasks = useMemo(() => tasks.filter(t => {
    const d = parseISO(t.task_date)
    if (from && isBefore(d, from)) return false
    if (to && isAfter(d, to)) return false
    return true
  }), [tasks, from, to])

  // Stats derived from filtered tasks
  const stats = useMemo(() => {
    const totalHours = filteredTasks.reduce((s, t) => s + t.hours_worked, 0)
    const completed = filteredTasks.filter(t => t.completion_status === 'Completed').length
    const blocked = filteredTasks.filter(t => t.completion_status === 'Blocked').length
    const rate = filteredTasks.length > 0 ? Math.round((completed / filteredTasks.length) * 100) : 0
    const ratings = feedbackList.filter(f => f.performance_rating > 0)
    const avgRating = ratings.length > 0
      ? (ratings.reduce((s, f) => s + f.performance_rating, 0) / ratings.length).toFixed(1)
      : null
    return { totalHours, rate, blocked, avgRating, total: filteredTasks.length }
  }, [filteredTasks, feedbackList])

  // Weekly hours chart data from filtered tasks
  const weeklyChartData = useMemo(() => {
    const map = new Map<string, number>()
    filteredTasks.forEach(t => {
      const key = format(startOfWeek(parseISO(t.task_date), { weekStartsOn: 1 }), 'MMM dd')
      map.set(key, (map.get(key) ?? 0) + t.hours_worked)
    })
    return [...map.entries()].map(([week, hours]) => ({ week, hours: Number(hours.toFixed(1)) }))
  }, [filteredTasks])

  // Group filtered tasks by week for the sections below
  const weekGroups = useMemo(() => {
    const map = new Map<string, { weekStart: string; weekEnd: string; tasks: DailyTask[] }>()
    filteredTasks.forEach(task => {
      const date = parseISO(task.task_date)
      const weekStart = format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd')
      const weekEnd = format(endOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd')
      if (!map.has(weekStart)) map.set(weekStart, { weekStart, weekEnd, tasks: [] })
      map.get(weekStart)!.tasks.push(task)
    })
    return [...map.values()].sort((a, b) => b.weekStart.localeCompare(a.weekStart))
  }, [filteredTasks])

  function applyPreset(p: Preset) {
    setPreset(p)
    if (p === 'custom') {
      setShowCustom(true)
    } else {
      setShowCustom(false)
    }
  }

  const rangeLabel = from && to
    ? `${format(from, 'MMM d')} – ${format(to, 'MMM d, yyyy')}`
    : from
    ? `From ${format(from, 'MMM d, yyyy')}`
    : 'All time'

  return (
    <div className="p-3 sm:p-6 space-y-5 max-w-5xl mx-auto">
      {/* Back + Employee name */}
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/admin/employees" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarFallback className="text-sm font-semibold bg-primary text-primary-foreground">
              {getInitials(employee.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-semibold leading-tight truncate">{employee.full_name}</p>
            <p className="text-xs text-muted-foreground truncate">{employee.email}</p>
          </div>
          <Badge variant="outline" className={cn('text-xs flex-shrink-0', getStatusColor(employee.status))}>
            {employee.status}
          </Badge>
        </div>
      </div>

      {/* ── ANALYTICS SECTION ── */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Analytics
              <span className="text-xs font-normal text-muted-foreground ml-1">({rangeLabel})</span>
            </CardTitle>

            {/* Preset filters */}
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map(p => (
                <button
                  key={p.value}
                  onClick={() => applyPreset(p.value)}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
                    preset === p.value
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border text-muted-foreground hover:border-primary hover:text-foreground'
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom date range inputs */}
          {showCustom && (
            <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t">
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground w-8">From</label>
                <input
                  type="date"
                  value={customFrom}
                  onChange={e => setCustomFrom(e.target.value)}
                  className="text-sm border rounded-md px-2.5 py-1.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground w-8">To</label>
                <input
                  type="date"
                  value={customTo}
                  onChange={e => setCustomTo(e.target.value)}
                  className="text-sm border rounded-md px-2.5 py-1.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <button
                onClick={() => { setCustomFrom(''); setCustomTo('') }}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <X className="h-3 w-3" /> Clear
              </button>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-5 space-y-5">
          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
                <Clock className="h-3.5 w-3.5" /> Total Hours
              </div>
              <p className="text-2xl font-bold">{stats.totalHours.toFixed(1)}h</p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" /> Completion
              </div>
              <p className="text-2xl font-bold">{stats.rate}%</p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
                <AlertCircle className="h-3.5 w-3.5" /> Blocked Days
              </div>
              <p className="text-2xl font-bold">{stats.blocked}</p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
                <Star className="h-3.5 w-3.5" /> Avg Rating
              </div>
              <p className="text-2xl font-bold">{stats.avgRating ? `${stats.avgRating}/5` : '—'}</p>
            </div>
          </div>

          {/* Bar chart */}
          {weeklyChartData.length > 0 ? (
            <div>
              <p className="text-xs text-muted-foreground mb-3">Hours per week</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={weeklyChartData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    formatter={(v: any) => [`${v}h`, 'Hours']}
                  />
                  <Bar dataKey="hours" fill="#2563EB" radius={[4, 4, 0, 0]} fillOpacity={0.85} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-20 text-sm text-muted-foreground">
              No tasks in this date range
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── TICKETS ── */}
      <TicketsSection tickets={tickets} employeeId={employee.id} />

      {/* ── WEEKLY TASK SECTIONS ── */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Task History & Feedback
        </h2>
        {weekGroups.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground border rounded-xl text-sm">
            No tasks found in this date range.
          </div>
        ) : weekGroups.map(week => (
          <WeeklySection
            key={week.weekStart}
            weekStart={week.weekStart}
            weekEnd={week.weekEnd}
            tasks={week.tasks}
            feedbackList={feedbackList.filter(f => f.week_start === week.weekStart)}
            employeeId={employee.id}
          />
        ))}
      </div>
    </div>
  )
}
