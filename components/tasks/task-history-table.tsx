'use client'

import { useState, useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { Download, Search } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DailyTask } from '@/types/database'
import { getStatusColor, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 10

interface TaskHistoryTableProps {
  tasks: DailyTask[]
}

export function TaskHistoryTable({ tasks }: TaskHistoryTableProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    return tasks.filter(t => {
      const matchSearch = t.task_description.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' || t.completion_status === statusFilter
      return matchSearch && matchStatus
    })
  }, [tasks, search, statusFilter])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function exportCSV() {
    const rows = [
      ['Date', 'Task Description', 'Hours', 'Status', 'Submitted At'],
      ...filtered.map(t => [
        t.task_date,
        `"${t.task_description.replace(/"/g, '""')}"`,
        t.hours_worked,
        t.completion_status,
        format(parseISO(t.created_at), 'yyyy-MM-dd HH:mm'),
      ]),
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'task-history.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="text-base">Task History</CardTitle>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={v => { setStatusFilter(v ?? 'all'); setPage(1) }}>
            <SelectTrigger className="sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Blocked">Blocked</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Task</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground w-20">Hours</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-muted-foreground">
                    {tasks.length === 0 ? 'No tasks submitted yet' : 'No tasks match your filters'}
                  </td>
                </tr>
              ) : (
                paginated.map(task => (
                  <tr key={task.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium whitespace-nowrap">
                      {format(parseISO(task.task_date), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="truncate">{task.task_description}</p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{task.hours_worked}h</td>
                    <td className="px-4 py-3">
                      <Badge className={cn('text-xs', getStatusColor(task.completion_status))} variant="outline">
                        {task.completion_status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell whitespace-nowrap">
                      {formatDate(task.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-xs text-muted-foreground">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
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
