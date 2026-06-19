'use client'

import { useState, useMemo } from 'react'
import { Search, Download, Filter } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DailyTask } from '@/types/database'
import { getInitials, getStatusColor, DEPARTMENTS } from '@/lib/utils'
import { cn } from '@/lib/utils'

type TaskWithProfile = {
  id: string
  employee_id: string
  task_date: string
  task_description: string
  completion_status: string
  hours_worked: number
  created_at: string
  updated_at: string
  profiles: { full_name: string; email: string; department: string | null; avatar_url: string | null } | null
}

const PAGE_SIZE = 15

interface AdminTaskTableProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tasks: any[]
}

export function AdminTaskTable({ tasks }: AdminTaskTableProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [deptFilter, setDeptFilter] = useState('all')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => (tasks as TaskWithProfile[]).filter(t => {
    const q = search.toLowerCase()
    const matchSearch = (t.profiles?.full_name ?? '').toLowerCase().includes(q) ||
      t.task_description.toLowerCase().includes(q)
    const matchStatus = statusFilter === 'all' || t.completion_status === statusFilter
    const matchDept = deptFilter === 'all' || t.profiles?.department === deptFilter
    return matchSearch && matchStatus && matchDept
  }), [tasks, search, statusFilter, deptFilter])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function exportCSV() {
    const rows = [
      ['Employee', 'Email', 'Department', 'Date', 'Task', 'Hours', 'Status'],
      ...filtered.map(t => [
        t.profiles?.full_name ?? '',
        t.profiles?.email ?? '',
        t.profiles?.department ?? '',
        t.task_date,
        `"${t.task_description.replace(/"/g, '""')}"`,
        t.hours_worked,
        t.completion_status,
      ]),
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `tasks-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          <div className="flex flex-1 flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employee or task…"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={v => { setStatusFilter(v ?? 'all'); setPage(1) }}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
            <Select value={deptFilter} onValueChange={v => { setDeptFilter(v ?? 'all'); setPage(1) }}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" onClick={exportCSV} className="shrink-0">
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{filtered.length} task{filtered.length !== 1 ? 's' : ''} found</p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Employee</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Dept</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Task</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground w-16">Hrs</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-muted-foreground">No tasks match your filters</td>
                </tr>
              ) : paginated.map(task => (
                <tr key={task.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={task.profiles?.avatar_url ?? undefined} />
                        <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                          {task.profiles ? getInitials(task.profiles.full_name) : '?'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium whitespace-nowrap">{task.profiles?.full_name ?? '—'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                    {task.profiles?.department ?? '—'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {format(parseISO(task.task_date), 'MMM dd, yyyy')}
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <p className="truncate">{task.task_description}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{task.hours_worked}h</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={cn('text-xs', getStatusColor(task.completion_status))}>
                      {task.completion_status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-xs text-muted-foreground">
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex gap-1.5">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
              <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
