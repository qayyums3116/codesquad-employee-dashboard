import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Ticket } from '@/types/database'
import { MyTickets } from '@/components/employee/my-tickets'

export default async function EmployeeTicketsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: raw } = await supabase
    .from('tickets')
    .select('*')
    .eq('assigned_to', user.id)
    .order('created_at', { ascending: false })

  const tickets = (raw ?? []) as Ticket[]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Tickets</h1>
        <p className="text-muted-foreground text-sm mt-1">Tasks assigned to you by your manager</p>
      </div>
      <MyTickets tickets={tickets} />
    </div>
  )
}
