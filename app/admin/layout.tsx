import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { Navbar } from '@/components/layout/navbar'
import { Profile } from '@/types/database'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: raw } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!raw || raw.role !== 'admin') redirect('/employee/dashboard')

  const profile = raw as unknown as Profile

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="hidden lg:flex flex-shrink-0">
        <Sidebar role="admin" />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar profile={profile} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
