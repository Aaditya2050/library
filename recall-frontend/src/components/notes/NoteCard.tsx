import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Star, Pencil, Trash2, ExternalLink, Tag, ArrowUpRight, Clock } from 'lucide-react'
import type { Note } from '../../types'
import { Badge, Skeleton, EmptyState } from '../ui/index'
import { Button } from '../ui/Button'
import { cn, formatRelativeDate, truncate, stripMarkdown, SOURCE_TYPE_LABELS } from '../../lib/utils'

interface NoteCardProps {
  note: Note
  onFavorite?: (id: string) => void
  onEdit?: (note: Note) => void
  onDelete?: (id: string) => void
  compact?: boolean
}

export function NoteCard({ note, onFavorite, onEdit, onDelete, compact }: NoteCardProps) {
  const navigate = useNavigate()
  const [isActionsVisible, setIsActionsVisible] = useState(false)

  const snippet = truncate(stripMarkdown(note.content), compact ? 80 : 140)

  return (
    <div
      className={cn(
        'group bg-card border border-border rounded-xl transition-all duration-200',
        'hover:border-primary/30 hover:shadow-sm cursor-pointer',
        compact ? 'p-3' : 'p-4'
      )}
      onClick={() => navigate(`/notes/${note.id}`)}
      onMouseEnter={() => setIsActionsVisible(true)}
      onMouseLeave={() => setIsActionsVisible(false)}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className={cn(
              'font-semibold text-foreground truncate group-hover:text-primary transition-colors',
              compact ? 'text-sm' : 'text-base'
            )}>
              {note.title}
            </h3>
            <div className={cn(
              'flex items-center gap-1 shrink-0 transition-opacity duration-150',
              isActionsVisible ? 'opacity-100' : 'opacity-0'
            )}>
              {onFavorite && (
                <button
                  onClick={e => { e.stopPropagation(); onFavorite(note.id) }}
                  className={cn(
                    'w-7 h-7 flex items-center justify-center rounded-lg transition-colors',
                    note.isFavorite
                      ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  )}
                  title={note.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Star className={cn('w-3.5 h-3.5', note.isFavorite && 'fill-current')} />
                </button>
              )}
              {onEdit && (
                <button
                  onClick={e => { e.stopPropagation(); onEdit(note) }}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  title="Edit"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={e => { e.stopPropagation(); onDelete(note.id) }}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {!compact && snippet && (
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed line-clamp-2">
              {snippet}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            {note.sectionName && (
              <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-md">
                {note.sectionName}
              </span>
            )}
            {note.tags?.slice(0, 3).map(tag => (
              <Badge key={tag.id} variant="outline" className="text-xs">{tag.name}</Badge>
            ))}
            {note.tags?.length > 3 && (
              <span className="text-xs text-muted-foreground">+{note.tags.length - 3}</span>
            )}
            {note.isFavorite && !isActionsVisible && (
              <Star className="w-3 h-3 text-amber-500 fill-current" />
            )}
          </div>

          {!compact && (
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" /> {formatRelativeDate(note.createdAt)}
              </span>
              {note.sourceType && (
                <span className="text-xs text-muted-foreground">
                  {SOURCE_TYPE_LABELS[note.sourceType] || note.sourceType}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface NoteListProps {
  notes: Note[]
  isLoading?: boolean
  onFavorite?: (id: string) => void
  onEdit?: (note: Note) => void
  onDelete?: (id: string) => void
  emptyState?: React.ReactNode
  compact?: boolean
}

export function NoteList({ notes, isLoading, onFavorite, onEdit, onDelete, emptyState, compact }: NoteListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4 space-y-2">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    )
  }

  if (notes.length === 0) {
    return emptyState ? <>{emptyState}</> : (
      <EmptyState
        icon={<Tag className="w-8 h-8" />}
        title="No notes yet"
        description="Start capturing what you learn."
      />
    )
  }

  return (
    <div className="space-y-3">
      {notes.map(note => (
        <NoteCard
          key={note.id}
          note={note}
          onFavorite={onFavorite}
          onEdit={onEdit}
          onDelete={onDelete}
          compact={compact}
        />
      ))}
    </div>
  )
}
