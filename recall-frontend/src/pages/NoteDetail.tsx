import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Star, Pencil, Trash2, ExternalLink, Tag, Brain,
  BookOpen, Clock, Link, Copy, ChevronRight
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useNote } from '../hooks/useNotes'
import { NoteEditor } from '../components/notes/NoteEditor'
import { ConfirmDialog } from '../components/ui/Dialog'
import { Button } from '../components/ui/Button'
import { Badge, Skeleton } from '../components/ui/index'
import { api } from '../api'
import { formatFullDate, formatDate, SOURCE_TYPE_LABELS, cn } from '../lib/utils'
import toast from 'react-hot-toast'

export default function NoteDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { note, isLoading, error, refetch, setNote } = useNote(id)
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleFavorite = async () => {
    if (!note) return
    try {
      const updated = await api.notes.toggleFavorite(note.id)
      setNote(updated)
      toast.success(updated.isFavorite ? 'Added to favorites' : 'Removed from favorites')
    } catch { toast.error('Failed to update') }
  }

  const handleDelete = async () => {
    if (!note) return
    setIsDeleting(true)
    try {
      await api.notes.delete(note.id)
      toast.success('Note deleted')
      navigate(-1)
    } catch { toast.error('Failed to delete') }
    finally { setIsDeleting(false) }
  }

  const handleCopy = async () => {
    if (!note) return
    await navigator.clipboard.writeText(`# ${note.title}\n\n${note.content}`)
    toast.success('Copied to clipboard')
  }

  if (isLoading) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-32" />
        <div className="space-y-2 mt-6">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}
        </div>
      </div>
    )
  }

  if (error || !note) {
    return (
      <div className="p-6 max-w-3xl mx-auto text-center py-16">
        <p className="text-muted-foreground">Note not found.</p>
        <Button variant="ghost" onClick={() => navigate(-1)} className="mt-4" leftIcon={<ArrowLeft className="w-4 h-4" />}>
          Go back
        </Button>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl mx-auto animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
        <button onClick={() => navigate(-1)} className="hover:text-foreground transition-colors flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
        {note.sectionName && (
          <>
            <ChevronRight className="w-3 h-3" />
            <button
              onClick={() => navigate(`/sections/${note.sectionId}`)}
              className="hover:text-foreground transition-colors"
            >
              {note.sectionName}
            </button>
          </>
        )}
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground truncate max-w-[200px]">{note.title}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-foreground leading-tight flex-1">{note.title}</h1>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleFavorite}
            title={note.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Star className={cn('w-4 h-4', note.isFavorite ? 'text-amber-500 fill-current' : 'text-muted-foreground')} />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleCopy} title="Copy note">
            <Copy className="w-4 h-4 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setShowEdit(true)} title="Edit">
            <Pencil className="w-4 h-4 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setShowDelete(true)} title="Delete">
            <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
          </Button>
        </div>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-3 mb-6 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" /> Created {formatDate(note.createdAt)}
        </span>
        {note.updatedAt !== note.createdAt && (
          <span>Updated {formatDate(note.updatedAt)}</span>
        )}
        {note.sourceType && (
          <span className="flex items-center gap-1">
            <BookOpen className="w-3 h-3" /> {SOURCE_TYPE_LABELS[note.sourceType]}
          </span>
        )}
        {note.sourceTitle && <span>{note.sourceTitle}</span>}
        {note.timestamp && <span>@ {note.timestamp}</span>}
        {note.sourceUrl && (
          <a
            href={note.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="flex items-center gap-1 text-primary hover:underline"
          >
            <Link className="w-3 h-3" /> Source
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
        {note.reviewEnabled && (
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
            <Brain className="w-3 h-3" /> In review
          </span>
        )}
      </div>

      {/* Tags */}
      {note.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-6">
          {note.tags.map(tag => (
            <Badge key={tag.id} variant="secondary">
              <Tag className="w-3 h-3" /> {tag.name}
            </Badge>
          ))}
        </div>
      )}

      {/* Main content */}
      <div className="bg-card border border-border rounded-xl p-6 mb-4">
        <div className="prose-recall">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {note.content}
          </ReactMarkdown>
        </div>
      </div>

      {/* Optional fields */}
      {(note.simpleMeaning || note.example || note.whyItMatters) && (
        <div className="space-y-3">
          {note.simpleMeaning && (
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Simple Meaning
              </p>
              <p className="text-sm text-foreground leading-relaxed">{note.simpleMeaning}</p>
            </div>
          )}
          {note.example && (
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Example
              </p>
              <p className="text-sm text-foreground leading-relaxed">{note.example}</p>
            </div>
          )}
          {note.whyItMatters && (
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Why It Matters
              </p>
              <p className="text-sm text-foreground leading-relaxed">{note.whyItMatters}</p>
            </div>
          )}
        </div>
      )}

      {/* Dialogs */}
      <NoteEditor
        open={showEdit}
        onClose={() => setShowEdit(false)}
        onSaved={() => { setShowEdit(false); refetch() }}
        editNote={note}
      />

      <ConfirmDialog
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="Delete Note"
        description={`Delete "${note.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        isDestructive
        isLoading={isDeleting}
      />
    </div>
  )
}
