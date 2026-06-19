'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { CodeSquadLogo } from '@/components/codesquad-logo'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  LayoutDashboard, CheckSquare, MessageSquare, Users,
  LogOut, Settings, BarChart3, Ticket,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
}

const employeeNav: NavItem[] = [
  { href: '/employee/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/employee/tasks', label: 'My Tasks', icon: CheckSquare },
  { href: '/employee/feedback', label: 'Feedback', icon: MessageSquare },
  { href: '/settings', label: 'Settings', icon: Settings },
]

const adminNav: NavItem[] = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/employees', label: 'Employees', icon: Users },
  { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
]

interface SidebarProps {
  role: 'admin' | 'employee'
  onClose?: () => void
}

export function Sidebar({ role, onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const nav = role === 'admin' ? adminNav : employeeNav

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('Signed out successfully')
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <aside className="flex flex-col h-full w-64 bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="flex items-center px-5 py-5 border-b border-sidebar-border">
        <CodeSquadLogo size="sm" className="[&_span]:text-sidebar-foreground [&_.text-muted-foreground]:text-sidebar-foreground/50" />
      </div>

      {/* Role badge */}
      <div className="px-5 py-3">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
          {role === 'admin' ? 'Administration' : 'Employee Portal'}
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                'sidebar-link',
                active ? 'sidebar-link-active' : 'sidebar-link-inactive'
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Sign out */}
      <div className="p-3 border-t border-sidebar-border">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </aside>
  )
}
