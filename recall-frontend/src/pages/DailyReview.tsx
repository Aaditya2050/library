import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Brain, ChevronRight, Eye, EyeOff, CheckCircle2, AlertCircle, Calendar } from 'lucide-react'
import { useReview } from '../hooks/useData'
import { Button } from '../components/ui/Button'
import { EmptyState, Skeleton, Badge } from '../components/ui/index'
import { api } from '../api'
import type { Note, ReviewSchedule, ReviewRating } from '../types'
import { formatDate, cn } from '../lib/utils'
import toast from 'react-hot-toast'

interface ReviewCardProps {
  note: Note
  schedule: ReviewSchedule
  onRate: (noteId: string, rating: ReviewRating) => Promise<void>
  onSkip: () => void
}

function ReviewCard({ note, schedule, onRate, onSkip }: ReviewCardProps) {
  const [revealed, setRevealed] = useState(false)
  const [isRating, setIsRating] = useState(false)
  const navigate = useNavigate()

  const handleRate = async (rating: ReviewRating) => {
    setIsRating(true)
    try { await onRate(note.id, rating) }
    finally { setIsRating(false) }
  }

  const ratings: { label: string; rating: ReviewRating; color: string; days: string }[] = [
    { label: 'Again', rating: 'again', color: 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400', days: '<1 day' },
    { label: 'Hard', rating: 'hard', color: 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400', days: '~1 day' },
    { label: 'Good', rating: 'good', color: 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400', days: `~${schedule.interval > 1 ? Math.round(schedule.interval * 2.5) : 4} days` },
    { label: 'Easy', rating: 'easy', color: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400', days: `~${schedule.interval > 1 ? Math.round(schedule.interval * 3) : 7} days` },
  ]

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
      {/* Question */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Recall</p>
            <h2 className="text-xl font-bold text-foreground">{note.title}</h2>
            {note.sectionName && (
              <p className="text-sm text-muted-foreground mt-1">{note.sectionName}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Interval: {schedule.interval}d</span>
            <button
              onClick={() => navigate(`/notes/${note.id}`)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {note.simpleMeaning && !revealed && (
          <div className="bg-secondary rounded-lg p-3 mb-4">
            <p className="text-sm text-muted-foreground italic">"{note.simpleMeaning}"</p>
          </div>
        )}
      </div>

      {/* Reveal button or answer */}
      {!revealed ? (
        <div className="px-6 pb-6">
          <button
            onClick={() => setRevealed(true)}
            className="w-full h-12 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors text-sm font-medium"
            id="reveal-answer-btn"
          >
            <Eye className="w-4 h-4" /> Reveal Answer
          </button>
        </div>
      ) : (
        <>
          <div className="border-t border-border px-6 py-4 bg-secondary/30">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Answer</p>
            <div className="prose-recall text-sm space-y-2">
              <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                {note.content.slice(0, 600)}{note.content.length > 600 ? '…' : ''}
              </p>
              {note.example && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground font-medium mb-1">Example:</p>
                  <p className="text-sm text-foreground">{note.example}</p>
                </div>
              )}
            </div>
          </div>

          {/* Rating */}
          <div className="px-6 py-4 border-t border-border">
            <p className="text-xs text-muted-foreground mb-3">How well did you remember this?</p>
            <div className="grid grid-cols-4 gap-2">
              {ratings.map(r => (
                <button
                  key={r.rating}
                  onClick={() => handleRate(r.rating)}
                  disabled={isRating}
                  className={cn(
                    'flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl font-medium text-sm transition-all',
                    r.color,
                    isRating && 'opacity-50 cursor-not-allowed'
                  )}
                  id={`rate-${r.rating}-btn`}
                >
                  <span>{r.label}</span>
                  <span className="text-xs opacity-70">{r.days}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="px-6 pb-4 flex justify-end">
        <button onClick={onSkip} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          Skip for now
        </button>
      </div>
    </div>
  )
}

export default function DailyReview() {
  const { session, isLoading, submitReview, refetch } = useReview()
  const [currentIdx, setCurrentIdx] = useState(0)
  const [completedToday, setCompletedToday] = useState(0)
  const navigate = useNavigate()

  const allDue = session ? [...session.due, ...session.overdue] : []
  const currentItem = allDue[currentIdx]

  const handleRate = async (noteId: string, rating: ReviewRating) => {
    await submitReview(noteId, rating)
    setCompletedToday(prev => prev + 1)
    setCurrentIdx(prev => prev + 1)
  }

  const handleSkip = () => {
    setCurrentIdx(prev => prev + 1)
  }

  if (isLoading) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    )
  }

  const isDone = currentIdx >= allDue.length

  return (
    <div className="p-6 max-w-2xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" /> Daily Review
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Keep your knowledge sharp with spaced repetition
          </p>
        </div>
        {completedToday > 0 && (
          <Badge variant="success" className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> {completedToday} done today
          </Badge>
        )}
      </div>

      {/* Progress */}
      {allDue.length > 0 && !isDone && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
            <span>{currentIdx} / {allDue.length} reviewed</span>
            <span>{allDue.length - currentIdx} remaining</span>
          </div>
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${(currentIdx / allDue.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Session complete */}
      {isDone && allDue.length > 0 && (
        <div className="text-center py-12 bg-card border border-border rounded-2xl">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-lg font-bold text-foreground mb-1">Session Complete!</h2>
          <p className="text-sm text-muted-foreground mb-6">
            You reviewed {completedToday} note{completedToday !== 1 ? 's' : ''} today. Come back tomorrow for more.
          </p>
          <Button onClick={() => navigate('/')}>Back to Dashboard</Button>
        </div>
      )}

      {/* No items due */}
      {allDue.length === 0 && (
        <EmptyState
          icon={<CheckCircle2 className="w-8 h-8 text-emerald-500" />}
          title="All caught up!"
          description="No notes are due for review right now. Come back later."
          action={<Button onClick={refetch} variant="outline">Refresh</Button>}
        />
      )}

      {/* Current review card */}
      {!isDone && currentItem && (
        <ReviewCard
          note={currentItem.note}
          schedule={currentItem.schedule}
          onRate={handleRate}
          onSkip={handleSkip}
        />
      )}

      {/* Upcoming */}
      {session?.upcoming && session.upcoming.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" /> Coming Up
          </h3>
          <div className="space-y-2">
            {session.upcoming.slice(0, 5).map(({ note, daysUntil }) => (
              <div key={note.id} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-secondary transition-colors cursor-pointer"
                onClick={() => navigate(`/notes/${note.id}`)}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{note.title}</p>
                  <p className="text-xs text-muted-foreground">{note.sectionName}</p>
                </div>
                <Badge variant="secondary">
                  in {daysUntil} day{daysUntil !== 1 ? 's' : ''}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
