import { useState, useEffect, useCallback } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Plus, Tag, Link, BookOpen, ChevronDown, ChevronUp, Star } from 'lucide-react'
import { Dialog } from '../ui/Dialog'
import { Button } from '../ui/Button'
import { Input, Textarea } from '../ui/Input'
import { Badge } from '../ui/index'
import { useSections } from '../../hooks/useSections'
import { useTags } from '../../hooks/useData'
import { api } from '../../api'
import type { Note, CreateNoteRequest, SourceType, Tag as TagType } from '../../types'
import { SOURCE_TYPE_LABELS } from '../../lib/utils'
import toast from 'react-hot-toast'

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  content: z.string().min(1, 'Content is required'),
  sectionId: z.string().min(1, 'Please select a section'),
  simpleMeaning: z.string().optional(),
  example: z.string().optional(),
  whyItMatters: z.string().optional(),
  sourceUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  sourceType: z.enum(['book', 'video', 'article', 'course', 'personal', 'other']).optional(),
  sourceTitle: z.string().optional(),
  timestamp: z.string().optional(),
  isFavorite: z.boolean().default(false),
  reviewEnabled: z.boolean().default(false),
})

type FormValues = z.infer<typeof schema>

interface NoteEditorProps {
  open: boolean
  onClose: () => void
  onSaved: (note: Note) => void
  initialSectionId?: string
  editNote?: Note | null
  quickMode?: boolean
}

export function NoteEditor({ open, onClose, onSaved, initialSectionId, editNote, quickMode }: NoteEditorProps) {
  const { sections } = useSections()
  const { tags: allTags, createTag } = useTags()
  const [selectedTags, setSelectedTags] = useState<TagType[]>([])
  const [newTagInput, setNewTagInput] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const { register, handleSubmit, control, reset, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      sectionId: initialSectionId || '',
      isFavorite: false,
      reviewEnabled: false,
    }
  })

  useEffect(() => {
    if (open && editNote) {
      reset({
        title: editNote.title,
        content: editNote.content,
        sectionId: editNote.sectionId,
        simpleMeaning: editNote.simpleMeaning || '',
        example: editNote.example || '',
        whyItMatters: editNote.whyItMatters || '',
        sourceUrl: editNote.sourceUrl || '',
        sourceType: editNote.sourceType,
        sourceTitle: editNote.sourceTitle || '',
        timestamp: editNote.timestamp || '',
        isFavorite: editNote.isFavorite,
        reviewEnabled: editNote.reviewEnabled,
      })
      setSelectedTags(editNote.tags || [])
      if (editNote.simpleMeaning || editNote.example || editNote.whyItMatters || editNote.sourceUrl) {
        setShowAdvanced(true)
      }
    } else if (open && !editNote) {
      reset({ sectionId: initialSectionId || sections[0]?.id || '', isFavorite: false, reviewEnabled: false })
      setSelectedTags([])
    }
  }, [open, editNote, initialSectionId, sections, reset])

  const handleAddTag = async (tagName: string) => {
    const name = tagName.trim()
    if (!name) return
    const existing = allTags.find(t => t.name.toLowerCase() === name.toLowerCase())
    const tag = existing || await createTag(name)
    if (!selectedTags.some(t => t.id === tag.id)) {
      setSelectedTags(prev => [...prev, tag])
    }
    setNewTagInput('')
  }

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); handleAddTag(newTagInput) }
    if (e.key === ',' ) { e.preventDefault(); handleAddTag(newTagInput) }
  }

  const removeTag = (id: string) => setSelectedTags(prev => prev.filter(t => t.id !== id))

  const onSubmit = async (values: FormValues) => {
    setIsSaving(true)
    try {
      const req: CreateNoteRequest = {
        ...values,
        sourceUrl: values.sourceUrl || undefined,
        tagIds: selectedTags.map(t => t.id),
        relatedNoteIds: editNote?.relatedNoteIds || [],
      }
      const note = editNote
        ? await api.notes.update(editNote.id, req)
        : await api.notes.create(req)
      onSaved(note)
      onClose()
    } catch (e: unknown) {
      toast.error((e as Error).message || 'Failed to save note')
    } finally {
      setIsSaving(false)
    }
  }

  const isFavorite = watch('isFavorite')
  const reviewEnabled = watch('reviewEnabled')

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size={quickMode ? 'md' : 'xl'}
      title={editNote ? 'Edit Note' : 'New Note'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-0">
        <div className={`p-6 space-y-4 ${quickMode ? '' : 'overflow-y-auto max-h-[calc(90vh-12rem)]'}`}>
          {/* Title */}
          <Input
            label="Title"
            placeholder="What's this concept called?"
            error={errors.title?.message}
            {...register('title')}
            autoFocus
          />

          {/* Content */}
          <Textarea
            label="Explanation"
            placeholder="Describe it in your own words. Markdown is supported."
            error={errors.content?.message}
            className="min-h-[140px] font-mono text-sm"
            {...register('content')}
          />

          {/* Section + Tags row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Section</label>
              <Controller
                name="sectionId"
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    className="h-9 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
                  >
                    <option value="">Select section…</option>
                    {sections.map(s => (
                      <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
                    ))}
                  </select>
                )}
              />
              {errors.sectionId && <p className="text-xs text-destructive">{errors.sectionId.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Tags</label>
              <div className="flex flex-wrap gap-1.5 min-h-[36px] px-2 py-1.5 rounded-lg border border-input bg-background focus-within:ring-2 focus-within:ring-ring transition-colors">
                {selectedTags.map(tag => (
                  <Badge key={tag.id} onRemove={() => removeTag(tag.id)}>
                    {tag.name}
                  </Badge>
                ))}
                <input
                  value={newTagInput}
                  onChange={e => setNewTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder={selectedTags.length === 0 ? 'Add tags…' : ''}
                  className="flex-1 min-w-[80px] text-xs outline-none bg-transparent text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>
          </div>

          {/* Quick options */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                className="w-4 h-4 rounded accent-primary"
                checked={isFavorite}
                onChange={e => setValue('isFavorite', e.target.checked)}
              />
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Star className="w-3.5 h-3.5" /> Favorite
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                className="w-4 h-4 rounded accent-primary"
                checked={reviewEnabled}
                onChange={e => setValue('reviewEnabled', e.target.checked)}
              />
              <span className="text-sm text-muted-foreground">Add to daily review</span>
            </label>
          </div>

          {/* Advanced toggle */}
          {!quickMode && (
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showAdvanced ? 'Hide' : 'Show'} additional fields
            </button>
          )}

          {showAdvanced && (
            <div className="space-y-4 pt-1 border-t border-border">
              <Textarea
                label="Simple Meaning (ELI5)"
                placeholder="Explain it to a 10-year-old…"
                {...register('simpleMeaning')}
              />
              <Textarea
                label="Example"
                placeholder="Give a concrete example…"
                {...register('example')}
              />
              <Textarea
                label="Why It Matters"
                placeholder="Why should you remember this?"
                {...register('whyItMatters')}
              />

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">Source Type</label>
                  <Controller
                    name="sourceType"
                    control={control}
                    render={({ field }) => (
                      <select
                        {...field}
                        className="h-9 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="">None</option>
                        {Object.entries(SOURCE_TYPE_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    )}
                  />
                </div>
                <Input
                  label="Source Title / Page / Timestamp"
                  placeholder="e.g. Chapter 5, 14:32"
                  {...register('timestamp')}
                />
              </div>

              <Input
                label="Source URL"
                placeholder="https://..."
                error={errors.sourceUrl?.message}
                leftIcon={<Link className="w-3.5 h-3.5" />}
                {...register('sourceUrl')}
              />
              <Input
                label="Source Title"
                placeholder="Name of book, video, article…"
                leftIcon={<BookOpen className="w-3.5 h-3.5" />}
                {...register('sourceTitle')}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-card">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSaving}>
            {editNote ? 'Save Changes' : 'Save Note'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
