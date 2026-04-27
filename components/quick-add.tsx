"use client"

import { useState } from "react"
import { Plus, Bell, FileText, Calendar } from "lucide-react"
import { useApp } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { formatDate } from "@/lib/helpers"

export function QuickAdd() {
  const { categories, selectedCategoryId, addNote, addReminder } = useApp()
  const [text, setText] = useState("")
  const [categoryId, setCategoryId] = useState(selectedCategoryId || categories[0]?.id || "")
  const [isReminder, setIsReminder] = useState(false)
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined)
  const [dueTime, setDueTime] = useState("")
  const [isExpanded, setIsExpanded] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() || !categoryId) return

    if (isReminder && dueDate) {
      addReminder({
        text: text.trim(),
        categoryId,
        dueDate,
        dueTime: dueTime || undefined,
        completed: false,
      })
    } else {
      const tags = text.match(/#\w+/g)?.map((t) => t.slice(1)) || []
      addNote({
        text: text.trim(),
        categoryId,
        tags,
        attachmentUrl: undefined,
      })
    }

    setText("")
    setIsReminder(false)
    setDueDate(undefined)
    setDueTime("")
    setIsExpanded(false)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card border rounded-xl p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Agregar nota rápida... (usa #etiquetas)"
            className="pr-10"
            onFocus={() => setIsExpanded(true)}
          />
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {isReminder ? <Bell className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
          </button>
        </div>
        <Button type="submit" size="icon" disabled={!text.trim()}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div
        className={cn(
          "grid transition-all duration-200",
          isExpanded ? "grid-rows-[1fr] mt-3 opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <div className="flex flex-wrap items-center gap-3">
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                {categories
                  .filter((c) => !c.parentId)
                  .map((parent) => {
                    const children = categories.filter((c) => c.parentId === parent.id)
                    return (
                      <div key={parent.id}>
                        <SelectItem value={parent.id}>
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: parent.color }} />
                            {parent.name}
                          </div>
                        </SelectItem>
                        {children.map((child) => (
                          <SelectItem key={child.id} value={child.id}>
                            <div className="flex items-center gap-2 pl-3">
                              <span className="w-1.5 h-1.5 rounded-full opacity-70" style={{ backgroundColor: child.color }} />
                              <span className="text-muted-foreground">{child.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </div>
                    )
                  })}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Switch id="reminder-mode" checked={isReminder} onCheckedChange={setIsReminder} />
              <Label htmlFor="reminder-mode" className="text-sm cursor-pointer">
                Recordatorio
              </Label>
            </div>

            {isReminder && (
              <>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Calendar className="h-4 w-4" />
                      {dueDate ? formatDate(dueDate) : "Fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent mode="single" selected={dueDate} onSelect={setDueDate} initialFocus />
                  </PopoverContent>
                </Popover>
                <Input
                  type="time"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  className="w-[120px]"
                />
              </>
            )}
          </div>
        </div>
      </div>
    </form>
  )
}
