"use client"

import { useEffect, useState, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trash2, RefreshCw, Trash } from "lucide-react"
import { api, type ApiHistoryRecord } from "@/lib/api"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface HistoryViewProps {
  type?: string
  itemId?: string
  limit?: number
  refreshTrigger?: number
}

const TYPE_COLORS: Record<string, string> = {
  note:      "border-blue-300 bg-blue-50 dark:bg-blue-950/30",
  reminder:  "border-yellow-300 bg-yellow-50 dark:bg-yellow-950/30",
  category:  "border-purple-300 bg-purple-50 dark:bg-purple-950/30",
  import:    "border-green-300 bg-green-50 dark:bg-green-950/30",
}

const TYPE_LABELS: Record<string, string> = {
  note:     "Nota",
  reminder: "Recordatorio",
  category: "Categoría",
  import:   "Importación",
}

const ACTION_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  create:   "default",
  update:   "secondary",
  delete:   "destructive",
  complete: "outline",
  import:   "default",
}

const ACTION_LABELS: Record<string, string> = {
  create:   "Creado",
  update:   "Editado",
  delete:   "Eliminado",
  complete: "Completado",
  import:   "Importado",
}

function formatDate(isoString: string) {
  try {
    return new Date(isoString).toLocaleString("es-AR", {
      year:   "numeric",
      month:  "2-digit",
      day:    "2-digit",
      hour:   "2-digit",
      minute: "2-digit",
    })
  } catch {
    return isoString
  }
}

export function HistoryView({ type, itemId, limit = 100, refreshTrigger }: HistoryViewProps) {
  const [history, setHistory]         = useState<ApiHistoryRecord[]>([])
  const [isLoading, setIsLoading]     = useState(true)
  const [error, setError]             = useState<string | null>(null)
  const [filterType, setFilterType]   = useState<string>("all")
  const [filterAction, setFilterAction] = useState<string>("all")
  const [deletingId, setDeletingId]   = useState<string | null>(null)
  const [isClearing, setIsClearing]   = useState(false)

  const fetchHistory = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Load from local seed (always available, works offline)
      const seedRes  = await fetch("/api/seed-historical")
      const seedData = await seedRes.json()
      const seedHistory: ApiHistoryRecord[] = (seedData.history || []).map((h: ApiHistoryRecord) => ({
        ...h,
        _source: "local",
      }))

      // Try to load from GAS (may fail if not configured)
      let cloudHistory: ApiHistoryRecord[] = []
      try {
        const params: { type?: string; itemId?: string; limit?: number } = { limit }
        if (type)   params.type   = type
        if (itemId) params.itemId = itemId
        const cloudRes = await api.getHistory(params)
        cloudHistory = (Array.isArray(cloudRes) ? cloudRes : []).map((h) => ({
          ...h,
          _source: "cloud",
        }))
      } catch {
        // GAS not configured yet — that is fine, we show local data only
      }

      // Merge: cloud takes precedence (de-dup by id)
      const seen = new Set<string>()
      const merged: ApiHistoryRecord[] = []
      for (const r of [...cloudHistory, ...seedHistory]) {
        if (!seen.has(r.id)) {
          seen.add(r.id)
          merged.push(r)
        }
      }

      // Sort newest first
      merged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

      setHistory(merged.slice(0, limit))
    } catch (err) {
      setError(`Error al cargar el historial: ${err}`)
    } finally {
      setIsLoading(false)
    }
  }, [type, itemId, limit])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory, refreshTrigger])

  const handleDelete = useCallback(async (id: string) => {
    setDeletingId(id)
    try {
      // Remove from local state immediately (optimistic)
      setHistory((prev) => prev.filter((r) => r.id !== id))
      // Fire against GAS in background (may fail if not configured)
      await api.deleteHistory(id).catch(() => {})
    } finally {
      setDeletingId(null)
    }
  }, [])

  const handleClearAll = useCallback(async () => {
    setIsClearing(true)
    try {
      setHistory([])
      await api.clearHistory().catch(() => {})
    } finally {
      setIsClearing(false)
    }
  }, [])

  // Derived filtered list
  const filtered = history.filter((r) => {
    if (filterType   !== "all" && r.type   !== filterType)   return false
    if (filterAction !== "all" && r.action !== filterAction) return false
    return true
  })

  const allTypes   = [...new Set(history.map((r) => r.type))]
  const allActions = [...new Set(history.map((r) => r.action))]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
        <span className="text-muted-foreground">Cargando historial...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {/* Type filter */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground font-medium">Tipo:</span>
            {["all", ...allTypes].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                  filterType === t
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                {t === "all" ? "Todos" : (TYPE_LABELS[t] ?? t)}
              </button>
            ))}
          </div>
          {/* Action filter */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground font-medium">Acción:</span>
            {["all", ...allActions].map((a) => (
              <button
                key={a}
                onClick={() => setFilterAction(a)}
                className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                  filterAction === a
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                {a === "all" ? "Todas" : (ACTION_LABELS[a] ?? a)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchHistory}
            className="gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Actualizar
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                disabled={history.length === 0 || isClearing}
                className="gap-1.5"
              >
                <Trash className="h-3.5 w-3.5" />
                Limpiar todo
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Limpiar historial completo</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción eliminará todos los registros del historial de cambios.
                  Los datos (notas y recordatorios) no se verán afectados.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Sí, limpiar todo
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Stats row */}
      <p className="text-xs text-muted-foreground">
        Mostrando <strong>{filtered.length}</strong> de <strong>{history.length}</strong> registros
      </p>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-sm">No hay registros en el historial</p>
        </div>
      )}

      {/* History list */}
      <div className="space-y-2">
        {filtered.map((record) => (
          <Card
            key={record.id}
            className={`p-4 border-l-4 ${TYPE_COLORS[record.type] ?? "border-border bg-card"}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0 space-y-1.5">
                {/* Badges row */}
                <div className="flex items-center flex-wrap gap-2">
                  <Badge variant={ACTION_VARIANTS[record.action] ?? "secondary"} className="text-[10px] px-1.5 py-0">
                    {ACTION_LABELS[record.action] ?? record.action.toUpperCase()}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                    {TYPE_LABELS[record.type] ?? record.type}
                  </span>
                  {record.fieldModified && (
                    <span className="text-[10px] text-muted-foreground">
                      Campo: <em>{record.fieldModified}</em>
                    </span>
                  )}
                </div>

                {/* Details / preview */}
                {record.details && (
                  <p className="text-sm text-foreground leading-snug break-words">{record.details}</p>
                )}

                {/* Before / after values */}
                {(record.newValue !== null && record.newValue !== undefined) && (
                  <div className="text-xs space-y-0.5 mt-1">
                    {record.oldValue !== null && record.oldValue !== undefined && (
                      <div className="flex gap-1.5">
                        <span className="font-medium text-destructive shrink-0">Anterior:</span>
                        <span className="text-muted-foreground break-words line-clamp-2">
                          {typeof record.oldValue === "object"
                            ? JSON.stringify(record.oldValue)
                            : String(record.oldValue)}
                        </span>
                      </div>
                    )}
                    <div className="flex gap-1.5">
                      <span className="font-medium text-green-600 dark:text-green-400 shrink-0">Nuevo:</span>
                      <span className="text-muted-foreground break-words line-clamp-2">
                        {typeof record.newValue === "object"
                          ? JSON.stringify(record.newValue)
                          : String(record.newValue)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Right: timestamp + delete */}
              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                  {formatDate(record.timestamp)}
                </span>
                <span className="text-[9px] font-mono text-muted-foreground/60">
                  {record.itemId?.substring(0, 8)}...
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleDelete(record.id)}
                  disabled={deletingId === record.id}
                  aria-label="Eliminar registro"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
