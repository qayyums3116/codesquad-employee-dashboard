export type Role = 'admin' | 'employee'
export type Status = 'active' | 'inactive'
export type CompletionStatus = 'Completed' | 'In Progress' | 'Blocked'
export type NotificationType = 'info' | 'success' | 'warning' | 'feedback'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: Role
  department: string | null
  position: string | null
  avatar_url: string | null
  status: Status
  created_at: string
  updated_at: string
}

export interface DailyTask {
  id: string
  employee_id: string
  task_date: string
  task_description: string
  completion_status: CompletionStatus
  hours_worked: number
  admin_notes: string | null
  created_at: string
  updated_at: string
  profiles?: Profile | null
}

export interface Feedback {
  id: string
  employee_id: string
  admin_id: string
  week_start: string
  week_end: string
  feedback_text: string
  performance_rating: number
  created_at: string
  updated_at: string
  employee?: Profile | null
  admin?: Profile | null
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: NotificationType
  is_read: boolean
  created_at: string
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          role: string
          department: string | null
          position: string | null
          avatar_url: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          role?: string
          department?: string | null
          position?: string | null
          avatar_url?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: string
          department?: string | null
          position?: string | null
          avatar_url?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      daily_tasks: {
        Row: {
          id: string
          employee_id: string
          task_date: string
          task_description: string
          completion_status: string
          hours_worked: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          task_date: string
          task_description: string
          completion_status?: string
          hours_worked?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          task_date?: string
          task_description?: string
          completion_status?: string
          hours_worked?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'daily_tasks_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      feedback: {
        Row: {
          id: string
          employee_id: string
          admin_id: string
          week_start: string
          week_end: string
          feedback_text: string
          performance_rating: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          admin_id: string
          week_start: string
          week_end: string
          feedback_text: string
          performance_rating: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          admin_id?: string
          week_start?: string
          week_end?: string
          feedback_text?: string
          performance_rating?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'feedback_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'feedback_admin_id_fkey'
            columns: ['admin_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type?: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: string
          is_read?: boolean
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
