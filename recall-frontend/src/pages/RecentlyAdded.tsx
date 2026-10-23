import { useState } from 'react'
import { Clock, Plus } from 'lucide-react'
import { useNotes } from '../hooks/useNotes'
import { NoteList } from '../components/notes/NoteCard'
import { NoteEditor } from '../components/notes/NoteEditor'
import { ConfirmDialog } from '../components/ui/Dialog'
import { EmptyState } from '../components/ui/index'
import { Button } from '../components/ui/Button'
import type { Note } from '../types'
import toast from 'react-hot-toast'

export default function RecentlyAdded() {
  const { notes, isLoading, refetch, toggleFavorite, deleteNote } = useNotes({ sort: 'newest' })
  const [editNote, setEditNote] = useState<Note | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showNoteEditor, setShowNoteEditor] = useState(false)

  const handleFavorite = async (id: string) => {
    try { await toggleFavorite(id) } catch { toast.error('Failed to update') }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setIsDeleting(true)
    try { await deleteNote(deleteId); setDeleteId(null) }
    catch { toast.error('Failed to delete') }
    finally { setIsDeleting(false) }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Clock className="w-5 h-5 text-muted-foreground" /> Recently Added
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Your latest captures, newest first</p>
        </div>
        <Button size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => setShowNoteEditor(true)}>
          New Note
        </Button>
      </div>

      <NoteList
        notes={notes}
        isLoading={isLoading}
        onFavorite={handleFavorite}
        onEdit={note => setEditNote(note)}
        onDelete={id => setDeleteId(id)}
        emptyState={
          <EmptyState
            icon={<Clock className="w-8 h-8" />}
            title="No notes yet"
            description="Notes you create will appear here, ordered by when you added them."
            action={
              <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowNoteEditor(true)}>
                Create First Note
              </Button>
            }
          />
        }
      />

      <NoteEditor
        open={showNoteEditor || !!editNote}
        onClose={() => { setShowNoteEditor(false); setEditNote(null) }}
        onSaved={() => { setShowNoteEditor(false); setEditNote(null); refetch() }}
        editNote={editNote}
      />

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Note"
        description="This action cannot be undone."
        confirmLabel="Delete"
        isDestructive
        isLoading={isDeleting}
      />
    </div>
  )
}
