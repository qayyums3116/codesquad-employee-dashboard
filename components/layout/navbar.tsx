'use client'

import { useState, useEffect } from 'react'
import { Menu, Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { UserMenu } from '@/components/layout/user-menu'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Sidebar } from '@/components/layout/sidebar'
import { Profile } from '@/types/database'

interface NavbarProps {
  profile: Profile
}

export function Navbar({ profile }: NavbarProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => setMounted(true), [])

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark')
    else if (theme === 'dark') setTheme('system')
    else setTheme('light')
  }

  const ThemeIcon = !mounted ? Monitor : theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor

  return (
    <header className="h-14 border-b bg-background/95 backdrop-blur-sm flex items-center px-4 gap-3 sticky top-0 z-40">
      {/* Mobile menu trigger */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger
          className="lg:hidden inline-flex items-center justify-center h-8 w-8 rounded-md border border-transparent hover:bg-muted transition-colors"
        >
          <Menu className="h-5 w-5" />
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <Sidebar role={profile.role} onClose={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex-1" />

      <div className="flex items-center gap-1.5">
        <Button variant="ghost" size="icon" onClick={cycleTheme} title="Toggle theme">
          <ThemeIcon className="h-4 w-4" />
        </Button>
        <NotificationBell userId={profile.id} />
        <UserMenu profile={profile} />
      </div>
    </header>
  )
}
