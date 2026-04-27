"use client"

import { useState, useMemo, useRef } from "react"
import {
  ChevronLeft, ChevronRight, Search, Clock, CheckCircle2, Circle,
  FileText, Bell, X, Pencil, Trash2, Check, Save,
} from "lucide-react"
import { useApp } from "@/lib/store"
import { getReminderStatus } from "@/lib/helpers"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { Note, Reminder } from "@/lib/types"

// ─── constants ────────────────────────────────────────────────────────────────
const MONTHS_ES = [
  "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
  "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE",
]
const DAYS_ES_SHORT = ["L", "M", "X", "J", "V", "S", "D"]
const DAYS_ES_FULL  = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}
function getFirstDayOfWeek(year: number, month: number) {
  const day = new Date(year, month, 1).getDay()
  return day === 0 ? 6 : day - 1
}

type CalendarEvent =
  | { kind: "note";     item: Note }
  | { kind: "reminder"; item: Reminder }

// ─── MiniCalendar ─────────────────────────────────────────────────────────────
interface MiniCalendarProps {
  year: number; month: number
  currentYear: number; currentMonth: number; today: Date
}
function MiniCalendar({ year, month, currentYear, currentMonth, today }: MiniCalendarProps) {
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay   = getFirstDayOfWeek(year, month)
  const isCurrentMonth = year === currentYear && month === currentMonth

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const isToday   = (d: number) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear()
  const isSunday  = (i: number) => i % 7 === 6
  const isSaturday= (i: number) => i % 7 === 5

  return (
    <div className="text-center">
      <p className="text-xs font-semibold text-muted-foreground mb-2 tracking-wide">
        {MONTHS_ES[month]} {year}
      </p>
      <div className="grid grid-cols-7 gap-0">
        {DAYS_ES_SHORT.map((d, i) => (
          <div key={d} className={cn(
            "text-[10px] font-semibold text-center pb-1 w-6 mx-auto",
            i === 6 ? "text-red-500" : i === 5 ? "text-blue-500" : "text-muted-foreground",
          )}>{d}</div>
        ))}
        {cells.map((day, i) => (
          <div key={i} className="w-6 h-6 flex items-center justify-center mx-auto">
            {day !== null && (
              <span className={cn(
                "text-[11px] w-5 h-5 flex items-center justify-center rounded-full",
                isToday(day) && "bg-primary text-primary-foreground font-bold",
                !isToday(day) && isSunday(i)   && "text-red-500",
                !isToday(day) && isSaturday(i) && "text-blue-500",
                !isToday(day) && !isSunday(i) && !isSaturday(i) && "text-foreground",
                isCurrentMonth && !isToday(day) && "opacity-40",
              )}>{day}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── EventPill: hover tooltip + click opens edit dialog ───────────────────────
interface EventPillProps {
  ev: CalendarEvent
  categories: ReturnType<typeof useApp>["categories"]
  onEdit: (ev: CalendarEvent) => void
}
function EventPill({ ev, categories, onEdit }: EventPillProps) {
  const cat   = categories.find((c) => c.id === ev.item.categoryId)
  const color = cat?.color || "#64748b"

  const label = ev.kind === "note"
    ? ev.item.text.split("\n")[0].replace(/^\[/, "").replace(/\]$/, "")
    : ev.item.text

  const isOverdue = ev.kind === "reminder"
    ? getReminderStatus(ev.item) === "overdue" && !ev.item.completed
    : false

  // Build tooltip body
  const tooltipLines: string[] = []
  if (ev.kind === "note") {
    const rest = ev.item.text.split("\n").slice(1).join("\n").trim()
    if (rest) tooltipLines.push(rest)
    if (cat) tooltipLines.push(cat.name)
    if (ev.item.tags.length) tooltipLines.push(ev.item.tags.map(t => `#${t}`).join(" "))
  } else {
    if (cat) tooltipLines.push(cat.name)
    const time = new Date(ev.item.dueDate).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
    tooltipLines.push(time)
    if (ev.item.completed) tooltipLines.push("Completado")
    if (isOverdue) tooltipLines.push("Vencido")
  }

  return (
    <div className="group/pill relative">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onEdit(ev) }}
        className={cn(
          "w-full text-left text-[10px] leading-tight px-1 py-0.5 rounded truncate flex items-center gap-0.5 transition-opacity",
          ev.kind === "reminder" && ev.item.completed && "opacity-50 line-through",
          isOverdue
            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
            : "text-white",
        )}
        style={!isOverdue ? { backgroundColor: color } : undefined}
        title={label}
      >
        {ev.kind === "note"
          ? <FileText className="h-2 w-2 flex-shrink-0" />
          : <Bell     className="h-2 w-2 flex-shrink-0" />
        }
        <span className="truncate">{label}</span>
      </button>

      {/* Hover tooltip */}
      <div className={cn(
        "absolute z-50 bottom-full left-0 mb-1 w-52 rounded-lg border bg-popover shadow-lg p-2.5 text-xs",
        "opacity-0 pointer-events-none group-hover/pill:opacity-100 group-hover/pill:pointer-events-auto",
        "transition-opacity duration-150",
      )}>
        {/* Color accent bar */}
        <div className="h-1 w-6 rounded mb-2" style={{ backgroundColor: color }} />
        <p className="font-semibold text-foreground leading-snug mb-1">{label}</p>
        {tooltipLines.map((line, i) => (
          <p key={i} className="text-muted-foreground leading-relaxed">{line}</p>
        ))}
        <p className="text-muted-foreground mt-1 pt-1 border-t text-[10px]">
          Clic para editar
        </p>
      </div>
    </div>
  )
}

// ─── Edit Dialog ──────────────────────────────────────────────────────────────
interface EditDialogProps {
  ev: CalendarEvent | null
  categories: ReturnType<typeof useApp>["categories"]
  onClose: () => void
  onSaveNote: (id: string, text: string, categoryId: string, tags: string[]) => void
  onSaveReminder: (id: string, text: string, categoryId: string, dueDate: Date, completed: boolean) => void
  onDelete: (ev: CalendarEvent) => void
}
function EditDialog({ ev, categories, onClose, onSaveNote, onSaveReminder, onDelete }: EditDialogProps) {
  const [text, setText] = useState(ev?.item.text ?? "")
  const [categoryId, setCategoryId] = useState(ev?.item.categoryId ?? "")
  const [dueDate, setDueDate] = useState(() => {
    if (ev?.kind === "reminder") {
      const d = new Date(ev.item.dueDate)
      return d.toISOString().slice(0, 16) // "YYYY-MM-DDTHH:mm"
    }
    return ""
  })
  const [completed, setCompleted] = useState(
    ev?.kind === "reminder" ? ev.item.completed : false,
  )

  // Reset when ev changes
  const prevEvId = useRef<string | null>(null)
  if (ev && ev.item.id !== prevEvId.current) {
    prevEvId.current = ev.item.id
    setText(ev.item.text)
    setCategoryId(ev.item.categoryId)
    if (ev.kind === "reminder") {
      setDueDate(new Date(ev.item.dueDate).toISOString().slice(0, 16))
      setCompleted(ev.item.completed)
    }
  }

  const handleSave = () => {
    if (!ev) return
    if (ev.kind === "note") {
      const tags = text.match(/#\w+/g)?.map((t) => t.slice(1)) || ev.item.tags
      onSaveNote(ev.item.id, text.trim(), categoryId, tags)
    } else {
      onSaveReminder(ev.item.id, text.trim(), categoryId, new Date(dueDate), completed)
    }
    onClose()
  }

  if (!ev) return null

  const topCategories = categories.filter((c) => !c.parentId)

  return (
    <Dialog open={!!ev} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {ev.kind === "note"
              ? <><FileText className="h-4 w-4" /> Editar nota</>
              : <><Bell     className="h-4 w-4" /> Editar recordatorio</>
            }
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Text */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Contenido</label>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={ev.kind === "note" ? 5 : 2}
              className="resize-none"
              autoFocus
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Etiqueta</label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar etiqueta" />
              </SelectTrigger>
              <SelectContent>
                {topCategories.map((parent) => {
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
          </div>

          {/* Reminder-specific fields */}
          {ev.kind === "reminder" && (
            <>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Fecha y hora</label>
                <Input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
              <button
                type="button"
                onClick={() => setCompleted((v) => !v)}
                className={cn(
                  "flex items-center gap-2 text-sm rounded-md px-3 py-2 w-full border transition-colors",
                  completed
                    ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-950/30 dark:border-green-800 dark:text-green-400"
                    : "bg-muted/40 text-muted-foreground",
                )}
              >
                {completed
                  ? <CheckCircle2 className="h-4 w-4" />
                  : <Circle       className="h-4 w-4" />
                }
                {completed ? "Completado" : "Marcar como completado"}
              </button>
            </>
          )}
        </div>

        <DialogFooter className="flex-row gap-2">
          <Button
            variant="destructive"
            size="sm"
            className="mr-auto"
            onClick={() => { onDelete(ev); onClose() }}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            Eliminar
          </Button>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="h-3.5 w-3.5 mr-1.5" />
            Cancelar
          </Button>
          <Button size="sm" onClick={handleSave}>
            <Save className="h-3.5 w-3.5 mr-1.5" />
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Day Detail Panel ─────────────────────────────────────────────────────────
interface DayDetailProps {
  day: number; year: number; month: number
  events: CalendarEvent[]
  categories: ReturnType<typeof useApp>["categories"]
  onClose: () => void
  onEdit: (ev: CalendarEvent) => void
}
function DayDetail({ day, year, month, events, categories, onClose, onEdit }: DayDetailProps) {
  const date  = new Date(year, month, day)
  const label = date.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })

  return (
    <div className="border rounded-xl bg-card shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h3 className="font-semibold capitalize text-sm">{label}</h3>
        <button type="button" onClick={onClose} className="p-1 rounded hover:bg-muted transition-colors" aria-label="Cerrar">
          <X className="h-4 w-4" />
        </button>
      </div>

      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">Sin eventos este día</p>
      ) : (
        <ul className="divide-y">
          {events.map((ev) => {
            const cat = categories.find((c) => c.id === ev.item.categoryId)
            if (ev.kind === "note") {
              const note = ev.item
              const firstLine = note.text.split("\n")[0].replace(/^\[/, "").replace(/\]$/, "")
              const rest      = note.text.split("\n").slice(1).join("\n").trim()
              return (
                <li key={note.id} className="px-4 py-3 flex gap-3 group/row hover:bg-muted/30 transition-colors">
                  <FileText className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-snug">{firstLine}</p>
                    {rest && <p className="text-xs text-muted-foreground mt-0.5 whitespace-pre-wrap leading-relaxed">{rest}</p>}
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {cat && (
                        <Badge variant="secondary" className="text-xs" style={{ borderLeftColor: cat.color, borderLeftWidth: 3 }}>
                          {cat.name}
                        </Badge>
                      )}
                      {note.tags.map((t) => <Badge key={t} variant="outline" className="text-xs">{t}</Badge>)}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onEdit(ev)}
                    className="opacity-0 group-hover/row:opacity-100 transition-opacity p-1 rounded hover:bg-muted self-start"
                    aria-label="Editar"
                  >
                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </li>
              )
            } else {
              const reminder = ev.item
              const status   = getReminderStatus(reminder)
              return (
                <li key={reminder.id} className="px-4 py-3 flex gap-3 group/row hover:bg-muted/30 transition-colors">
                  <Bell className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                      {reminder.completed
                        ? <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-green-500 flex-shrink-0" />
                        : <Circle       className="h-3.5 w-3.5 mt-0.5 text-muted-foreground flex-shrink-0" />
                      }
                      <p className={cn(
                        "text-sm font-medium leading-snug",
                        reminder.completed && "line-through text-muted-foreground",
                      )}>{reminder.text}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-1.5 ml-5">
                      {cat && (
                        <Badge variant="secondary" className="text-xs" style={{ borderLeftColor: cat.color, borderLeftWidth: 3 }}>
                          {cat.name}
                        </Badge>
                      )}
                      {status === "overdue" && !reminder.completed && (
                        <Badge variant="destructive" className="text-xs">Vencido</Badge>
                      )}
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(reminder.dueDate).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onEdit(ev)}
                    className="opacity-0 group-hover/row:opacity-100 transition-opacity p-1 rounded hover:bg-muted self-start"
                    aria-label="Editar"
                  >
                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </li>
              )
            }
          })}
        </ul>
      )}
    </div>
  )
}

// ─── Main CalendarView ────────────────────────────────────────────────────────
export function CalendarView() {
  const { reminders, notes, categories, updateNote, deleteNote, updateReminder, deleteReminder } = useApp()
  const today = useMemo(() => new Date(), [])

  const [viewYear, setViewYear]     = useState(today.getFullYear())
  const [viewMonth, setViewMonth]   = useState(today.getMonth())
  const [calSearch, setCalSearch]   = useState("")
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)

  const prevMonth = viewMonth === 0 ? { year: viewYear - 1, month: 11 } : { year: viewYear, month: viewMonth - 1 }
  const nextMonth = viewMonth === 11 ? { year: viewYear + 1, month: 0 } : { year: viewYear, month: viewMonth + 1 }

  const goToPrev = () => { setViewMonth(prevMonth.month); setViewYear(prevMonth.year); setSelectedDay(null) }
  const goToNext = () => { setViewMonth(nextMonth.month); setViewYear(nextMonth.year); setSelectedDay(null) }

  // Build grid
  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDay    = getFirstDayOfWeek(viewYear, viewMonth)
  const gridCells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) gridCells.push(null)
  for (let d = 1; d <= daysInMonth; d++) gridCells.push(d)
  while (gridCells.length % 7 !== 0) gridCells.push(null)
  const weeks: (number | null)[][] = []
  for (let i = 0; i < gridCells.length; i += 7) weeks.push(gridCells.slice(i, i + 7))

  // Group events by day
  const eventsByDay = useMemo(() => {
    const map: Record<number, CalendarEvent[]> = {}

    notes.forEach((n) => {
      const d = new Date(n.createdAt)
      if (d.getFullYear() === viewYear && d.getMonth() === viewMonth) {
        const day = d.getDate()
        if (!map[day]) map[day] = []
        map[day].push({ kind: "note", item: n })
      }
    })

    reminders.forEach((r) => {
      const d = new Date(r.dueDate)
      if (d.getFullYear() === viewYear && d.getMonth() === viewMonth) {
        const day = d.getDate()
        if (!map[day]) map[day] = []
        map[day].push({ kind: "reminder", item: r })
      }
    })

    return map
  }, [notes, reminders, viewYear, viewMonth])

  const selectedDayEvents = selectedDay ? (eventsByDay[selectedDay] || []) : []

  // Search
  const searchResults = useMemo(() => {
    if (!calSearch.trim()) return []
    const q = calSearch.toLowerCase()

    const noteResults: CalendarEvent[] = notes
      .filter((n) => {
        const cat = categories.find((c) => c.id === n.categoryId)
        return n.text.toLowerCase().includes(q) ||
          n.tags.some((t) => t.toLowerCase().includes(q)) ||
          cat?.name.toLowerCase().includes(q)
      })
      .map((n) => ({ kind: "note" as const, item: n }))

    const reminderResults: CalendarEvent[] = reminders
      .filter((r) => {
        const cat = categories.find((c) => c.id === r.categoryId)
        return r.text?.toLowerCase().includes(q) || cat?.name.toLowerCase().includes(q)
      })
      .map((r) => ({ kind: "reminder" as const, item: r }))

    return [...noteResults, ...reminderResults].sort((a, b) => {
      const dateA = a.kind === "note" ? new Date(a.item.createdAt) : new Date(a.item.dueDate)
      const dateB = b.kind === "note" ? new Date(b.item.createdAt) : new Date(b.item.dueDate)
      return dateB.getTime() - dateA.getTime()
    })
  }, [calSearch, notes, reminders, categories])

  const isTodayCell = (day: number | null) =>
    !!day && day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear()

  // Edit handlers
  const handleSaveNote = (id: string, text: string, categoryId: string, tags: string[]) => {
    updateNote(id, { text, categoryId, tags })
  }
  const handleSaveReminder = (id: string, text: string, categoryId: string, dueDate: Date, completed: boolean) => {
    updateReminder(id, { text, categoryId, dueDate, completed })
  }
  const handleDelete = (ev: CalendarEvent) => {
    if (ev.kind === "note") deleteNote(ev.item.id)
    else deleteReminder(ev.item.id)
    setSelectedDay(null)
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Buscar notas, recordatorios, alumnos..."
          value={calSearch}
          onChange={(e) => { setCalSearch(e.target.value); setSelectedDay(null) }}
        />
      </div>

      {/* Search results */}
      {calSearch.trim() ? (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            {searchResults.length} resultado{searchResults.length !== 1 ? "s" : ""} para &ldquo;{calSearch}&rdquo;
          </p>
          {searchResults.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Sin resultados</p>
          ) : (
            <div className="space-y-2">
              {searchResults.map((ev) => {
                const cat = categories.find((c) => c.id === ev.item.categoryId)

                if (ev.kind === "note") {
                  const note      = ev.item
                  const firstLine = note.text.split("\n")[0].replace(/^\[/, "").replace(/\]$/, "")
                  const rest      = note.text.split("\n").slice(1).join("\n").trim()
                  const dateStr   = new Date(note.createdAt).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })
                  return (
                    <div
                      key={note.id}
                      className="flex items-start gap-3 p-3 rounded-lg border bg-card text-sm group/row hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => setEditingEvent(ev)}
                    >
                      <FileText className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium leading-snug">{firstLine}</p>
                        {rest && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{rest}</p>}
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {cat && (
                            <Badge variant="secondary" className="text-xs" style={{ borderLeftColor: cat.color, borderLeftWidth: 3 }}>
                              {cat.name}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />{dateStr}
                          </span>
                          {note.tags.map((t) => <Badge key={t} variant="outline" className="text-xs">{t}</Badge>)}
                        </div>
                      </div>
                      <Pencil className="h-3.5 w-3.5 mt-0.5 text-muted-foreground opacity-0 group-hover/row:opacity-100 transition-opacity flex-shrink-0" />
                    </div>
                  )
                } else {
                  const reminder = ev.item
                  const status   = getReminderStatus(reminder)
                  const dateStr  = new Date(reminder.dueDate).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })
                  return (
                    <div
                      key={reminder.id}
                      className="flex items-start gap-3 p-3 rounded-lg border bg-card text-sm group/row hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => setEditingEvent(ev)}
                    >
                      <Bell className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className={cn("font-medium", reminder.completed && "line-through text-muted-foreground")}>
                          {reminder.text}
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {cat && (
                            <Badge variant="secondary" className="text-xs" style={{ borderLeftColor: cat.color, borderLeftWidth: 3 }}>
                              {cat.name}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />{dateStr}
                          </span>
                          {status === "overdue" && !reminder.completed && (
                            <Badge variant="destructive" className="text-xs">Vencido</Badge>
                          )}
                        </div>
                      </div>
                      <Pencil className="h-3.5 w-3.5 mt-0.5 text-muted-foreground opacity-0 group-hover/row:opacity-100 transition-opacity flex-shrink-0" />
                    </div>
                  )
                }
              })}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* 3-month header */}
          <div className="flex items-start justify-between gap-4">
            <div className="hidden sm:block w-48 flex-shrink-0">
              <MiniCalendar year={prevMonth.year} month={prevMonth.month} currentYear={viewYear} currentMonth={viewMonth} today={today} />
            </div>
            <div className="flex-1 text-center">
              <div className="flex items-center justify-center gap-4">
                <button type="button" onClick={goToPrev} className="p-1 hover:text-primary transition-colors text-muted-foreground" aria-label="Mes anterior">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div>
                  <h2 className="text-3xl font-black tracking-wide text-foreground">{MONTHS_ES[viewMonth]}</h2>
                  <p className="text-3xl font-black text-red-500">{viewYear}</p>
                </div>
                <button type="button" onClick={goToNext} className="p-1 hover:text-primary transition-colors text-muted-foreground" aria-label="Mes siguiente">
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="hidden sm:block w-48 flex-shrink-0">
              <MiniCalendar year={nextMonth.year} month={nextMonth.month} currentYear={viewYear} currentMonth={viewMonth} today={today} />
            </div>
          </div>

          {/* Main monthly grid */}
          <div className="border rounded-xl overflow-visible">
            {/* Day headers */}
            <div className="grid grid-cols-7 bg-[#1e2d4a] rounded-t-xl">
              {DAYS_ES_FULL.map((day, i) => (
                <div key={day} className={cn("py-3 text-center text-sm font-semibold text-white", i < 6 && "border-r border-white/10")}>
                  {day}
                </div>
              ))}
            </div>

            {/* Weeks */}
            {weeks.map((week, wi) => (
              <div key={wi} className={cn("grid grid-cols-7", wi < weeks.length - 1 && "border-b")}>
                {week.map((day, di) => {
                  const isToday    = isTodayCell(day)
                  const isSun      = di === 6
                  const isSat      = di === 5
                  const dayEvents  = day ? (eventsByDay[day] || []) : []
                  const isSelected = day !== null && day === selectedDay

                  return (
                    <div
                      key={di}
                      onClick={() => day && setSelectedDay(isSelected ? null : day)}
                      className={cn(
                        "p-2 relative transition-colors flex flex-col",
                        di < 6 && "border-r",
                        !day && "bg-muted/30 min-h-[90px]",
                        day && "cursor-pointer",
                        isToday && "bg-blue-50 dark:bg-blue-950/20",
                        isSelected && "ring-2 ring-inset ring-primary bg-primary/5",
                        day && !isToday && !isSelected && "hover:bg-muted/40",
                      )}
                    >
                      {day !== null && (
                        <span className={cn(
                          "text-sm font-semibold leading-none",
                          isToday && "inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground",
                          !isToday && isSun && "text-red-500",
                          !isToday && isSat && "text-blue-500",
                          !isToday && !isSun && !isSat && "text-foreground",
                        )}>{day}</span>
                      )}

                      {/* Event pills - Expand container to show all */}
                      <div className="mt-1 space-y-0.5">
                        {dayEvents.map((ev) => (
                          <EventPill
                            key={ev.item.id}
                            ev={ev}
                            categories={categories}
                            onEdit={(e) => { setEditingEvent(e) }}
                          />
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>

          {/* Day detail panel */}
          {selectedDay !== null && (
            <DayDetail
              day={selectedDay}
              year={viewYear}
              month={viewMonth}
              events={selectedDayEvents}
              categories={categories}
              onClose={() => setSelectedDay(null)}
              onEdit={(ev) => setEditingEvent(ev)}
            />
          )}
        </>
      )}

      {/* Edit dialog */}
      <EditDialog
        ev={editingEvent}
        categories={categories}
        onClose={() => setEditingEvent(null)}
        onSaveNote={handleSaveNote}
        onSaveReminder={handleSaveReminder}
        onDelete={handleDelete}
      />
    </div>
  )
}
