"use client"

import { useState } from "react"
import { Trash2, Pencil, ExternalLink, X, Check, Star } from "lucide-react"
import { useApp } from "@/lib/store"
import type { Note } from "@/lib/types"
import { formatDate } from "@/lib/helpers"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface NoteCardProps {
  note: Note
}

export function NoteCard({ note }: NoteCardProps) {
  const { categories, updateNote, deleteNote } = useApp()
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(note.text)
  const [editMainTag, setEditMainTag] = useState(note.mainTag || "")

  const category = categories.find((c) => c.id === note.categoryId)

  const handleSave = () => {
    if (editText.trim()) {
      // Extract tags from #hashtags, filter duplicates and empty strings
      const tagsSet = new Set(
        editText.match(/#\w+/g)?.map((t) => t.slice(1).toLowerCase()) || []
      )
      const tags = Array.from(tagsSet).filter((t) => t.length > 0)
      updateNote(note.id, { 
        text: editText.trim(), 
        tags,
        mainTag: editMainTag.trim() || undefined
      })
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditText(note.text)
    setEditMainTag(note.mainTag || "")
    setIsEditing(false)
  }

  return (
    <Card className="group relative overflow-hidden transition-shadow hover:shadow-md">
      <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: category?.color || "#64748b" }} />
      <CardContent className="p-3 sm:p-4 pl-4 sm:pl-5">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-2 sm:gap-3">
          <div className="flex-1 min-w-0 w-full">
            {isEditing ? (
              <div className="space-y-3">
                <Textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="min-h-[80px] resize-none text-sm"
                  autoFocus
                  placeholder="Contenido de la nota..."
                />
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editMainTag}
                    onChange={(e) => setEditMainTag(e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    placeholder="Etiqueta principal (opcional)"
                  />
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button size="sm" onClick={handleSave} className="text-xs sm:text-sm">
                      <Check className="h-3 w-3 mr-1" />
                      Guardar
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleCancel} className="text-xs sm:text-sm">
                      <X className="h-3 w-3 mr-1" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <p className="text-xs sm:text-sm whitespace-pre-wrap break-words">{note.text}</p>
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-2 sm:mt-3">
                  <Badge variant="secondary" className="text-xs" style={{ borderColor: category?.color }}>
                    {category?.name || "Sin categoría"}
                  </Badge>
                  {note.mainTag && (
                    <Badge className="text-xs bg-amber-500 text-white hover:bg-amber-600 gap-1">
                      <Star className="h-2.5 w-2.5" />
                      {note.mainTag}
                    </Badge>
                  )}
                  {note.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">{formatDate(note.createdAt)}</p>
              </>
            )}
          </div>

          {!isEditing && (
            <div className="flex items-center gap-0.5 sm:gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
              {note.attachmentUrl && (
                <Button size="icon" variant="ghost" className="h-6 w-6 sm:h-7 sm:w-7" asChild>
                  <a href={note.attachmentUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  </a>
                </Button>
              )}
              <Button size="icon" variant="ghost" className="h-6 w-6 sm:h-7 sm:w-7" onClick={() => setIsEditing(true)}>
                <Pencil className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 sm:h-7 sm:w-7 text-destructive hover:text-destructive"
                onClick={() => deleteNote(note.id)}
              >
                <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
