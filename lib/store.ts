"use client"

import { createContext, useContext } from "react"
import type { Category, Note, Reminder } from "./types"

export type SyncStatus = "idle" | "syncing" | "success" | "error" | "offline"

export interface AppState {
  categories: Category[]
  notes: Note[]
  reminders: Reminder[]
  selectedCategoryId: string | null
  searchQuery: string
  syncStatus: SyncStatus
  lastSyncedAt: Date | null
  syncError: string | null
}

export interface AppActions {
  addCategory: (category: Omit<Category, "id">) => void
  updateCategory: (id: string, updates: Partial<Category>) => void
  deleteCategory: (id: string) => void
  reorderCategories: (activeId: string, overId: string) => void
  addNote: (note: Omit<Note, "id" | "createdAt" | "updatedAt">) => void
  updateNote: (id: string, updates: Partial<Note>) => void
  deleteNote: (id: string) => void
  addReminder: (reminder: Omit<Reminder, "id" | "createdAt">) => void
  updateReminder: (id: string, updates: Partial<Reminder>) => void
  deleteReminder: (id: string) => void
  toggleReminderComplete: (id: string) => void
  setSelectedCategory: (id: string | null) => void
  setSearchQuery: (query: string) => void
  syncWithCloud: () => Promise<void>
  exportData: () => void
  importHistoricalData: () => Promise<void>
}

export type AppContextType = AppState & AppActions

export const AppContext = createContext<AppContextType | null>(null)

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error("useApp must be used within AppProvider")
  }
  return context
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: "1", name: "1° Año", color: "#22c55e" },
  { id: "2", name: "2° Año", color: "#3b82f6" },
  { id: "3", name: "3° Año", color: "#f59e0b" },
  { id: "4", name: "4° Año", color: "#ef4444" },
  { id: "5", name: "5° Año", color: "#8b5cf6" },
  { id: "6", name: "6° Año", color: "#06b6d4" },
  { id: "7", name: "7° Año", color: "#ec4899" },
  { id: "general", name: "General", color: "#6b7280" },
]

export function getInitialState(): AppState {
  if (typeof window === "undefined") {
    return {
      categories: DEFAULT_CATEGORIES,
      notes: [],
      reminders: [],
      selectedCategoryId: null,
      searchQuery: "",
      syncStatus: "idle",
      lastSyncedAt: null,
      syncError: null,
    }
  }

  try {
    const saved = localStorage.getItem("agenda-vice-data")
    if (saved) {
      const data = JSON.parse(saved)
      return {
        categories: data.categories || DEFAULT_CATEGORIES,
        notes: (data.notes || []).map((n: Note) => ({
          ...n,
          createdAt: new Date(n.createdAt),
          updatedAt: new Date(n.updatedAt),
        })),
        reminders: (data.reminders || []).map((r: Reminder) => ({
          ...r,
          dueDate: new Date(r.dueDate),
          createdAt: new Date(r.createdAt),
        })),
        selectedCategoryId: null,
        searchQuery: "",
        syncStatus: "idle",
        lastSyncedAt: data.lastSyncedAt ? new Date(data.lastSyncedAt) : null,
        syncError: null,
      }
    }
  } catch {
    console.error("Error loading data from localStorage")
  }

  return {
    categories: DEFAULT_CATEGORIES,
    notes: [],
    reminders: [],
    selectedCategoryId: null,
    searchQuery: "",
    syncStatus: "idle",
    lastSyncedAt: null,
    syncError: null,
  }
}

export function saveState(state: AppState) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(
      "agenda-vice-data",
      JSON.stringify({
        categories: state.categories,
        notes: state.notes,
        reminders: state.reminders,
        lastSyncedAt: state.lastSyncedAt,
      })
    )
  } catch {
    console.error("Error saving to localStorage")
  }
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}
