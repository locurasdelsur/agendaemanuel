"use client"

import { useState, useEffect, useCallback, useRef, type ReactNode } from "react"
import { AppContext, getInitialState, saveState, generateId, type AppState, type SyncStatus } from "@/lib/store"
import type { Category, Note, Reminder } from "@/lib/types"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => getInitialState())
  const [mounted, setMounted] = useState(false)
  const { toast } = useToast()
  const syncFunctionRef = useRef<(showToast?: boolean) => Promise<void>>(() => Promise.resolve())
  // Track IDs already pushed to cloud to prevent double-sends (React StrictMode, tab changes, etc.)
  const pushedToCloudRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    setState(getInitialState())
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      saveState(state)
    }
  }, [state, mounted])

  // Sync with Google Sheets
  const syncWithCloud = useCallback(async (showToast = true) => {
    setState((prev) => ({ ...prev, syncStatus: "syncing" as SyncStatus, syncError: null }))

    try {
      // Fetch all data from the cloud
      const [cloudNotes, cloudReminders, cloudCategories] = await Promise.all([
        api.getNotes(),
        api.getReminders(),
        api.getCategories(),
      ])

      // Build category list from cloud first (source of truth for IDs)
      const cloudCategoryList: Category[] = (Array.isArray(cloudCategories) ? cloudCategories : []).map((c) => ({
        id: c.id,
        name: c.name,
        color: c.color,
        parentId: c.parentId, // Come from Google Apps Script
      }))

      // Merge cloud categories with local ones
      // Use a Map to avoid duplicates: cloud categories take precedence by name
      const categoryMap = new Map<string, Category>()
      // Add local categories first
      for (const lc of state.categories) {
        categoryMap.set(lc.name.toLowerCase().trim(), lc)
      }
      // Overwrite with cloud categories (these have correct cloud IDs)
      for (const cc of cloudCategoryList) {
        categoryMap.set(cc.name.toLowerCase().trim(), cc)
      }
      const categories = Array.from(categoryMap.values())

      // Helper: resolve a category name to an ID, falling back to "general"
      const resolveId = (categoryName: string): string => {
        const lower = (categoryName || "").toLowerCase().trim()
        // Try exact match first
        const exact = categories.find((c) => c.name.toLowerCase().trim() === lower)
        if (exact) return exact.id
        // Try partial match
        const partial = categories.find((c) => c.name.toLowerCase().includes(lower) || lower.includes(c.name.toLowerCase()))
        if (partial) return partial.id
        // Fall back to the "general" category id (by name)
        return categories.find((c) => c.name.toLowerCase() === "general")?.id ?? "general"
      }

      // Transform cloud data to local format
      const cloudNoteIds = new Set<string>()
      const notes: Note[] = (Array.isArray(cloudNotes) ? cloudNotes : []).map((n) => {
        cloudNoteIds.add(n.id)
        return {
          id: n.id,
          text: n.content || n.text || "",
          categoryId: resolveId(n.category || n.categoryName || ""),
          tags: n.tags || [],
          createdAt: new Date(n.createdAt),
          updatedAt: new Date(n.updatedAt),
        }
      })

      const cloudReminderIds = new Set<string>()
      const reminders: Reminder[] = (Array.isArray(cloudReminders) ? cloudReminders : []).map((r) => {
        cloudReminderIds.add(r.id)
        // date comes as full ISO string from GAS (e.g. "2026-04-28T03:00:00.000Z")
        const dueDateParsed = new Date(r.date || r.dueDate || "")
        const dueDateFinal = isNaN(dueDateParsed.getTime()) ? new Date() : dueDateParsed
        return {
          id: r.id,
          text: r.title || r.text || "",
          categoryId: resolveId(r.category || r.categoryName || ""),
          dueDate: dueDateFinal,
          dueTime: r.time || r.dueTime,
          completed: r.completed,
          createdAt: new Date(r.createdAt),
        }
      })

      setState((prev) => {
        // Keep locally-created notes/reminders that aren't in the cloud yet
        // BUT exclude any that have already been pushed (their cloud version is now in cloudNotes)
        const localOnlyNotes = prev.notes
          .filter((n) => {
            // If already in cloud, skip (cloud version takes precedence)
            if (cloudNoteIds.has(n.id)) return false
            // If this local note was pushed to cloud, its cloud version is now in cloudNotes
            // Match by content only (category names may differ between local subcategory and cloud)
            if (pushedToCloudRef.current.has(n.id)) {
              const hasDuplicateInCloud = notes.some((cn) => cn.text === n.text)
              if (hasDuplicateInCloud) return false
            }
            return true
          })
          .map((n) => {
            const oldCat = prev.categories.find((c) => c.id === n.categoryId)
            return { ...n, categoryId: oldCat ? resolveId(oldCat.name) : resolveId("") }
          })

        const localOnlyReminders = prev.reminders
          .filter((r) => {
            if (cloudReminderIds.has(r.id)) return false
            if (pushedToCloudRef.current.has(r.id)) {
              // Match by text only (category names may differ)
              const hasDuplicateInCloud = reminders.some((cr) => cr.text === r.text)
              if (hasDuplicateInCloud) return false
            }
            return true
          })
          .map((r) => {
            const oldCat = prev.categories.find((c) => c.id === r.categoryId)
            return { ...r, categoryId: oldCat ? resolveId(oldCat.name) : resolveId("") }
          })

        // Keep sub-categories (parentId set) from prev since GAS doesn't know about them
        const subCategories = prev.categories.filter((c) => c.parentId)

        return {
          ...prev,
          notes: [...notes, ...localOnlyNotes],
          reminders: [...reminders, ...localOnlyReminders],
          categories: categories.length > 0 ? [...categories, ...subCategories] : prev.categories,
          syncStatus: "success" as SyncStatus,
          lastSyncedAt: new Date(),
          syncError: null,
        }
      })

      if (showToast) {
        toast({
          title: "Sincronizado",
          description: "Datos actualizados desde Google Sheets",
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error de conexion"
      setState((prev) => ({
        ...prev,
        syncStatus: "error" as SyncStatus,
        syncError: errorMessage,
      }))

      if (showToast) {
        toast({
          title: "Error de sincronizacion",
          description: "No se pudo conectar con Google Sheets. Los datos se guardan localmente.",
          variant: "destructive",
        })
      }
    }
  }, [toast])

  // Update ref with the actual syncWithCloud function
  useEffect(() => {
    syncFunctionRef.current = syncWithCloud
  }, [syncWithCloud])

  // Auto-sync on mount and set up periodic sync every 30 seconds
  useEffect(() => {
    if (!mounted) return
    
    // Initial sync (silent, no toast)
    syncWithCloud(false)
    
    // Periodic sync every 30 seconds to keep data fresh
    const syncInterval = setInterval(() => {
      syncWithCloud(false)
    }, 30000)
    
    return () => clearInterval(syncInterval)
  }, [mounted, syncWithCloud])

  // Push single note to cloud — guarded by ref so it only fires once per ID even in StrictMode
  const pushNoteToCloud = useCallback(async (localId: string, note: Note, categoryName: string) => {
    if (pushedToCloudRef.current.has(localId)) return
    pushedToCloudRef.current.add(localId)
    try {
      const result = await api.addNote({
        content: note.text,
        category: categoryName,
        tags: note.tags,
      })
      // Replace the temporary local ID with the real cloud ID to prevent duplicates on next sync
      const cloudId = result?.data?.note?.id ?? result?.id
      if (cloudId && cloudId !== localId) {
        setState((prev) => ({
          ...prev,
          notes: prev.notes.map((n) => n.id === localId ? { ...n, id: cloudId } : n),
        }))
      }
    } catch {
      // Remove from guard on failure so a retry is possible
      pushedToCloudRef.current.delete(localId)
    }
  }, [])

  const pushReminderToCloud = useCallback(async (localId: string, reminder: Reminder, categoryName: string) => {
    if (pushedToCloudRef.current.has(localId)) return
    pushedToCloudRef.current.add(localId)
    try {
      const dateStr = reminder.dueDate.toISOString().split("T")[0]
      const timeStr = reminder.dueDate.toTimeString().slice(0, 5)
      const result = await api.addReminder({
        title: reminder.text,
        category: categoryName,
        date: dateStr,
        time: timeStr,
      })
      // Replace the temporary local ID with the real cloud ID to prevent duplicates on next sync
      const cloudId = result?.data?.reminder?.id ?? result?.id
      if (cloudId && cloudId !== localId) {
        setState((prev) => ({
          ...prev,
          reminders: prev.reminders.map((r) => r.id === localId ? { ...r, id: cloudId } : r),
        }))
      }
    } catch {
      // Remove from guard on failure so a retry is possible
      pushedToCloudRef.current.delete(localId)
    }
  }, [])

  const addCategory = useCallback((category: Omit<Category, "id">) => {
    const newCategory = { ...category, id: generateId() }
    setState((prev) => ({
      ...prev,
      categories: [...prev.categories, newCategory],
    }))
    // Push to cloud
    api.addCategory({ name: category.name, color: category.color }).catch(() => {})
  }, [])

  const updateCategory = useCallback((id: string, updates: Partial<Category>) => {
    setState((prev) => {
      const category = prev.categories.find((c) => c.id === id)
      if (category) {
        const updated = { ...category, ...updates }
        api.updateCategory({ id, name: updated.name, color: updated.color }).catch(() => {})
      }
      return {
        ...prev,
        categories: prev.categories.map((c) => (c.id === id ? { ...c, ...updates } : c)),
      }
    })
  }, [])

  const deleteCategory = useCallback((id: string) => {
    api.deleteCategory(id).catch(() => {})
    setState((prev) => {
      // Also remove all direct children (sub-categories)
      const childIds = prev.categories
        .filter((c) => c.parentId === id)
        .map((c) => c.id)
      const removedIds = [id, ...childIds]
      removedIds.forEach((rid) => {
        if (rid !== id) api.deleteCategory(rid).catch(() => {})
      })
      return {
        ...prev,
        categories: prev.categories.filter((c) => !removedIds.includes(c.id)),
        notes: prev.notes.filter((n) => !removedIds.includes(n.categoryId)),
        reminders: prev.reminders.filter((r) => !removedIds.includes(r.categoryId)),
        selectedCategoryId: removedIds.includes(prev.selectedCategoryId ?? "")
          ? null
          : prev.selectedCategoryId,
      }
    })
  }, [])

  const reorderCategories = useCallback((activeId: string, overId: string) => {
    setState((prev) => {
      const oldIndex = prev.categories.findIndex((c) => c.id === activeId)
      const newIndex = prev.categories.findIndex((c) => c.id === overId)
      
      if (oldIndex === -1 || newIndex === -1) return prev
      
      const newCategories = [...prev.categories]
      const [removed] = newCategories.splice(oldIndex, 1)
      newCategories.splice(newIndex, 0, removed)
      
      return {
        ...prev,
        categories: newCategories,
      }
    })
  }, [])

  const addNote = useCallback(
    (note: Omit<Note, "id" | "createdAt" | "updatedAt">) => {
      const now = new Date()
      const newNote: Note = { ...note, id: generateId(), createdAt: now, updatedAt: now }

      setState((prev) => {
        const category = prev.categories.find((c) => c.id === note.categoryId)
        if (category) {
          // Guard inside pushNoteToCloud ensures this only fires once even if setState runs twice
          pushNoteToCloud(newNote.id, newNote, category.name)
        }
        return { ...prev, notes: [newNote, ...prev.notes] }
      })
    },
    [pushNoteToCloud]
  )

  const updateNote = useCallback((id: string, updates: Partial<Note>) => {
    setState((prev) => {
      const note = prev.notes.find((n) => n.id === id)
      if (note) {
        const updated = { ...note, ...updates, updatedAt: new Date() }
        const category = prev.categories.find((c) => c.id === updated.categoryId)
        if (category) {
          api
            .updateNote({
              id,
              content: updated.text,
              category: category.name,
              tags: updated.tags,
            })
            .catch(() => {})
        }
      }
      return {
        ...prev,
        notes: prev.notes.map((n) => (n.id === id ? { ...n, ...updates, updatedAt: new Date() } : n)),
      }
    })
  }, [])

  const deleteNote = useCallback((id: string) => {
    api.deleteNote(id).catch(() => {})
    setState((prev) => ({
      ...prev,
      notes: prev.notes.filter((n) => n.id !== id),
    }))
  }, [])

  const addReminder = useCallback(
    (reminder: Omit<Reminder, "id" | "createdAt">) => {
      const newReminder: Reminder = { ...reminder, id: generateId(), createdAt: new Date() }

      setState((prev) => {
        const category = prev.categories.find((c) => c.id === reminder.categoryId)
        if (category) {
          // Guard inside pushReminderToCloud ensures this only fires once even if setState runs twice
          pushReminderToCloud(newReminder.id, newReminder, category.name)
        }
        return { ...prev, reminders: [newReminder, ...prev.reminders] }
      })
    },
    [pushReminderToCloud]
  )

  const updateReminder = useCallback((id: string, updates: Partial<Reminder>) => {
    setState((prev) => {
      const reminder = prev.reminders.find((r) => r.id === id)
      if (reminder) {
        const updated = { ...reminder, ...updates }
        const category = prev.categories.find((c) => c.id === updated.categoryId)
        if (category) {
          api
            .updateReminder({
              id,
              title: updated.text,
              category: category.name,
              date: updated.dueDate.toISOString().split("T")[0],
              time: updated.dueDate.toTimeString().slice(0, 5),
            })
            .catch(() => {})
        }
      }
      return {
        ...prev,
        reminders: prev.reminders.map((r) => (r.id === id ? { ...r, ...updates } : r)),
      }
    })
  }, [])

  const deleteReminder = useCallback((id: string) => {
    api.deleteReminder(id).catch(() => {})
    setState((prev) => ({
      ...prev,
      reminders: prev.reminders.filter((r) => r.id !== id),
    }))
  }, [])

  const toggleReminderComplete = useCallback((id: string) => {
    api.completeReminder(id).catch(() => {})
    setState((prev) => ({
      ...prev,
      reminders: prev.reminders.map((r) => (r.id === id ? { ...r, completed: !r.completed } : r)),
    }))
  }, [])

  const setSelectedCategory = useCallback((id: string | null) => {
    setState((prev) => ({ ...prev, selectedCategoryId: id }))
  }, [])

  const setSearchQuery = useCallback((query: string) => {
    setState((prev) => ({ ...prev, searchQuery: query }))
  }, [])

  const importHistoricalData = useCallback(async () => {
    try {
      const res = await fetch("/api/seed-historical")
      if (!res.ok) throw new Error("No se pudo obtener los datos históricos")
      const data = await res.json()

      const historicalCategories: Category[] = (data.categories || []).map((c: Category) => ({
        id: c.id,
        name: c.name,
        color: c.color,
      }))

      const historicalNotes: Note[] = (data.notes || []).map((n: Note) => ({
        id: n.id,
        text: n.text,
        categoryId: n.categoryId,
        tags: n.tags || [],
        createdAt: new Date(n.createdAt),
        updatedAt: new Date(n.updatedAt),
      }))

      // Push new historical notes to GAS (so they appear in Google Sheets)
      let pushed = 0
      setState((prev) => {
        const existingIds = new Set(prev.notes.map((n) => n.id))
        const newNotes = historicalNotes.filter((n) => !existingIds.has(n.id))

        // Fire-and-forget push to GAS for each new note
        newNotes.forEach((n) => {
          const catName =
            (historicalCategories.find((c) => c.id === n.categoryId) ??
             prev.categories.find((c) => c.id === n.categoryId))?.name || "General"
          api.addNote({
            content: n.text,
            category: catName,
            tags: n.tags,
          }).catch(() => {})
          pushed++
        })

        const subCats = prev.categories.filter((c) => c.parentId)
        const mergedCategories = historicalCategories.length > 0
          ? [...historicalCategories, ...subCats]
          : prev.categories

        return {
          ...prev,
          notes: [...prev.notes, ...newNotes],
          categories: mergedCategories,
        }
      })

      toast({
        title: "Datos históricos importados",
        description: `Se importaron ${historicalNotes.length} registros y se enviaron al Google Script`,
      })
    } catch (error) {
      toast({
        title: "Error al importar",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      })
    }
  }, [toast])

  const exportData = useCallback(() => {
    const data = {
      notes: state.notes.map((n) => ({
        id: n.id,
        content: n.text,
        category: state.categories.find((c) => c.id === n.categoryId)?.name || "General",
        tags: n.tags,
        createdAt: n.createdAt.toISOString(),
        updatedAt: n.updatedAt.toISOString(),
      })),
      reminders: state.reminders.map((r) => ({
        id: r.id,
        title: r.text,
        category: state.categories.find((c) => c.id === r.categoryId)?.name || "General",
        date: r.dueDate.toISOString().split("T")[0],
        time: r.dueDate.toTimeString().slice(0, 5),
        completed: r.completed,
        createdAt: r.createdAt.toISOString(),
      })),
      categories: state.categories.map((c) => ({
        id: c.id,
        name: c.name,
        color: c.color,
        isSystem: false,
      })),
      exportedAt: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `agenda-vicedireccion-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Datos exportados",
      description: "El archivo JSON se descargo correctamente",
    })
  }, [state.notes, state.reminders, state.categories, toast])

  if (!mounted) {
    return null
  }

  return (
    <AppContext.Provider
      value={{
        ...state,
        addCategory,
        updateCategory,
        deleteCategory,
        reorderCategories,
        addNote,
        updateNote,
        deleteNote,
        addReminder,
        updateReminder,
        deleteReminder,
        toggleReminderComplete,
        setSelectedCategory,
        setSearchQuery,
        syncWithCloud,
        exportData,
        importHistoricalData,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}
