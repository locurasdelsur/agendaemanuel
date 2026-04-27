"use client"

import { useState } from "react"
import Image from "next/image"
import { Plus, Folder, Trash2, Pencil, X, Check, GripVertical, ChevronRight, FolderPlus } from "lucide-react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { useApp } from "@/lib/store"
import type { Category } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

const COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#64748b",
  "#ef4444",
  "#14b8a6",
]

// ─── Sub-category inline add row ────────────────────────────────────────────

interface InlineAddSubProps {
  parentColor: string
  onAdd: (name: string) => void
  onCancel: () => void
}

function InlineAddSub({ parentColor, onAdd, onCancel }: InlineAddSubProps) {
  const [name, setName] = useState("")

  const commit = () => {
    if (name.trim()) onAdd(name.trim())
  }

  return (
    <div className="flex items-center gap-1 pl-7 pr-2 py-1">
      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: parentColor }} />
      <Input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nombre de sub-etiqueta"
        className="h-6 text-xs bg-sidebar-accent flex-1"
        onKeyDown={(e) => {
          if (e.key === "Enter") commit()
          if (e.key === "Escape") onCancel()
        }}
      />
      <Button size="icon" variant="ghost" className="h-5 w-5" onClick={commit}>
        <Check className="h-3 w-3" />
      </Button>
      <Button size="icon" variant="ghost" className="h-5 w-5" onClick={onCancel}>
        <X className="h-3 w-3" />
      </Button>
    </div>
  )
}

// ─── Single sortable category row ───────────────────────────────────────────

interface SortableCategoryProps {
  category: Category
  isSelected: boolean
  isEditing: boolean
  editName: string
  indent?: boolean
  onSelect: () => void
  onStartEdit: () => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onDelete: () => void
  onEditNameChange: (value: string) => void
  /** Only shown on top-level categories */
  onAddSub?: () => void
  /** Only shown on top-level categories */
  isExpanded?: boolean
  onToggleExpand?: () => void
  hasChildren?: boolean
}

function SortableCategory({
  category,
  isSelected,
  isEditing,
  editName,
  indent = false,
  onSelect,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onEditNameChange,
  onAddSub,
  isExpanded,
  onToggleExpand,
  hasChildren,
}: SortableCategoryProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-1 px-2 py-1.5 rounded-lg text-sm transition-colors",
        isDragging && "opacity-50 z-50",
        indent && "ml-4 pl-2",
        isSelected
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "hover:bg-sidebar-accent/50"
      )}
    >
      {/* Drag handle — only top-level categories are draggable */}
      {!indent ? (
        <button
          type="button"
          className="cursor-grab active:cursor-grabbing p-0.5 opacity-0 group-hover:opacity-100 transition-opacity touch-none flex-shrink-0"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-3 w-3 text-sidebar-foreground/50" />
        </button>
      ) : (
        <span className="w-4 flex-shrink-0" />
      )}

      {/* Expand/collapse chevron for parents */}
      {!indent && (
        <button
          type="button"
          onClick={onToggleExpand}
          className={cn(
            "p-0.5 flex-shrink-0 transition-all",
            hasChildren
              ? "opacity-60 hover:opacity-100"
              : "opacity-0 pointer-events-none"
          )}
        >
          <ChevronRight
            className={cn(
              "h-3 w-3 transition-transform duration-150",
              isExpanded && "rotate-90"
            )}
          />
        </button>
      )}
      {indent && <span className="w-4 flex-shrink-0" />}

      {isEditing ? (
        <div className="flex items-center gap-1 flex-1">
          <Input
            value={editName}
            onChange={(e) => onEditNameChange(e.target.value)}
            className="h-6 text-sm bg-sidebar-accent"
            onKeyDown={(e) => {
              if (e.key === "Enter") onSaveEdit()
              if (e.key === "Escape") onCancelEdit()
            }}
            autoFocus
          />
          <Button size="icon" variant="ghost" className="h-5 w-5" onClick={onSaveEdit}>
            <Check className="h-3 w-3" />
          </Button>
          <Button size="icon" variant="ghost" className="h-5 w-5" onClick={onCancelEdit}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={onSelect}
            className="flex items-center gap-2 flex-1 text-left min-w-0"
          >
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: category.color }}
            />
            <span className="truncate text-sm">{category.name}</span>
          </button>

          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity flex-shrink-0">
            {/* Add sub-category button — only on top-level */}
            {onAddSub && (
              <Button
                size="icon"
                variant="ghost"
                className="h-5 w-5"
                title="Agregar sub-etiqueta"
                onClick={onAddSub}
              >
                <FolderPlus className="h-3 w-3" />
              </Button>
            )}
            <Button
              size="icon"
              variant="ghost"
              className="h-5 w-5"
              onClick={onStartEdit}
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-5 w-5 text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Sidebar ────────────────────────────────────────────────────────────────

export function AppSidebar() {
  const {
    categories,
    selectedCategoryId,
    setSelectedCategory,
    addCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
    syncWithCloud,
  } = useApp()

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [newColor, setNewColor] = useState(COLORS[0])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  /** IDs of expanded parent categories */
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  /** ID of the parent that is currently showing the inline-add row */
  const [addingSubFor, setAddingSubFor] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      reorderCategories(active.id as string, over.id as string)
    }
  }

  const handleAdd = () => {
    if (newName.trim()) {
      addCategory({ name: newName.trim(), color: newColor })
      setNewName("")
      setNewColor(COLORS[0])
      setIsAddOpen(false)
    }
  }

  const handleAddSub = (parentId: string, name: string) => {
    const parent = categories.find((c) => c.id === parentId)
    if (!parent) return
    addCategory({ name, color: parent.color, parentId })
    setAddingSubFor(null)
    // Auto-expand the parent so the new sub-label is visible
    setExpanded((prev) => new Set([...prev, parentId]))
  }

  const startEditing = (id: string, name: string) => {
    setEditingId(id)
    setEditName(name)
  }

  const saveEdit = (id: string) => {
    if (editName.trim()) {
      updateCategory(id, { name: editName.trim() })
    }
    setEditingId(null)
    setEditName("")
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName("")
  }

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Separate parents (no parentId) and children
  const topLevel = categories.filter((c) => !c.parentId)
  const childrenOf = (parentId: string) => categories.filter((c) => c.parentId === parentId)

  return (
    <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col h-full border-r border-sidebar-border">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Logo E.E.S.T. Nº6"
            width={48}
            height={48}
            className="rounded-lg bg-white p-1"
          />
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-sm leading-tight">E.E.S.T. Nº6</h1>
            <p className="text-xs text-sidebar-foreground/70 truncate">Vicedirección</p>
          </div>
        </div>
      </div>

      {/* Add new top-level category button */}
      <div className="p-3 border-b border-sidebar-border">
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button variant="secondary" size="sm" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Etiqueta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva Etiqueta</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <Input
                placeholder="Nombre de la etiqueta"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
              <div className="flex flex-wrap gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-transform",
                      newColor === color ? "border-foreground scale-110" : "border-transparent"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewColor(color)}
                  />
                ))}
              </div>
              <Button onClick={handleAdd} disabled={!newName.trim()} className="w-full">
                Crear
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {/* "All categories" button */}
          <button
            type="button"
            onClick={() => {
              setSelectedCategory(null)
              syncWithCloud(false)
            }}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              selectedCategoryId === null
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "hover:bg-sidebar-accent/50"
            )}
          >
            <Folder className="h-4 w-4" />
            Todas las categorías
          </button>

          <div className="mt-2 space-y-0.5">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={topLevel.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                {topLevel.map((category) => {
                  const children = childrenOf(category.id)
                  const isExp = expanded.has(category.id)

                  return (
                    <div key={category.id}>
                      {/* Parent row */}
                      <SortableCategory
                        category={category}
                        isSelected={selectedCategoryId === category.id}
                        isEditing={editingId === category.id}
                        editName={editName}
                        onSelect={() => {
                          setSelectedCategory(category.id)
                          syncWithCloud(false)
                        }}
                        onStartEdit={() => startEditing(category.id, category.name)}
                        onSaveEdit={() => saveEdit(category.id)}
                        onCancelEdit={cancelEdit}
                        onDelete={() => deleteCategory(category.id)}
                        onEditNameChange={setEditName}
                        onAddSub={() => {
                          setAddingSubFor(category.id)
                          setExpanded((prev) => new Set([...prev, category.id]))
                        }}
                        isExpanded={isExp}
                        onToggleExpand={() => toggleExpand(category.id)}
                        hasChildren={children.length > 0}
                      />

                      {/* Children (shown when expanded) */}
                      {isExp && (
                        <div className="space-y-0.5">
                          {children.map((child) => (
                            <SortableCategory
                              key={child.id}
                              category={child}
                              isSelected={selectedCategoryId === child.id}
                              isEditing={editingId === child.id}
                              editName={editName}
                              indent
                              onSelect={() => {
                                setSelectedCategory(child.id)
                                syncWithCloud(false)
                              }}
                              onStartEdit={() => startEditing(child.id, child.name)}
                              onSaveEdit={() => saveEdit(child.id)}
                              onCancelEdit={cancelEdit}
                              onDelete={() => deleteCategory(child.id)}
                              onEditNameChange={setEditName}
                            />
                          ))}

                          {/* Inline add sub-category row */}
                          {addingSubFor === category.id && (
                            <InlineAddSub
                              parentColor={category.color}
                              onAdd={(name) => handleAddSub(category.id, name)}
                              onCancel={() => setAddingSubFor(null)}
                            />
                          )}
                        </div>
                      )}

                      {/* If collapsed but inline-add is active, show it anyway */}
                      {!isExp && addingSubFor === category.id && (
                        <InlineAddSub
                          parentColor={category.color}
                          onAdd={(name) => handleAddSub(category.id, name)}
                          onCancel={() => setAddingSubFor(null)}
                        />
                      )}
                    </div>
                  )
                })}
              </SortableContext>
            </DndContext>
          </div>
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-sidebar-border text-center">
        <p className="text-xs text-sidebar-foreground/60">Emanuel Cañoto</p>
        <p className="text-xs text-sidebar-foreground/40">Vicedirector</p>
      </div>
    </aside>
  )
}
