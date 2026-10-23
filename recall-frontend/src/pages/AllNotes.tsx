import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Plus, SlidersHorizontal, Search } from 'lucide-react'
import { useNotes } from '../hooks/useNotes'
import { NoteList } from '../components/notes/NoteCard'
import { NoteEditor } from '../components/notes/NoteEditor'
import { ConfirmDialog } from '../components/ui/Dialog'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/index'
import { api } from '../api'
import type { Note, SortOrder } from '../types'
import toast from 'react-hot-toast'

const SORT_OPTIONS: { value: SortOrder; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'title_asc', label: 'Title A–Z' },
  { value: 'title_desc', label: 'Title Z–A' },
]

export default function AllNotes() {
  const [sort, setSort] = useState<SortOrder>('newest')
  const [editNote, setEditNote] = useState<Note | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const { notes, total, isLoading, refetch, toggleFavorite, deleteNote } = useNotes({ sort })

  const handleFavorite = async (id: string) => {
    try { await toggleFavorite(id) } catch { toast.error('Failed to update') }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setIsDeleting(true)
    try {
      await deleteNote(deleteId)
      setDeleteId(null)
    } catch { toast.error('Failed to delete note') }
    finally { setIsDeleting(false) }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-muted-foreground" />
            All Notes
          </h1>
          {!isLoading && (
            <p className="text-sm text-muted-foreground mt-0.5">{total} note{total !== 1 ? 's' : ''}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
            <select
              value={sort}
              onChange={e => setSort(e.target.value as SortOrder)}
              className="h-8 text-xs rounded-lg border border-input bg-background px-2 focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <Button size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => setEditNote({} as Note)}>
            New Note
          </Button>
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
            icon={<BookOpen className="w-8 h-8" />}
            title="No notes yet"
            description="Start capturing what you learn, read, and discover."
            action={
              <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setEditNote({} as Note)}>
                Create Your First Note
              </Button>
            }
          />
        }
      />

      <NoteEditor
        open={!!editNote}
        onClose={() => setEditNote(null)}
        onSaved={() => { setEditNote(null); refetch() }}
        editNote={editNote?.id ? editNote : undefined}
      />

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Note"
        description="Are you sure you want to delete this note? This action cannot be undone."
        confirmLabel="Delete"
        isDestructive
        isLoading={isDeleting}
      />
    </div>
  )
}
