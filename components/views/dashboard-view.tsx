"use client"

import { useMemo, useState } from "react"
import { BarChart3, FileText, Bell, AlertTriangle, CheckCircle, Download, RefreshCw, Cloud, CloudOff, Upload } from "lucide-react"
import { useApp } from "@/lib/store"
import { getReminderStatus } from "@/lib/helpers"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function DashboardView() {
  const { notes, reminders, categories, syncStatus, lastSyncedAt, syncWithCloud, exportData, importHistoricalData } = useApp()
  const [importing, setImporting] = useState(false)

  const handleImport = async () => {
    setImporting(true)
    await importHistoricalData()
    setImporting(false)
  }

  const stats = useMemo(() => {
    const notesByCategory: Record<string, number> = {}
    const remindersByCategory: Record<string, number> = {}

    categories.forEach((cat) => {
      notesByCategory[cat.id] = notes.filter((n) => n.categoryId === cat.id).length
      remindersByCategory[cat.id] = reminders.filter((r) => r.categoryId === cat.id && !r.completed).length
    })

    const overdueReminders = reminders.filter((r) => getReminderStatus(r) === "overdue").length
    const pendingReminders = reminders.filter((r) => !r.completed).length
    const completedReminders = reminders.filter((r) => r.completed).length
    const todayReminders = reminders.filter((r) => getReminderStatus(r) === "today").length

    return {
      totalNotes: notes.length,
      pendingReminders,
      overdueReminders,
      completedReminders,
      todayReminders,
      notesByCategory,
      remindersByCategory,
    }
  }, [notes, reminders, categories])

  const maxNotes = Math.max(...Object.values(stats.notesByCategory), 1)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Dashboard</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {syncStatus === "syncing" ? (
              <RefreshCw className="h-4 w-4 animate-spin text-primary" />
            ) : syncStatus === "success" ? (
              <Cloud className="h-4 w-4 text-green-500" />
            ) : syncStatus === "error" ? (
              <CloudOff className="h-4 w-4 text-red-500" />
            ) : (
              <Cloud className="h-4 w-4" />
            )}
            {lastSyncedAt && (
              <span>
                Ultima sync: {lastSyncedAt.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </div>
          <Button 
            onClick={syncWithCloud} 
            variant="outline" 
            size="sm"
            disabled={syncStatus === "syncing"}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", syncStatus === "syncing" && "animate-spin")} />
            Sincronizar
          </Button>
          <Button onClick={handleImport} variant="outline" size="sm" disabled={importing}>
            <Upload className={cn("h-4 w-4 mr-2", importing && "animate-spin")} />
            {importing ? "Importando..." : "Importar historial"}
          </Button>
          <Button onClick={exportData} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Total Notas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalNotes}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Recordatorios Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.pendingReminders}</p>
            {stats.todayReminders > 0 && (
              <p className="text-xs text-yellow-600 mt-1">{stats.todayReminders} para hoy</p>
            )}
          </CardContent>
        </Card>

        <Card className={cn(stats.overdueReminders > 0 && "border-red-200 bg-red-50")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className={cn("h-4 w-4", stats.overdueReminders > 0 && "text-red-500")} />
              Vencidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={cn("text-3xl font-bold", stats.overdueReminders > 0 && "text-red-600")}>
              {stats.overdueReminders}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Completados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{stats.completedReminders}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Actividad por Categoría</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categories.map((cat) => {
              const noteCount = stats.notesByCategory[cat.id] || 0
              const reminderCount = stats.remindersByCategory[cat.id] || 0
              const percentage = (noteCount / maxNotes) * 100

              return (
                <div key={cat.id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="font-medium">{cat.name}</span>
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {noteCount} notas • {reminderCount} recordatorios
                    </div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%`, backgroundColor: cat.color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
