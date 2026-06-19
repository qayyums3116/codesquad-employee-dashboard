import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, startOfWeek, endOfWeek, parseISO } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, fmt = 'MMM dd, yyyy') {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, fmt)
}

export function getWeekRange(date: Date = new Date()) {
  const start = startOfWeek(date, { weekStartsOn: 1 })
  const end = endOfWeek(date, { weekStartsOn: 1 })
  return { start, end }
}

export function formatWeekRange(start: string, end: string) {
  return `${formatDate(start, 'MMM dd')} – ${formatDate(end, 'MMM dd, yyyy')}`
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function getStatusColor(status: string) {
  switch (status) {
    case 'Completed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    case 'In Progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    case 'Blocked': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    case 'inactive': return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
    default: return 'bg-gray-100 text-gray-700'
  }
}

export function getRatingColor(rating: number) {
  if (rating >= 4) return 'text-green-600'
  if (rating >= 3) return 'text-yellow-500'
  return 'text-red-500'
}

export const DEPARTMENTS = [
  'Engineering', 'Design', 'Product', 'Marketing',
  'QA', 'DevOps', 'Sales', 'HR', 'Management', 'Other'
]

export const POSITIONS = [
  'Software Engineer', 'Senior Developer', 'Full Stack Developer',
  'Frontend Developer', 'Backend Developer', 'Mobile Developer',
  'DevOps Engineer', 'QA Engineer', 'UI/UX Designer', 'Product Manager',
  'Marketing Analyst', 'System Administrator', 'Team Lead', 'Other'
]
