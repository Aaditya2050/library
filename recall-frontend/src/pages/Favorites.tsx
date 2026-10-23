import { useState } from 'react'
import { Star, BookOpen, Plus } from 'lucide-react'
import { useNotes } from '../hooks/useNotes'
import { NoteList } from '../components/notes/NoteCard'
import { NoteEditor } from '../components/notes/NoteEditor'
import { ConfirmDialog } from '../components/ui/Dialog'
import { EmptyState } from '../components/ui/index'
import { Button } from '../components/ui/Button'
import type { Note } from '../types'
import toast from 'react-hot-toast'

export default function Favorites() {
  const { notes, isLoading, refetch, toggleFavorite, deleteNote } = useNotes({ isFavorite: true })
  const [editNote, setEditNote] = useState<Note | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

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
            <Star className="w-5 h-5 text-amber-500 fill-current" /> Favorites
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {notes.length} starred note{notes.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <NoteList
        notes={notes}
        isLoading={isLoading}
        onFavorite={handleFavorite}
        onEdit={note => setEditNote(note)}
        onDelete={id => setDeleteId(id)}
        emptyState={
          <EmptyState
            icon={<Star className="w-8 h-8 text-amber-500" />}
            title="No favorites yet"
            description="Star your most important notes to find them here instantly."
          />
        }
      />

      <NoteEditor
        open={!!editNote}
        onClose={() => setEditNote(null)}
        onSaved={() => { setEditNote(null); refetch() }}
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
