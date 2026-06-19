import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

const colorMap = {
  blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400',
  green: 'bg-green-50 text-green-600 dark:bg-green-950/50 dark:text-green-400',
  purple: 'bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400',
  yellow: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-950/50 dark:text-yellow-400',
  red: 'bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400',
  gray: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
  orange: 'bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400',
}

interface StatCardProps {
  title: string
  value: string | number
  icon: ReactNode
  color?: keyof typeof colorMap
  suffix?: string
  trend?: { value: number; label: string }
  className?: string
}

export function StatCard({ title, value, icon, color = 'blue', suffix, trend, className }: StatCardProps) {
  return (
    <Card className={cn('card-hover', className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">{title}</p>
            <div className="mt-1.5 flex items-baseline gap-1">
              <p className="text-2xl font-bold truncate">{value}</p>
              {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
            </div>
            {trend && (
              <p className={cn(
                'text-xs mt-1 font-medium',
                trend.value > 0 ? 'text-green-600' : trend.value < 0 ? 'text-red-500' : 'text-muted-foreground'
              )}>
                {trend.value > 0 ? '↑' : trend.value < 0 ? '↓' : ''} {Math.abs(trend.value)}% {trend.label}
              </p>
            )}
          </div>
          <div className={cn('p-2.5 rounded-lg flex-shrink-0 ml-3', colorMap[color])}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
