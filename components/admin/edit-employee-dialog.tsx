'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types/database'
import { DEPARTMENTS, POSITIONS } from '@/lib/utils'

const schema = z.object({
  full_name: z.string().min(2, 'Name is required'),
  department: z.string().min(1, 'Select a department'),
  position: z.string().min(1, 'Select a position'),
  status: z.enum(['active', 'inactive']),
})
type FormData = z.infer<typeof schema>

interface EditEmployeeDialogProps {
  employee: Profile
  open: boolean
  onClose: () => void
  onSave: (updated: Profile) => void
}

export function EditEmployeeDialog({ employee, open, onClose, onSave }: EditEmployeeDialogProps) {
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: employee.full_name,
      department: employee.department ?? '',
      position: employee.position ?? '',
      status: employee.status,
    },
  })

  async function onSubmit(data: FormData) {
    const supabase = createClient()
    const { data: updated, error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', employee.id)
      .select()
      .single()

    if (error) { toast.error('Failed to update employee'); return }
    toast.success('Employee updated')
    onSave(updated as unknown as Profile)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Employee</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input {...register('full_name')} />
            {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={employee.email} disabled className="bg-muted" />
          </div>

          <div className="space-y-2">
            <Label>Department</Label>
            <Select value={watch('department')} onValueChange={v => setValue('department', v ?? '')}>
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
            {errors.department && <p className="text-xs text-destructive">{errors.department.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Position</Label>
            <Select value={watch('position')} onValueChange={v => setValue('position', v ?? '')}>
              <SelectTrigger>
                <SelectValue placeholder="Select position" />
              </SelectTrigger>
              <SelectContent>
                {POSITIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
            {errors.position && <p className="text-xs text-destructive">{errors.position.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={watch('status')} onValueChange={v => setValue('status', (v ?? 'active') as 'active' | 'inactive')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
