import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Brain, Plus, Layers } from 'lucide-react'
import { Dialog } from '../ui/Dialog'
import { Input, Textarea } from '../ui/Input'
import { Button } from '../ui/Button'
import { useSections } from '../../hooks/useSections'
import type { Section } from '../../types'
import { SECTION_ICONS, ACCENT_COLORS } from '../../lib/utils'
import { cn } from '../../lib/utils'
import toast from 'react-hot-toast'

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().optional(),
  icon: z.string().min(1, 'Please select an icon'),
  accentColor: z.string().min(1, 'Please select a color'),
})

type FormValues = z.infer<typeof schema>

interface SectionDialogProps {
  open: boolean
  onClose: () => void
  onSaved: (section: Section) => void
  editSection?: Section | null
}

export function SectionDialog({ open, onClose, onSaved, editSection }: SectionDialogProps) {
  const { createSection, updateSection } = useSections()
  const [isSaving, setIsSaving] = useState(false)

  const { register, handleSubmit, watch, setValue, formState: { errors }, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: editSection ? {
      name: editSection.name,
      description: editSection.description || '',
      icon: editSection.icon,
      accentColor: editSection.accentColor,
    } : {
      icon: SECTION_ICONS[0],
      accentColor: ACCENT_COLORS[0].value,
    }
  })

  const selectedIcon = watch('icon')
  const selectedColor = watch('accentColor')

  const onSubmit = async (values: FormValues) => {
    setIsSaving(true)
    try {
      const section = editSection
        ? await updateSection(editSection.id, values)
        : await createSection(values)
      onSaved(section)
      reset()
    } catch (e: unknown) {
      toast.error((e as Error).message || 'Failed to save section')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editSection ? 'Edit Section' : 'Create Section'}
      description={editSection ? 'Update your section details.' : 'Organize your knowledge by creating a new section.'}
      size="sm"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
        <Input
          label="Section Name"
          placeholder="e.g. Finance & Markets"
          error={errors.name?.message}
          autoFocus
          {...register('name')}
        />

        <Textarea
          label="Description (optional)"
          placeholder="What will you store here?"
          {...register('description')}
        />

        {/* Icon picker */}
        <div>
          <label className="text-sm font-medium text-foreground block mb-2">Icon</label>
          <div className="flex flex-wrap gap-1.5 p-2 rounded-lg bg-secondary max-h-32 overflow-y-auto">
            {SECTION_ICONS.map(icon => (
              <button
                key={icon}
                type="button"
                onClick={() => setValue('icon', icon)}
                className={cn(
                  'w-9 h-9 flex items-center justify-center rounded-lg text-lg transition-all',
                  selectedIcon === icon
                    ? 'bg-primary ring-2 ring-primary ring-offset-1 scale-105'
                    : 'hover:bg-background'
                )}
              >
                {icon}
              </button>
            ))}
          </div>
          {errors.icon && <p className="text-xs text-destructive mt-1">{errors.icon.message}</p>}
        </div>

        {/* Color picker */}
        <div>
          <label className="text-sm font-medium text-foreground block mb-2">Accent Color</label>
          <div className="flex flex-wrap gap-2">
            {ACCENT_COLORS.map(color => (
              <button
                key={color.value}
                type="button"
                onClick={() => setValue('accentColor', color.value)}
                className={cn(
                  'w-7 h-7 rounded-full transition-all',
                  selectedColor === color.value && 'ring-2 ring-offset-2 ring-foreground scale-110'
                )}
                style={{ backgroundColor: color.value }}
                title={color.name}
              />
            ))}
          </div>
          {errors.accentColor && <p className="text-xs text-destructive mt-1">{errors.accentColor.message}</p>}
        </div>

        {/* Preview */}
        <div className="rounded-xl border border-border p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
            style={{ backgroundColor: selectedColor + '20' }}>
            {selectedIcon}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{watch('name') || 'Section Name'}</p>
            <p className="text-xs text-muted-foreground">Preview</p>
          </div>
          <div className="ml-auto h-full w-1 rounded-full" style={{ backgroundColor: selectedColor }} />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={isSaving}>
            {editSection ? 'Save Changes' : 'Create Section'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
