'use client'

import { useState, useMemo } from 'react'
import { Search, Edit, Trash2, UserCheck, UserX, MoreHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader,
  DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import { deleteEmployee as deleteEmployeeAction } from '@/app/admin/employees/actions'
import { Profile } from '@/types/database'
import { getInitials, getStatusColor, formatDate, DEPARTMENTS } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { EditEmployeeDialog } from '@/components/admin/edit-employee-dialog'

const PAGE_SIZE = 10

interface EmployeeTableProps {
  employees: Profile[]
}

export function EmployeeTable({ employees: initial }: EmployeeTableProps) {
  const router = useRouter()
  const [employees, setEmployees] = useState(initial)
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [editTarget, setEditTarget] = useState<Profile | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null)
  const [deleting, setDeleting] = useState(false)

  const filtered = useMemo(() => employees.filter(e => {
    const q = search.toLowerCase()
    const matchSearch = e.full_name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q)
    const matchDept = deptFilter === 'all' || e.department === deptFilter
    const matchStatus = statusFilter === 'all' || e.status === statusFilter
    return matchSearch && matchDept && matchStatus
  }), [employees, search, deptFilter, statusFilter])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  async function toggleStatus(emp: Profile) {
    const supabase = createClient()
    const newStatus = emp.status === 'active' ? 'inactive' : 'active'
    const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', emp.id)
    if (error) { toast.error('Failed to update status'); return }
    setEmployees(prev => prev.map(e => e.id === emp.id ? { ...e, status: newStatus } : e))
    toast.success(`${emp.full_name} marked as ${newStatus}`)
  }

  async function deleteEmployee() {
    if (!deleteTarget) return
    setDeleting(true)
    const result = await deleteEmployeeAction(deleteTarget.id)
    if (result.error) { toast.error('Failed to delete employee'); setDeleting(false); return }
    setEmployees(prev => prev.filter(e => e.id !== deleteTarget.id))
    toast.success(`${deleteTarget.full_name} deleted`)
    setDeleteTarget(null)
    setDeleting(false)
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employees…"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={v => { setStatusFilter(v ?? 'all'); setPage(1) }}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Employee</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden xl:table-cell">Joined</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-12 text-muted-foreground">
                      {employees.length === 0 ? 'No employees yet' : 'No employees match your filters'}
                    </td>
                  </tr>
                ) : paginated.map(emp => (
                  <tr key={emp.id} className="hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => router.push(`/admin/employees/${emp.id}`)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={emp.avatar_url ?? undefined} />
                          <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                            {getInitials(emp.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{emp.full_name}</p>
                          <p className="text-xs text-muted-foreground truncate">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={cn('text-xs', getStatusColor(emp.status))}>
                        {emp.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden xl:table-cell">{formatDate(emp.created_at)}</td>
                    <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-muted transition-colors">
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditTarget(emp)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleStatus(emp)}>
                            {emp.status === 'active'
                              ? <><UserX className="mr-2 h-4 w-4" /> Disable</>
                              : <><UserCheck className="mr-2 h-4 w-4" /> Enable</>
                            }
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget(emp)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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

      {/* Edit dialog */}
      {editTarget && (
        <EditEmployeeDialog
          employee={editTarget}
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
          onSave={updated => {
            setEmployees(prev => prev.map(e => e.id === updated.id ? updated : e))
            setEditTarget(null)
          }}
        />
      )}

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Employee</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete <strong>{deleteTarget?.full_name}</strong>? This will remove all their tasks and data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={deleteEmployee} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
