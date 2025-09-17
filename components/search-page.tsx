"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, ArrowLeft, ExternalLink, Calendar, FileText, Clock } from "lucide-react"
import type { Event } from "@/app/page"

interface SearchPageProps {
  events: Event[]
  onBack: () => void
}

interface SearchResult {
  event: Event
  matchType: "title" | "notes" | "category"
  matchText: string
  daysDifference: number
}

export function SearchPage({ events, onBack }: SearchPageProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Focus search input when component mounts
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [])

  // Calculate days difference from today
  const calculateDaysDifference = (eventDate: string): number => {
    const today = new Date()
    const event = new Date(eventDate)
    const diffTime = event.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  // Real-time search as user types (letter by letter)
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([])
      return
    }

    const term = searchTerm.toLowerCase()
    const results: SearchResult[] = []

    events.forEach((event) => {
      let matchType: "title" | "notes" | "category" | null = null
      let matchText = ""

      // Search in title (highest priority)
      if (event.title.toLowerCase().includes(term)) {
        matchType = "title"
        matchText = event.title
      }
      // Search in notes
      else if (event.notes.toLowerCase().includes(term)) {
        matchType = "notes"
        matchText = event.notes
      }
      // Search in category
      else if (event.category.toLowerCase().includes(term)) {
        matchType = "category"
        matchText = event.category
      }

      if (matchType) {
        results.push({
          event,
          matchType,
          matchText,
          daysDifference: calculateDaysDifference(event.date),
        })
      }
    })

    results.sort((a, b) => {
      const absA = Math.abs(a.daysDifference)
      const absB = Math.abs(b.daysDifference)
      return absA - absB
    })

    setSearchResults(results)
  }, [searchTerm, events])

  // Handle right-click to open in new tab
  const handleEventRightClick = (event: Event, e: React.MouseEvent) => {
    e.preventDefault()
    const eventUrl = `${window.location.origin}?eventId=${event.id}&date=${event.date}&title=${encodeURIComponent(event.title)}`
    window.open(eventUrl, "_blank")
  }

  const getMonthColor = (date: string) => {
    const month = new Date(date).getMonth()
    const colors = [
      "bg-blue-500", // Jan
      "bg-teal-500", // Feb
      "bg-green-500", // Mar
      "bg-blue-600", // Apr
      "bg-teal-600", // May
      "bg-green-600", // Jun
      "bg-blue-700", // Jul
      "bg-teal-700", // Aug
      "bg-green-700", // Sep
      "bg-blue-800", // Oct
      "bg-teal-800", // Nov
      "bg-green-800", // Dec
    ]
    return colors[month]
  }

  const getMonthAbbr = (date: string) => {
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
    return months[new Date(date).getMonth()]
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Alumnos":
        return "bg-green-100 text-green-800 border-green-200"
      case "Docentes":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "Presentaciones":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "Otros":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getMatchIcon = (matchType: string) => {
    switch (matchType) {
      case "title":
        return <FileText className="h-4 w-4" />
      case "notes":
        return <FileText className="h-4 w-4" />
      case "category":
        return <Calendar className="h-4 w-4" />
      default:
        return <Search className="h-4 w-4" />
    }
  }

  const formatDaysDifference = (days: number) => {
    if (days === 0) return "Hoy"
    if (days === 1) return "Mañana"
    if (days === -1) return "Ayer"
    if (days > 0) return `En ${days} días`
    return `Hace ${Math.abs(days)} días`
  }

  const getDateColor = (days: number) => {
    if (days === 0) return "text-green-600 font-semibold"
    if (days > 0 && days <= 7) return "text-blue-600"
    if (days > 0) return "text-muted-foreground"
    return "text-gray-500"
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Búsqueda de Eventos</h1>
            <p className="text-muted-foreground">Busca eventos por título, notas o categoría</p>
          </div>
        </div>

        {/* Search Input */}
        <Card className="p-6 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              placeholder="Escribe para buscar eventos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 text-lg h-12"
            />
          </div>

          {searchTerm && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {searchResults.length} resultado{searchResults.length !== 1 ? "s" : ""} encontrado
                {searchResults.length !== 1 ? "s" : ""}
              </p>
              <p className="text-xs text-muted-foreground">Ordenado por proximidad temporal</p>
            </div>
          )}
        </Card>

        {/* Search Results - Timeline Style */}
        <div className="space-y-6">
          {searchTerm && searchResults.length === 0 && (
            <Card className="p-8 text-center">
              <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No se encontraron resultados</h3>
              <p className="text-muted-foreground">Intenta con otros términos de búsqueda</p>
            </Card>
          )}

          {!searchTerm && (
            <Card className="p-8 text-center">
              <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">Comienza a escribir para buscar</h3>
              <p className="text-muted-foreground">Los resultados aparecerán ordenados cronológicamente</p>
            </Card>
          )}

          {searchResults.map((result, index) => (
            <div
              key={`${result.event.id}-${index}`}
              className="flex items-center gap-6 group cursor-pointer"
              onContextMenu={(e) => handleEventRightClick(result.event, e)}
            >
              {/* Month Circle */}
              <div
                className={`flex-shrink-0 w-16 h-16 rounded-full ${getMonthColor(result.event.date)} flex items-center justify-center text-white font-bold text-sm shadow-lg`}
              >
                {getMonthAbbr(result.event.date)}
              </div>

              {/* Event Card */}
              <Card className="flex-1 p-6 hover:shadow-lg transition-all duration-200 group-hover:scale-[1.02]">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Date and Day */}
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-bold text-foreground">
                        {new Date(result.event.date).toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "short",
                        })}{" "}
                        •{" "}
                        {new Date(result.event.date).toLocaleDateString("es-ES", {
                          weekday: "short",
                        })}
                      </h4>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className={`text-sm font-medium ${getDateColor(result.daysDifference)}`}>
                          {formatDaysDifference(result.daysDifference)}
                        </span>
                      </div>
                    </div>

                    {/* Event Title */}
                    <h3 className="text-xl font-semibold text-foreground mb-2 leading-tight">{result.event.title}</h3>

                    {/* Category and Match Type */}
                    <div className="flex items-center gap-3 mb-3">
                      <Badge className={`${getCategoryColor(result.event.category)}`}>{result.event.category}</Badge>
                      <div className="flex items-center gap-1">
                        {getMatchIcon(result.matchType)}
                        <Badge variant="outline" className="text-xs">
                          {result.matchType === "title"
                            ? "Título"
                            : result.matchType === "category"
                              ? "Categoría"
                              : "Notas"}
                        </Badge>
                      </div>
                    </div>

                    {/* Event Notes */}
                    <div className="space-y-1">
                      <p className="text-muted-foreground text-sm leading-relaxed">• {result.event.notes}</p>
                    </div>
                  </div>

                  {/* External Link Icon */}
                  <ExternalLink
                    className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
                    onClick={(e) => handleEventRightClick(result.event, e as any)}
                  />
                </div>
              </Card>
            </div>
          ))}
        </div>

        {/* Footer Tip */}
        {searchResults.length > 0 && (
          <Card className="mt-8 p-4 bg-muted/30">
            <p className="text-xs text-muted-foreground text-center">
              💡 Tip: Haz clic derecho en cualquier evento para abrirlo en una nueva pestaña
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}
