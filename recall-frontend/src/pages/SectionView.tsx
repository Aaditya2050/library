import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Pencil, Trash2, MoreHorizontal, FolderOpen } from 'lucide-react'
import { api } from '../api'
import type { Section, Note } from '../types'
import { NoteList } from '../components/notes/NoteCard'
import { NoteEditor } from '../components/notes/NoteEditor'
import { ConfirmDialog } from '../components/ui/Dialog'
import { SectionDialog } from '../components/sections/SectionDialog'
import { Button } from '../components/ui/Button'
import { EmptyState, Skeleton } from '../components/ui/index'
import toast from 'react-hot-toast'

export default function SectionView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [section, setSection] = useState<Section | null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showMenu, setShowMenu] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showNoteEditor, setShowNoteEditor] = useState(false)
  const [editNote, setEditNote] = useState<Note | null>(null)
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null)

  const fetchData = async () => {
    if (!id) return
    setIsLoading(true)
    try {
      const [sec, notesResult] = await Promise.all([
        api.sections.get(id),
        api.notes.list({ sectionId: id }),
      ])
      setSection(sec)
      setNotes(notesResult.data)
    } catch {
      toast.error('Section not found')
      navigate('/')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [id])

  const handleDeleteSection = async () => {
    if (!section) return
    setIsDeleting(true)
    try {
      await api.sections.delete(section.id)
      toast.success('Section deleted')
      navigate('/')
    } catch (e: unknown) {
      toast.error((e as Error).message || 'Failed to delete')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleFavorite = async (noteId: string) => {
    const updated = await api.notes.toggleFavorite(noteId)
    setNotes(prev => prev.map(n => n.id === noteId ? updated : n))
    toast.success(updated.isFavorite ? 'Added to favorites' : 'Removed from favorites')
  }

  const handleDeleteNote = async () => {
    if (!deleteNoteId) return
    await api.notes.delete(deleteNoteId)
    setNotes(prev => prev.filter(n => n.id !== deleteNoteId))
    setDeleteNoteId(null)
    toast.success('Note deleted')
  }

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
        <div className="space-y-3 mt-6">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      </div>
    )
  }

  if (!section) return null

  return (
    <div className="p-6 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-start gap-3">
          <button
            onClick={() => navigate(-1)}
            className="mt-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{section.icon}</span>
              <h1 className="text-xl font-bold text-foreground">{section.name}</h1>
            </div>
            {section.description && (
              <p className="text-sm text-muted-foreground mt-1">{section.description}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {notes.length} note{notes.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 relative">
          <Button size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => setShowNoteEditor(true)}>
            New Note
          </Button>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-20 animate-scale-in">
              <button
                onClick={() => { setShowEdit(true); setShowMenu(false) }}
                className="w-full px-3 py-2 text-sm text-left flex items-center gap-2 hover:bg-secondary text-foreground transition-colors"
              >
                <Pencil className="w-4 h-4" /> Edit Section
              </button>
              <button
                onClick={() => { setShowDelete(true); setShowMenu(false) }}
                className="w-full px-3 py-2 text-sm text-left flex items-center gap-2 hover:bg-destructive/10 text-destructive transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Delete Section
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Accent bar */}
      <div
        className="h-1 rounded-full mb-6"
        style={{ backgroundColor: section.accentColor, opacity: 0.6 }}
      />

      <NoteList
        notes={notes}
        onFavorite={handleFavorite}
        onEdit={note => setEditNote(note)}
        onDelete={id => setDeleteNoteId(id)}
        emptyState={
          <EmptyState
            icon={<FolderOpen className="w-8 h-8" />}
            title="No notes in this section"
            description="Start adding notes to build your knowledge base."
            action={
              <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowNoteEditor(true)}>
                Add First Note
              </Button>
            }
          />
        }
      />

      {/* Dialogs */}
      {showEdit && section && (
        <SectionDialog
          open={showEdit}
          onClose={() => setShowEdit(false)}
          onSaved={updated => { setSection(updated); setShowEdit(false) }}
          editSection={section}
        />
      )}

      <ConfirmDialog
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDeleteSection}
        title="Delete Section"
        description={`Delete "${section.name}" and all ${notes.length} note${notes.length !== 1 ? 's' : ''} inside it? This cannot be undone.`}
        confirmLabel="Delete Section"
        isDestructive
        isLoading={isDeleting}
      />

      <NoteEditor
        open={showNoteEditor || !!editNote}
        onClose={() => { setShowNoteEditor(false); setEditNote(null) }}
        onSaved={() => { setShowNoteEditor(false); setEditNote(null); fetchData() }}
        initialSectionId={section.id}
        editNote={editNote}
      />

      <ConfirmDialog
        open={!!deleteNoteId}
        onClose={() => setDeleteNoteId(null)}
        onConfirm={handleDeleteNote}
        title="Delete Note"
        description="This action cannot be undone."
        confirmLabel="Delete"
        isDestructive
      />
    </div>
  )
}
