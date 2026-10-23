import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ArrowRight, BookOpen, Star, Brain, Clock, Layers, Search, Sparkles } from 'lucide-react'
import { useDashboard } from '../hooks/useData'
import { useSections } from '../hooks/useSections'
import { useAuth } from '../context/AuthContext'
import { NoteCard } from '../components/notes/NoteCard'
import { Button } from '../components/ui/Button'
import { Skeleton, EmptyState } from '../components/ui/index'
import { NoteEditor } from '../components/notes/NoteEditor'
import type { Note } from '../types'
import { api } from '../api'
import toast from 'react-hot-toast'

interface StatCardProps {
  icon: React.ElementType
  label: string
  value: string | number
  color: string
  onClick?: () => void
}

function StatCard({ icon: Icon, label, value, color, onClick }: StatCardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-card border border-border rounded-xl p-4 flex items-center gap-3 ${onClick ? 'cursor-pointer hover:border-primary/30 hover:shadow-sm transition-all duration-200' : ''}`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const { stats, isLoading } = useDashboard()
  const { sections, isLoading: sectionsLoading } = useSections()
  const navigate = useNavigate()
  const [showNoteEditor, setShowNoteEditor] = useState(false)
  const [notes, setNotes] = useState<Note[]>([])

  const handleFavorite = async (id: string) => {
    try {
      await api.notes.toggleFavorite(id)
    } catch { toast.error('Failed to update favorite') }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const firstName = user?.name?.split(' ')[0] || 'there'

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {getGreeting()}, {firstName} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your personal knowledge library
          </p>
        </div>
        <Button
          onClick={() => setShowNoteEditor(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          New Note
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {isLoading ? (
          [...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
        ) : (
          <>
            <StatCard
              icon={BookOpen} label="Total Notes"
              value={stats?.totalNotes ?? 0}
              color="bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400"
              onClick={() => navigate('/notes')}
            />
            <StatCard
              icon={Layers} label="My Sections"
              value={stats?.totalSections ?? 0}
              color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
            />
            <StatCard
              icon={Star} label="Favorites"
              value={stats?.favoriteCount ?? 0}
              color="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
              onClick={() => navigate('/favorites')}
            />
            <StatCard
              icon={Brain} label="Due for Review"
              value={stats?.dueForReviewCount ?? 0}
              color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
              onClick={() => navigate('/review')}
            />
          </>
        )}
      </div>

      {/* Sections */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-foreground">My Sections</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/sections/new')}
            leftIcon={<Plus className="w-3.5 h-3.5" />}>
            New Section
          </Button>
        </div>

        {sectionsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
        ) : sections.length === 0 ? (
          <EmptyState
            icon={<Layers className="w-8 h-8" />}
            title="No sections yet"
            description="Create sections to organize your knowledge by topic."
            action={
              <Button onClick={() => navigate('/sections/new')} leftIcon={<Plus className="w-4 h-4" />}>
                Create Your First Section
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {sections.map(section => (
              <div
                key={section.id}
                onClick={() => navigate(`/sections/${section.id}`)}
                className="group bg-card border border-border rounded-xl p-4 hover:border-primary/30 hover:shadow-sm transition-all duration-200 cursor-pointer relative overflow-hidden"
              >
                <div
                  className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl"
                  style={{ backgroundColor: section.accentColor }}
                />
                <div className="flex items-start justify-between">
                  <span className="text-2xl">{section.icon}</span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h3 className="text-sm font-semibold text-foreground mt-2 truncate">{section.name}</h3>
                {section.description && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{section.description}</p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  {section.noteCount ?? 0} note{section.noteCount !== 1 ? 's' : ''}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Two column: Recent + Favorites */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recently Added */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-base font-semibold text-foreground">Recently Added</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/recent')}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              View all
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
            </div>
          ) : stats?.recentNotes?.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground border border-dashed border-border rounded-xl">
              No notes yet — start capturing your first idea!
            </div>
          ) : (
            <div className="space-y-2">
              {stats?.recentNotes?.map(note => (
                <NoteCard key={note.id} note={note} onFavorite={handleFavorite} compact />
              ))}
            </div>
          )}
        </section>

        {/* Favorites */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" />
              <h2 className="text-base font-semibold text-foreground">Favorites</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/favorites')}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              View all
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
            </div>
          ) : stats?.favoriteNotes?.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground border border-dashed border-border rounded-xl">
              Star a note to pin it here for quick access.
            </div>
          ) : (
            <div className="space-y-2">
              {stats?.favoriteNotes?.map(note => (
                <NoteCard key={note.id} note={note} onFavorite={handleFavorite} compact />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Review Banner */}
      {(stats?.dueForReviewCount ?? 0) > 0 && (
        <div
          onClick={() => navigate('/review')}
          className="bg-gradient-to-r from-violet-600 to-violet-700 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:from-violet-700 hover:to-violet-800 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                {stats?.dueForReviewCount} note{stats!.dueForReviewCount !== 1 ? 's' : ''} due for review today
              </p>
              <p className="text-xs text-violet-200">Keep your knowledge sharp with spaced repetition</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-white" />
        </div>
      )}

      <NoteEditor
        open={showNoteEditor}
        onClose={() => setShowNoteEditor(false)}
        onSaved={() => window.location.reload()}
      />
    </div>
  )
}
