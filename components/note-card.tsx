"use client"

import { useState } from "react"
import { Trash2, Pencil, ExternalLink, X, Check } from "lucide-react"
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

  const category = categories.find((c) => c.id === note.categoryId)

  const handleSave = () => {
    if (editText.trim()) {
      const tags = editText.match(/#\w+/g)?.map((t) => t.slice(1)) || []
      updateNote(note.id, { text: editText.trim(), tags })
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditText(note.text)
    setIsEditing(false)
  }

  return (
    <Card className="group relative overflow-hidden transition-shadow hover:shadow-md">
      <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: category?.color || "#64748b" }} />
      <CardContent className="p-4 pl-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="min-h-[80px] resize-none"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSave}>
                    <Check className="h-3 w-3 mr-1" />
                    Guardar
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCancel}>
                    <X className="h-3 w-3 mr-1" />
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm whitespace-pre-wrap">{note.text}</p>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <Badge variant="secondary" className="text-xs" style={{ borderColor: category?.color }}>
                    {category?.name || "Sin categoría"}
                  </Badge>
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
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {note.attachmentUrl && (
                <Button size="icon" variant="ghost" className="h-7 w-7" asChild>
                  <a href={note.attachmentUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </Button>
              )}
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setIsEditing(true)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => deleteNote(note.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
