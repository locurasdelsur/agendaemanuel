"use client"

import { useMemo, useState } from "react"
import { Folder, FileText, Bell } from "lucide-react"
import { useApp } from "@/lib/store"
import { searchFilter, getReminderStatus } from "@/lib/helpers"
import { NoteCard } from "@/components/note-card"
import { ReminderCard } from "@/components/reminder-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Empty, EmptyHeader, EmptyMedia, EmptyDescription } from "@/components/ui/empty"
import { cn } from "@/lib/utils"

export function CoursesView() {
  const { notes, reminders, categories, searchQuery } = useApp()
  const [activeTab, setActiveTab] = useState(categories[0]?.id || "")

  const filteredData = useMemo(() => {
    const data: Record<string, { notes: typeof notes; reminders: typeof reminders }> = {}

    categories.forEach((cat) => {
      data[cat.id] = {
        notes: notes.filter(
          (n) =>
            n.categoryId === cat.id &&
            (searchFilter(n.text, searchQuery) || n.tags.some((t) => searchFilter(t, searchQuery)))
        ),
        reminders: reminders.filter(
          (r) => r.categoryId === cat.id && searchFilter(r.text, searchQuery) && !r.completed
        ),
      }
    })

    return data
  }, [notes, reminders, categories, searchQuery])

  const getCounts = (categoryId: string) => {
    const data = filteredData[categoryId]
    if (!data) return { notes: 0, pendingReminders: 0 }
    return {
      notes: data.notes.length,
      pendingReminders: data.reminders.filter((r) => {
        const status = getReminderStatus(r)
        return status !== "completed"
      }).length,
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Folder className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Cursos y Categorías</h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4 flex-wrap h-auto gap-1 bg-transparent p-0">
          {categories.map((cat) => {
            const counts = getCounts(cat.id)
            const total = counts.notes + counts.pendingReminders
            return (
              <TabsTrigger
                key={cat.id}
                value={cat.id}
                className={cn(
                  "data-[state=active]:shadow-sm rounded-lg px-3 py-1.5 text-sm",
                  "data-[state=active]:bg-card data-[state=active]:border"
                )}
              >
                <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: cat.color }} />
                {cat.name}
                {total > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 min-w-5 text-xs">
                    {total}
                  </Badge>
                )}
              </TabsTrigger>
            )
          })}
        </TabsList>

        {categories.map((cat) => {
          const data = filteredData[cat.id]
          return (
            <TabsContent key={cat.id} value={cat.id} className="space-y-6 mt-0">
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-medium text-sm">Recordatorios Pendientes</h3>
                </div>
                {data?.reminders.length > 0 ? (
                  <div className="space-y-2">
                    {data.reminders.map((r) => (
                      <ReminderCard key={r.id} reminder={r} />
                    ))}
                  </div>
                ) : (
                  <Empty className="py-6">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <Bell className="h-5 w-5" />
                      </EmptyMedia>
                      <EmptyDescription>Sin recordatorios pendientes</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                )}
              </section>

              <section>
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-medium text-sm">Notas</h3>
                </div>
                {data?.notes.length > 0 ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    {data.notes.map((n) => (
                      <NoteCard key={n.id} note={n} />
                    ))}
                  </div>
                ) : (
                  <Empty className="py-6">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <FileText className="h-5 w-5" />
                      </EmptyMedia>
                      <EmptyDescription>Sin notas en esta categoría</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                )}
              </section>
            </TabsContent>
          )
        })}
      </Tabs>
    </div>
  )
}
