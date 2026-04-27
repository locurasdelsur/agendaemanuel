// All requests go through our Next.js proxy to avoid CORS issues with Google Apps Script
const PROXY_URL = "/api/proxy"

async function fetchApiGet<T>(action: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(PROXY_URL, window.location.origin)
  url.searchParams.append("action", action)
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value)
  })

  const response = await fetch(url.toString(), { method: "GET" })

  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}`)
  }

  return response.json()
}

async function fetchApiPost<T>(action: string, data: unknown): Promise<T> {
  const url = new URL(PROXY_URL, window.location.origin)
  url.searchParams.append("action", action)

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}`)
  }

  return response.json()
}

export interface ApiNote {
  id: string
  content: string
  category: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface ApiReminder {
  id: string
  title: string
  category: string
  date: string
  time: string
  completed: boolean
  createdAt: string
  updatedAt: string
  calendarEventId?: string
}

export interface ApiCategory {
  id: string
  name: string
  color: string
  isSystem: boolean
}

export interface ApiStats {
  totalNotes: number
  totalReminders: number
  pendingReminders: number
  completedReminders: number
  overdueReminders: number
  todayReminders: number
  totalCategories: number
  notesByCategory: Record<string, number>
  remindersByCategory: Record<string, number>
}

export const api = {
  // Notes
  async getNotes(category?: string): Promise<ApiNote[]> {
    const params: Record<string, string> = {}
    if (category) params.category = category
    return fetchApiGet("getNotes", params)
  },

  async addNote(note: { content: string; category: string; tags: string[] }): Promise<{ success: boolean; data?: { note: ApiNote }; error?: string }> {
    return fetchApiPost("addNote", note)
  },

  async updateNote(note: { id: string; content: string; category: string; tags: string[] }): Promise<{ success: boolean; error?: string }> {
    return fetchApiPost("updateNote", note)
  },

  async deleteNote(id: string): Promise<{ success: boolean; error?: string }> {
    return fetchApiGet("deleteNote", { id })
  },

  // Reminders
  async getReminders(category?: string, status?: "pending" | "completed"): Promise<ApiReminder[]> {
    const params: Record<string, string> = {}
    if (category) params.category = category
    if (status) params.status = status
    return fetchApiGet("getReminders", params)
  },

  async addReminder(reminder: { title: string; category: string; date: string; time?: string }): Promise<{ success: boolean; data?: { reminder: ApiReminder }; error?: string }> {
    return fetchApiPost("addReminder", reminder)
  },

  async updateReminder(reminder: { id: string; title: string; category: string; date: string; time?: string }): Promise<{ success: boolean; error?: string }> {
    return fetchApiPost("updateReminder", reminder)
  },

  async deleteReminder(id: string): Promise<{ success: boolean; error?: string }> {
    return fetchApiGet("deleteReminder", { id })
  },

  async completeReminder(id: string): Promise<{ success: boolean; error?: string }> {
    return fetchApiGet("completeReminder", { id })
  },

  // Categories
  async getCategories(): Promise<ApiCategory[]> {
    return fetchApiGet("getCategories")
  },

  async addCategory(category: { name: string; color: string }): Promise<{ success: boolean; data?: { category: ApiCategory }; error?: string }> {
    return fetchApiPost("addCategory", category)
  },

  async updateCategory(category: { id: string; name: string; color: string }): Promise<{ success: boolean; error?: string }> {
    return fetchApiPost("updateCategory", category)
  },

  async deleteCategory(id: string): Promise<{ success: boolean; error?: string }> {
    return fetchApiGet("deleteCategory", { id })
  },

  // Stats
  async getStats(): Promise<ApiStats> {
    return fetchApiGet("getStats")
  },

  // Export all
  async exportAll(): Promise<{
    notes: ApiNote[]
    reminders: ApiReminder[]
    categories: ApiCategory[]
    exportedAt: string
  }> {
    return fetchApiGet("exportAll")
  },
}
