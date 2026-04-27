"use client"

import { Search, X } from "lucide-react"
import { useApp } from "@/lib/store"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function SearchBar() {
  const { searchQuery, setSearchQuery } = useApp()

  return (
    <div className="relative flex-1 max-w-md">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Buscar notas, recordatorios, etiquetas..."
        className="pl-9 pr-9"
      />
      {searchQuery && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
          onClick={() => setSearchQuery("")}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  )
}
