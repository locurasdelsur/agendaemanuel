"use client"

import { Trash2, Clock } from "lucide-react"
import { useApp } from "@/lib/store"
import type { Reminder } from "@/lib/types"
import { formatDate, formatTime, getReminderStatus, getStatusColor, getStatusLabel } from "@/lib/helpers"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

interface ReminderCardProps {
  reminder: Reminder
}

export function ReminderCard({ reminder }: ReminderCardProps) {
  const { categories, toggleReminderComplete, deleteReminder } = useApp()

  const category = categories.find((c) => c.id === reminder.categoryId)
  const status = getReminderStatus(reminder)
  const statusColor = getStatusColor(status)
  const statusLabel = getStatusLabel(status)

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-shadow hover:shadow-md",
        reminder.completed && "opacity-60"
      )}
    >
      <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: category?.color || "#64748b" }} />
      <CardContent className="p-4 pl-5">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={reminder.completed}
            onCheckedChange={() => toggleReminderComplete(reminder.id)}
            className="mt-0.5"
          />
          <div className="flex-1 min-w-0">
            <p className={cn("text-sm", reminder.completed && "line-through text-muted-foreground")}>
              {reminder.text}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs" style={{ borderColor: category?.color }}>
                {category?.name || "Sin categoría"}
              </Badge>
              <Badge className={cn("text-xs border", statusColor)}>{statusLabel}</Badge>
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{formatDate(reminder.dueDate)}</span>
              {reminder.dueTime && <span>a las {formatTime(reminder.dueTime)}</span>}
            </div>
          </div>

          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
            onClick={() => deleteReminder(reminder.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
