"use client"

import { useMemo } from "react"
import { CalendarDays, FileText, Bell } from "lucide-react"
import { useApp } from "@/lib/store"
import { getReminderStatus, searchFilter, isToday, getDescendantIds } from "@/lib/helpers"
import { ReminderCard } from "@/components/reminder-card"
import { NoteCard } from "@/components/note-card"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"

export function TodayView() {
  const { notes, reminders, categories, selectedCategoryId, searchQuery } = useApp()

  // When a parent category is selected, also include items from sub-categories
  const allowedCategoryIds = useMemo(() => {
    if (!selectedCategoryId) return null
    return new Set(getDescendantIds(selectedCategoryId, categories))
  }, [selectedCategoryId, categories])

  const todayReminders = useMemo(() => {
    return reminders
      .filter((r) => {
        const status = getReminderStatus(r)
        const matchesCategory = !allowedCategoryIds || allowedCategoryIds.has(r.categoryId)
        const matchesSearch = searchFilter(r.text, searchQuery)
        return (status === "today" || status === "overdue") && !r.completed && matchesCategory && matchesSearch
      })
      .sort((a, b) => {
        const statusA = getReminderStatus(a)
        const statusB = getReminderStatus(b)
        if (statusA === "overdue" && statusB !== "overdue") return -1
        if (statusB === "overdue" && statusA !== "overdue") return 1
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      })
  }, [reminders, allowedCategoryIds, searchQuery])

  const recentNotes = useMemo(() => {
    return notes
      .filter((n) => {
        const matchesCategory = !allowedCategoryIds || allowedCategoryIds.has(n.categoryId)
        const matchesSearch =
          searchFilter(n.text, searchQuery) ||
          n.tags.some((t) => searchFilter(t, searchQuery)) ||
          categories.find((c) => c.id === n.categoryId)?.name.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesCategory && matchesSearch
      })
      .slice(0, 10)
  }, [notes, allowedCategoryIds, searchQuery, categories])

  const todayNotes = recentNotes.filter((n) => isToday(n.createdAt))

  const selectedCategory = selectedCategoryId
    ? categories.find((c) => c.id === selectedCategoryId)?.name
    : null

  return (
    <div className="space-y-8">
      <section>
        <div className="flex items-center gap-2 mb-4">
          <CalendarDays className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">
            Hoy {selectedCategory && <span className="text-muted-foreground font-normal">• {selectedCategory}</span>}
          </h2>
        </div>

        {todayReminders.length > 0 ? (
          <div className="space-y-3">
            {todayReminders.map((reminder) => (
              <ReminderCard key={reminder.id} reminder={reminder} />
            ))}
          </div>
        ) : (
          <Empty className="py-8">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Bell className="h-5 w-5" />
              </EmptyMedia>
              <EmptyTitle>Sin recordatorios</EmptyTitle>
              <EmptyDescription>No hay recordatorios pendientes para hoy</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </section>

      <section>
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">
            {todayNotes.length > 0 ? "Notas de hoy" : "Notas recientes"}
          </h2>
        </div>

        {(todayNotes.length > 0 ? todayNotes : recentNotes).length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {(todayNotes.length > 0 ? todayNotes : recentNotes).map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        ) : (
          <Empty className="py-8">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FileText className="h-5 w-5" />
              </EmptyMedia>
              <EmptyTitle>Sin notas</EmptyTitle>
              <EmptyDescription>Usa el campo de arriba para agregar una nota</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </section>
    </div>
  )
}
