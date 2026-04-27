export interface Category {
  id: string
  name: string
  color: string
  parentId?: string
}

export interface Note {
  id: string
  text: string
  categoryId: string
  tags: string[]
  attachmentUrl?: string
  createdAt: Date
  updatedAt: Date
}

export interface Reminder {
  id: string
  text: string
  categoryId: string
  dueDate: Date
  dueTime?: string
  completed: boolean
  createdAt: Date
}

export type ReminderStatus = 'overdue' | 'today' | 'upcoming' | 'completed'

export interface DashboardStats {
  totalNotes: number
  pendingReminders: number
  overdueReminders: number
  completedReminders: number
  notesByCategory: Record<string, number>
}
