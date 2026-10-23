// ─── Core Entities ────────────────────────────────────────────────────────────

export interface User {
  id: string
  name: string
  email: string
  avatarUrl?: string
  createdAt: string
}

export interface Section {
  id: string
  userId: string
  name: string
  description?: string
  icon: string
  accentColor: string
  displayOrder: number
  noteCount?: number
  createdAt: string
  updatedAt: string
}

export type SourceType = 'book' | 'video' | 'article' | 'course' | 'personal' | 'other'

export interface Note {
  id: string
  userId: string
  sectionId: string
  sectionName?: string
  title: string
  content: string
  simpleMeaning?: string
  example?: string
  whyItMatters?: string
  sourceUrl?: string
  sourceType?: SourceType
  sourceTitle?: string
  timestamp?: string // video timestamp or page number
  tags: Tag[]
  relatedNoteIds: string[]
  isFavorite: boolean
  reviewEnabled: boolean
  createdAt: string
  updatedAt: string
}

export interface Tag {
  id: string
  userId: string
  name: string
  noteCount?: number
}

export interface RelatedNote {
  id: string
  noteId: string
  relatedNoteId: string
  createdAt: string
}

// ─── Review / Spaced Repetition ───────────────────────────────────────────────

export type ReviewRating = 'again' | 'hard' | 'good' | 'easy'

export interface ReviewSchedule {
  id: string
  userId: string
  noteId: string
  easeFactor: number   // SM-2: starts at 2.5
  interval: number     // days until next review
  repetitions: number
  nextReviewDate: string // ISO date
  lastReviewedAt?: string
}

export interface ReviewHistory {
  id: string
  userId: string
  noteId: string
  rating: ReviewRating
  reviewedAt: string
  previousInterval: number
  newInterval: number
}

// ─── API Request / Response Types ─────────────────────────────────────────────

export interface AuthCredentials {
  email: string
  password: string
}

export interface RegisterRequest extends AuthCredentials {
  name: string
}

export interface AuthResponse {
  token: string
  user: User
}

export interface CreateSectionRequest {
  name: string
  description?: string
  icon: string
  accentColor: string
}

export interface UpdateSectionRequest extends Partial<CreateSectionRequest> {
  displayOrder?: number
}

export interface CreateNoteRequest {
  sectionId: string
  title: string
  content: string
  simpleMeaning?: string
  example?: string
  whyItMatters?: string
  sourceUrl?: string
  sourceType?: SourceType
  sourceTitle?: string
  timestamp?: string
  tagIds?: string[]
  relatedNoteIds?: string[]
  isFavorite?: boolean
  reviewEnabled?: boolean
}

export interface UpdateNoteRequest extends Partial<CreateNoteRequest> {}

export interface SearchResult {
  noteId: string
  title: string
  snippet: string
  sectionId: string
  sectionName: string
  tags: Tag[]
  matchedIn: 'title' | 'content' | 'simpleMeaning' | 'example' | 'tags'
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface DashboardStats {
  totalNotes: number
  totalSections: number
  favoriteCount: number
  dueForReviewCount: number
  recentNotes: Note[]
  favoriteNotes: Note[]
}

export interface ReviewSession {
  due: Array<{ note: Note; schedule: ReviewSchedule }>
  overdue: Array<{ note: Note; schedule: ReviewSchedule }>
  upcoming: Array<{ note: Note; schedule: ReviewSchedule; daysUntil: number }>
}

// ─── UI Helper Types ───────────────────────────────────────────────────────────

export type Theme = 'light' | 'dark' | 'system'

export type SortOrder = 'newest' | 'oldest' | 'title_asc' | 'title_desc'

export interface NoteFilters {
  sectionId?: string
  tagIds?: string[]
  isFavorite?: boolean
  search?: string
  sort?: SortOrder
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error'
