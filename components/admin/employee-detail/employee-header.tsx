import Link from 'next/link'
import { ArrowLeft, Calendar, Building, Briefcase } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Profile } from '@/types/database'
import { getInitials, getStatusColor, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface EmployeeHeaderProps {
  employee: Profile
  taskCount: number
  totalHours: number
}

export function EmployeeHeader({ employee, taskCount, totalHours }: EmployeeHeaderProps) {
  return (
    <div>
      <Link
        href="/admin/employees"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Employees
      </Link>
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            <Avatar className="h-16 w-16 flex-shrink-0">
              <AvatarImage src={employee.avatar_url ?? undefined} />
              <AvatarFallback className="text-xl font-semibold bg-primary text-primary-foreground">
                {getInitials(employee.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-1">
                <h1 className="text-xl font-bold">{employee.full_name}</h1>
                <Badge variant="outline" className={cn('text-xs', getStatusColor(employee.status))}>
                  {employee.status}
                </Badge>
              </div>
              <p className="text-muted-foreground text-sm mb-4">{employee.email}</p>
              <div className="flex flex-wrap gap-5 text-sm text-muted-foreground">
                {employee.department && (
                  <span className="flex items-center gap-1.5">
                    <Building className="h-3.5 w-3.5" /> {employee.department}
                  </span>
                )}
                {employee.position && (
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5" /> {employee.position}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" /> Joined {formatDate(employee.created_at)}
                </span>
              </div>
            </div>
            <div className="flex gap-6 text-center flex-shrink-0">
              <div>
                <p className="text-2xl font-bold text-primary">{taskCount}</p>
                <p className="text-xs text-muted-foreground">Tasks</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">{totalHours.toFixed(0)}h</p>
                <p className="text-xs text-muted-foreground">Total Hours</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
