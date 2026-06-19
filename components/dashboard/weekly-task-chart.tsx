'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3 } from 'lucide-react'

interface WeeklyTaskChartProps {
  data: Array<{ date: string; hours: number; status: string | null }>
}

const statusColors: Record<string, string> = {
  Completed: '#22c55e',
  'In Progress': '#3b82f6',
  Blocked: '#ef4444',
}

export function WeeklyTaskChart({ data }: WeeklyTaskChartProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          Hours Worked — Last 7 Days
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
            <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(v: any) => [`${v}h`, 'Hours']}
            />
            <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
              {data.map((entry, i) => (
                <Cell key={i} fill={statusColors[entry.status ?? ''] ?? '#3b82f6'} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-3 justify-center">
          {Object.entries(statusColors).map(([label, color]) => (
            <div key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="w-3 h-3 rounded-sm" style={{ background: color }} />
              {label}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
