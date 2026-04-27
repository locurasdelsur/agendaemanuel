import type { Category, Reminder, ReminderStatus } from "./types"

/**
 * Returns the given category ID plus all descendant IDs (children, grandchildren, etc.)
 */
export function getDescendantIds(categoryId: string, categories: Category[]): string[] {
  const result: string[] = [categoryId]
  const children = categories.filter((c) => c.parentId === categoryId)
  for (const child of children) {
    result.push(...getDescendantIds(child.id, categories))
  }
  return result
}

export function getReminderStatus(reminder: Reminder): ReminderStatus {
  if (reminder.completed) return "completed"

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dueDate = new Date(reminder.dueDate)
  const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate())

  if (dueDateOnly < today) return "overdue"
  if (dueDateOnly.getTime() === today.getTime()) return "today"
  return "upcoming"
}

export function getStatusColor(status: ReminderStatus): string {
  switch (status) {
    case "overdue":
      return "bg-red-100 text-red-800 border-red-200"
    case "today":
      return "bg-yellow-100 text-yellow-800 border-yellow-200"
    case "completed":
      return "bg-green-100 text-green-800 border-green-200"
    default:
      return "bg-blue-100 text-blue-800 border-blue-200"
  }
}

export function getStatusLabel(status: ReminderStatus): string {
  switch (status) {
    case "overdue":
      return "Vencido"
    case "today":
      return "Hoy"
    case "completed":
      return "Completado"
    default:
      return "Pendiente"
  }
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date))
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(":")
  return `${hours}:${minutes}`
}

export function isToday(date: Date): boolean {
  const today = new Date()
  const d = new Date(date)
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  )
}

export function searchFilter(text: string, query: string): boolean {
  if (!query.trim()) return true
  return text.toLowerCase().includes(query.toLowerCase())
}
