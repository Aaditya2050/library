import {
  type Note,
  type Section,
  type Tag,
  type User,
  type ReviewSchedule,
  type ReviewHistory,
  type ReviewRating,
  type CreateNoteRequest,
  type UpdateNoteRequest,
  type CreateSectionRequest,
  type UpdateSectionRequest,
  type SearchResult,
  type DashboardStats,
  type ReviewSession,
  type RegisterRequest,
  type AuthResponse,
} from '../types'
import { generateId } from '../lib/utils'

// ─── SM-2 Spaced Repetition Algorithm ─────────────────────────────────────────

function applySM2(
  schedule: ReviewSchedule,
  rating: ReviewRating
): ReviewSchedule {
  const ratingMap: Record<ReviewRating, number> = {
    again: 0,
    hard: 1,
    good: 3,
    easy: 5,
  }
  const q = ratingMap[rating]
  const now = new Date()

  let { easeFactor, interval, repetitions } = schedule

  if (q < 3) {
    repetitions = 0
    interval = 1
  } else {
    if (repetitions === 0) interval = 1
    else if (repetitions === 1) interval = 6
    else interval = Math.round(interval * easeFactor)
    repetitions += 1
  }

  easeFactor = Math.max(1.3, easeFactor + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))

  const nextReview = new Date(now)
  nextReview.setDate(nextReview.getDate() + interval)

  return {
    ...schedule,
    easeFactor,
    interval,
    repetitions,
    nextReviewDate: nextReview.toISOString().split('T')[0],
    lastReviewedAt: now.toISOString(),
  }
}

// ─── Storage Keys ──────────────────────────────────────────────────────────────

const KEYS = {
  users: 'recall_users',
  currentToken: 'recall_token',
  currentUserId: 'recall_uid',
  sections: 'recall_sections',
  notes: 'recall_notes',
  tags: 'recall_tags',
  reviewSchedules: 'recall_review_schedules',
  reviewHistory: 'recall_review_history',
}

// ─── Storage Helpers ───────────────────────────────────────────────────────────

function get<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]') as T[]
  } catch {
    return []
  }
}

function set<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data))
}

function now(): string {
  return new Date().toISOString()
}

async function delay(ms = 120): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ─── Seed Data ─────────────────────────────────────────────────────────────────

function seedDemoData(userId: string): void {
  const sections: Section[] = [
    {
      id: generateId(), userId, name: 'Finance & Markets', description: 'Economics, trading, investments',
      icon: '📈', accentColor: '#059669', displayOrder: 0, createdAt: now(), updatedAt: now(),
    },
    {
      id: generateId(), userId, name: 'Study & Coding', description: 'Programming concepts, algorithms, tools',
      icon: '💻', accentColor: '#7c3aed', displayOrder: 1, createdAt: now(), updatedAt: now(),
    },
    {
      id: generateId(), userId, name: 'Books & Ideas', description: 'Book notes and insights',
      icon: '📚', accentColor: '#2563eb', displayOrder: 2, createdAt: now(), updatedAt: now(),
    },
    {
      id: generateId(), userId, name: 'Music', description: 'Theory, practice, discoveries',
      icon: '🎵', accentColor: '#e11d48', displayOrder: 3, createdAt: now(), updatedAt: now(),
    },
  ]

  const tags: Tag[] = [
    { id: generateId(), userId, name: 'Java' },
    { id: generateId(), userId, name: 'OOP' },
    { id: generateId(), userId, name: 'Macroeconomics' },
    { id: generateId(), userId, name: 'Trading' },
    { id: generateId(), userId, name: 'Guitar' },
    { id: generateId(), userId, name: 'Revision' },
  ]

  const [finSection, codeSection, bookSection] = sections
  const [javaTag, oopTag, macroTag, tradingTag] = tags

  const twoWeeksAgo = new Date(); twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
  const oneWeekAgo = new Date(); oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1)

  const notes: Note[] = [
    {
      id: generateId(), userId, sectionId: finSection.id, title: 'US 10-Year Treasury Yield',
      content: `## What is it?\n\nThe **10-Year Treasury Yield** (TNX) is the return on investment for US government bonds maturing in 10 years.\n\nIt serves as a benchmark for interest rates across the economy — mortgages, corporate bonds, and loans are all priced relative to it.\n\n## Why it moves\n\n- **Fed policy**: Rate hikes push yields up\n- **Inflation expectations**: Higher inflation = higher yields\n- **Risk appetite**: Flight to safety (recession fears) drives yields down as investors buy bonds\n\n## The yield-price relationship\n\nBond prices and yields move **inversely**. When demand for bonds rises, prices go up and yields fall.`,
      simpleMeaning: 'The interest rate the US government pays to borrow money for 10 years.',
      example: 'If the 10-year yield is 4.5%, the US Treasury will pay $4,500/year on a $100,000 bond.',
      whyItMatters: 'It\'s the global risk-free rate that prices almost every asset class.',
      sourceType: 'article', sourceTitle: 'Federal Reserve Education',
      tags: [macroTag, tradingTag], relatedNoteIds: [], isFavorite: true, reviewEnabled: true,
      createdAt: twoWeeksAgo.toISOString(), updatedAt: oneWeekAgo.toISOString(),
    },
    {
      id: generateId(), userId, sectionId: codeSection.id, title: 'Java: Object References',
      content: `## References vs Values\n\nIn Java, **primitive types** (int, double, boolean) are stored by value.\n**Objects** are stored by reference — the variable holds a pointer to the object in heap memory.\n\n\`\`\`java\nString a = new String("hello");\nString b = a; // b points to the same object\nb = b.toUpperCase(); // Strings are immutable — creates new object\nSystem.out.println(a); // "hello" unchanged\n\`\`\`\n\n## Key insight\n\nWhen you pass an object to a method, Java passes the **reference by value**. The method gets a copy of the pointer, not the object itself. This means:\n- You can mutate the object's fields via the reference\n- You cannot reassign the original variable from inside the method`,
      simpleMeaning: 'Variables holding objects store memory addresses, not the objects themselves.',
      example: 'Two Dog variables can point to the same Dog object. Changing one changes the other.',
      sourceType: 'course', sourceTitle: 'Java Masterclass - Udemy',
      tags: [javaTag, oopTag], relatedNoteIds: [], isFavorite: true, reviewEnabled: true,
      createdAt: oneWeekAgo.toISOString(), updatedAt: oneWeekAgo.toISOString(),
    },
    {
      id: generateId(), userId, sectionId: bookSection.id, title: 'Compound Interest as Time × Rate',
      content: `## The Formula\n\n**A = P(1 + r/n)^(nt)**\n\nWhere:\n- A = final amount\n- P = principal\n- r = annual interest rate\n- n = compounding periods per year\n- t = time in years\n\n## The key insight\n\nEinstein (apocryphally) called compound interest *the eighth wonder of the world*. The power comes from interest earning interest — a non-linear, exponential growth curve.\n\nAt 10% annual return:\n- 10 years: ×2.6\n- 20 years: ×6.7\n- 30 years: ×17.4`,
      simpleMeaning: 'Returns grow exponentially because you earn returns on your returns.',
      sourceType: 'book', sourceTitle: 'The Psychology of Money — Morgan Housel',
      tags: [macroTag], relatedNoteIds: [], isFavorite: false, reviewEnabled: true,
      createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString(),
    },
  ]

  const schedules: ReviewSchedule[] = notes
    .filter(n => n.reviewEnabled)
    .map(n => ({
      id: generateId(), userId, noteId: n.id,
      easeFactor: 2.5, interval: 1, repetitions: 0,
      nextReviewDate: new Date().toISOString().split('T')[0],
      lastReviewedAt: undefined,
    }))

  const existingSections = get<Section>(KEYS.sections).filter(s => s.userId !== userId)
  const existingNotes = get<Note>(KEYS.notes).filter(n => n.userId !== userId)
  const existingTags = get<Tag>(KEYS.tags).filter(t => t.userId !== userId)
  const existingSchedules = get<ReviewSchedule>(KEYS.reviewSchedules).filter(s => s.userId !== userId)

  set(KEYS.sections, [...existingSections, ...sections])
  set(KEYS.notes, [...existingNotes, ...notes])
  set(KEYS.tags, [...existingTags, ...tags])
  set(KEYS.reviewSchedules, [...existingSchedules, ...schedules])
}

// ─── Mock Service ──────────────────────────────────────────────────────────────

export const mockService = {
  // ── Auth ──────────────────────────────────────────────────────────────────

  async register(req: RegisterRequest): Promise<AuthResponse> {
    await delay()
    const users = get<User & { password: string }>(KEYS.users)
    if (users.find(u => u.email === req.email)) {
      throw new Error('An account with this email already exists.')
    }
    const user: User = { id: generateId(), name: req.name, email: req.email, createdAt: now() }
    set(KEYS.users, [...users, { ...user, password: req.password }])
    const token = btoa(JSON.stringify({ userId: user.id, exp: Date.now() + 86400000 * 7 }))
    localStorage.setItem(KEYS.currentToken, token)
    localStorage.setItem(KEYS.currentUserId, user.id)
    seedDemoData(user.id)
    return { token, user }
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    await delay()
    const users = get<User & { password: string }>(KEYS.users)
    const found = users.find(u => u.email === email && u.password === password)
    if (!found) throw new Error('Invalid email or password.')
    const { password: _pw, ...user } = found
    const token = btoa(JSON.stringify({ userId: user.id, exp: Date.now() + 86400000 * 7 }))
    localStorage.setItem(KEYS.currentToken, token)
    localStorage.setItem(KEYS.currentUserId, user.id)
    return { token, user }
  },

  logout(): void {
    localStorage.removeItem(KEYS.currentToken)
    localStorage.removeItem(KEYS.currentUserId)
  },

  getCurrentUser(): User | null {
    const uid = localStorage.getItem(KEYS.currentUserId)
    const token = localStorage.getItem(KEYS.currentToken)
    if (!uid || !token) return null
    try {
      const payload = JSON.parse(atob(token))
      if (payload.exp < Date.now()) {
        this.logout()
        return null
      }
    } catch { return null }
    const users = get<User & { password: string }>(KEYS.users)
    const found = users.find(u => u.id === uid)
    if (!found) return null
    const { password: _pw, ...user } = found
    return user
  },

  getToken(): string | null {
    return localStorage.getItem(KEYS.currentToken)
  },

  // ── Sections ──────────────────────────────────────────────────────────────

  async getSections(): Promise<Section[]> {
    await delay()
    const uid = localStorage.getItem(KEYS.currentUserId)!
    const notes = get<Note>(KEYS.notes)
    return get<Section>(KEYS.sections)
      .filter(s => s.userId === uid)
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map(s => ({
        ...s,
        noteCount: notes.filter(n => n.sectionId === s.id && n.userId === uid).length,
      }))
  },

  async getSection(id: string): Promise<Section> {
    await delay()
    const uid = localStorage.getItem(KEYS.currentUserId)!
    const sections = get<Section>(KEYS.sections)
    const found = sections.find(s => s.id === id && s.userId === uid)
    if (!found) throw new Error('Section not found.')
    return found
  },

  async createSection(req: CreateSectionRequest): Promise<Section> {
    await delay()
    const uid = localStorage.getItem(KEYS.currentUserId)!
    const sections = get<Section>(KEYS.sections)
    const maxOrder = sections.filter(s => s.userId === uid).reduce((m, s) => Math.max(m, s.displayOrder), -1)
    const section: Section = {
      id: generateId(), userId: uid, ...req,
      displayOrder: maxOrder + 1, createdAt: now(), updatedAt: now(),
    }
    set(KEYS.sections, [...sections, section])
    return section
  },

  async updateSection(id: string, req: UpdateSectionRequest): Promise<Section> {
    await delay()
    const uid = localStorage.getItem(KEYS.currentUserId)!
    const sections = get<Section>(KEYS.sections)
    const idx = sections.findIndex(s => s.id === id && s.userId === uid)
    if (idx === -1) throw new Error('Section not found.')
    const updated = { ...sections[idx], ...req, updatedAt: now() }
    sections[idx] = updated
    set(KEYS.sections, sections)
    return updated
  },

  async deleteSection(id: string): Promise<void> {
    await delay()
    const uid = localStorage.getItem(KEYS.currentUserId)!
    const sections = get<Section>(KEYS.sections)
    const found = sections.find(s => s.id === id && s.userId === uid)
    if (!found) throw new Error('Section not found.')
    // Move notes to no section by keeping them (in real app, move or prompt)
    set(KEYS.sections, sections.filter(s => !(s.id === id && s.userId === uid)))
    // Remove notes in this section too (after confirmation dialog)
    const notes = get<Note>(KEYS.notes)
    set(KEYS.notes, notes.filter(n => !(n.sectionId === id && n.userId === uid)))
  },

  // ── Notes ─────────────────────────────────────────────────────────────────

  async getNotes(filters?: { sectionId?: string; isFavorite?: boolean; sort?: string; page?: number; pageSize?: number }): Promise<{ data: Note[]; total: number; totalPages: number }> {
    await delay()
    const uid = localStorage.getItem(KEYS.currentUserId)!
    const sections = get<Section>(KEYS.sections)
    let notes = get<Note>(KEYS.notes)
      .filter(n => n.userId === uid)
      .map(n => {
        const section = sections.find(s => s.id === n.sectionId)
        return { ...n, sectionName: section?.name }
      })

    if (filters?.sectionId) notes = notes.filter(n => n.sectionId === filters.sectionId)
    if (filters?.isFavorite) notes = notes.filter(n => n.isFavorite)

    const sort = filters?.sort || 'newest'
    notes.sort((a, b) => {
      if (sort === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      if (sort === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      if (sort === 'title_asc') return a.title.localeCompare(b.title)
      if (sort === 'title_desc') return b.title.localeCompare(a.title)
      return 0
    })

    const total = notes.length
    const page = filters?.page || 1
    const pageSize = filters?.pageSize || 20
    const start = (page - 1) * pageSize
    const data = notes.slice(start, start + pageSize)

    return { data, total, totalPages: Math.ceil(total / pageSize) }
  },

  async getNote(id: string): Promise<Note> {
    await delay()
    const uid = localStorage.getItem(KEYS.currentUserId)!
    const notes = get<Note>(KEYS.notes)
    const found = notes.find(n => n.id === id && n.userId === uid)
    if (!found) throw new Error('Note not found.')
    const section = get<Section>(KEYS.sections).find(s => s.id === found.sectionId)
    return { ...found, sectionName: section?.name }
  },

  async createNote(req: CreateNoteRequest): Promise<Note> {
    await delay()
    const uid = localStorage.getItem(KEYS.currentUserId)!
    const tags = req.tagIds
      ? get<Tag>(KEYS.tags).filter(t => req.tagIds!.includes(t.id))
      : []
    const note: Note = {
      id: generateId(), userId: uid,
      sectionId: req.sectionId, title: req.title, content: req.content,
      simpleMeaning: req.simpleMeaning, example: req.example, whyItMatters: req.whyItMatters,
      sourceUrl: req.sourceUrl, sourceType: req.sourceType, sourceTitle: req.sourceTitle,
      timestamp: req.timestamp,
      tags, relatedNoteIds: req.relatedNoteIds || [],
      isFavorite: req.isFavorite || false, reviewEnabled: req.reviewEnabled || false,
      createdAt: now(), updatedAt: now(),
    }
    const notes = get<Note>(KEYS.notes)
    set(KEYS.notes, [...notes, note])

    if (note.reviewEnabled) {
      const schedules = get<ReviewSchedule>(KEYS.reviewSchedules)
      const schedule: ReviewSchedule = {
        id: generateId(), userId: uid, noteId: note.id,
        easeFactor: 2.5, interval: 1, repetitions: 0,
        nextReviewDate: new Date().toISOString().split('T')[0],
      }
      set(KEYS.reviewSchedules, [...schedules, schedule])
    }

    return note
  },

  async updateNote(id: string, req: UpdateNoteRequest): Promise<Note> {
    await delay()
    const uid = localStorage.getItem(KEYS.currentUserId)!
    const notes = get<Note>(KEYS.notes)
    const idx = notes.findIndex(n => n.id === id && n.userId === uid)
    if (idx === -1) throw new Error('Note not found.')
    const tags = req.tagIds
      ? get<Tag>(KEYS.tags).filter(t => req.tagIds!.includes(t.id))
      : notes[idx].tags
    const updated: Note = {
      ...notes[idx], ...req,
      tags, updatedAt: now(),
    }
    notes[idx] = updated
    set(KEYS.notes, notes)

    // Handle review schedule changes
    const schedules = get<ReviewSchedule>(KEYS.reviewSchedules)
    const hasSchedule = schedules.some(s => s.noteId === id && s.userId === uid)
    if (req.reviewEnabled && !hasSchedule) {
      const schedule: ReviewSchedule = {
        id: generateId(), userId: uid, noteId: id,
        easeFactor: 2.5, interval: 1, repetitions: 0,
        nextReviewDate: new Date().toISOString().split('T')[0],
      }
      set(KEYS.reviewSchedules, [...schedules, schedule])
    }

    return updated
  },

  async deleteNote(id: string): Promise<void> {
    await delay()
    const uid = localStorage.getItem(KEYS.currentUserId)!
    const notes = get<Note>(KEYS.notes)
    if (!notes.find(n => n.id === id && n.userId === uid)) throw new Error('Note not found.')
    set(KEYS.notes, notes.filter(n => !(n.id === id && n.userId === uid)))
    const schedules = get<ReviewSchedule>(KEYS.reviewSchedules)
    set(KEYS.reviewSchedules, schedules.filter(s => s.noteId !== id))
    const history = get<ReviewHistory>(KEYS.reviewHistory)
    set(KEYS.reviewHistory, history.filter(h => h.noteId !== id))
  },

  async toggleFavorite(id: string): Promise<Note> {
    await delay()
    const uid = localStorage.getItem(KEYS.currentUserId)!
    const notes = get<Note>(KEYS.notes)
    const idx = notes.findIndex(n => n.id === id && n.userId === uid)
    if (idx === -1) throw new Error('Note not found.')
    notes[idx] = { ...notes[idx], isFavorite: !notes[idx].isFavorite, updatedAt: now() }
    set(KEYS.notes, notes)
    return notes[idx]
  },

  // ── Tags ──────────────────────────────────────────────────────────────────

  async getTags(): Promise<Tag[]> {
    await delay()
    const uid = localStorage.getItem(KEYS.currentUserId)!
    const notes = get<Note>(KEYS.notes).filter(n => n.userId === uid)
    return get<Tag>(KEYS.tags)
      .filter(t => t.userId === uid)
      .map(t => ({
        ...t,
        noteCount: notes.filter(n => n.tags.some(nt => nt.id === t.id)).length,
      }))
  },

  async createTag(name: string): Promise<Tag> {
    await delay()
    const uid = localStorage.getItem(KEYS.currentUserId)!
    const tags = get<Tag>(KEYS.tags)
    const existing = tags.find(t => t.userId === uid && t.name.toLowerCase() === name.toLowerCase())
    if (existing) return existing
    const tag: Tag = { id: generateId(), userId: uid, name }
    set(KEYS.tags, [...tags, tag])
    return tag
  },

  // ── Search ────────────────────────────────────────────────────────────────

  async search(query: string): Promise<SearchResult[]> {
    await delay(200)
    const uid = localStorage.getItem(KEYS.currentUserId)!
    const q = query.toLowerCase().trim()
    if (!q) return []

    const sections = get<Section>(KEYS.sections).filter(s => s.userId === uid)
    const notes = get<Note>(KEYS.notes).filter(n => n.userId === uid)
    const results: SearchResult[] = []

    for (const note of notes) {
      const section = sections.find(s => s.id === note.sectionId)
      let matchedIn: SearchResult['matchedIn'] | null = null
      let snippet = ''

      if (note.title.toLowerCase().includes(q)) {
        matchedIn = 'title'
        snippet = note.title
      } else if (note.content.toLowerCase().includes(q)) {
        matchedIn = 'content'
        const idx = note.content.toLowerCase().indexOf(q)
        const start = Math.max(0, idx - 60)
        snippet = (start > 0 ? '…' : '') + note.content.slice(start, idx + q.length + 60).replace(/\n/g, ' ')
      } else if (note.simpleMeaning?.toLowerCase().includes(q)) {
        matchedIn = 'simpleMeaning'
        snippet = note.simpleMeaning!
      } else if (note.example?.toLowerCase().includes(q)) {
        matchedIn = 'example'
        snippet = note.example!
      } else if (note.tags.some(t => t.name.toLowerCase().includes(q))) {
        matchedIn = 'tags'
        snippet = `Tagged: ${note.tags.map(t => t.name).join(', ')}`
      }

      if (matchedIn) {
        results.push({
          noteId: note.id, title: note.title, snippet: snippet.slice(0, 160),
          sectionId: note.sectionId, sectionName: section?.name || 'Unknown',
          tags: note.tags, matchedIn,
        })
      }
    }

    return results
  },

  // ── Dashboard ─────────────────────────────────────────────────────────────

  async getDashboardStats(): Promise<DashboardStats> {
    await delay()
    const uid = localStorage.getItem(KEYS.currentUserId)!
    const allNotes = get<Note>(KEYS.notes).filter(n => n.userId === uid)
    const sections = get<Section>(KEYS.sections).filter(s => s.userId === uid)
    const schedules = get<ReviewSchedule>(KEYS.reviewSchedules).filter(s => s.userId === uid)
    const today = new Date().toISOString().split('T')[0]

    const recentNotes = [...allNotes]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6)
      .map(n => ({ ...n, sectionName: sections.find(s => s.id === n.sectionId)?.name }))

    const favoriteNotes = allNotes
      .filter(n => n.isFavorite)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 6)
      .map(n => ({ ...n, sectionName: sections.find(s => s.id === n.sectionId)?.name }))

    return {
      totalNotes: allNotes.length,
      totalSections: sections.length,
      favoriteCount: allNotes.filter(n => n.isFavorite).length,
      dueForReviewCount: schedules.filter(s => s.nextReviewDate <= today).length,
      recentNotes,
      favoriteNotes,
    }
  },

  // ── Review ────────────────────────────────────────────────────────────────

  async getReviewSession(): Promise<ReviewSession> {
    await delay()
    const uid = localStorage.getItem(KEYS.currentUserId)!
    const today = new Date().toISOString().split('T')[0]
    const schedules = get<ReviewSchedule>(KEYS.reviewSchedules).filter(s => s.userId === uid)
    const notes = get<Note>(KEYS.notes).filter(n => n.userId === uid)

    const due: ReviewSession['due'] = []
    const overdue: ReviewSession['due'] = []
    const upcoming: ReviewSession['upcoming'] = []

    for (const schedule of schedules) {
      const note = notes.find(n => n.id === schedule.noteId)
      if (!note) continue
      const diff = Math.ceil((new Date(schedule.nextReviewDate).getTime() - new Date(today).getTime()) / 86400000)
      if (diff === 0) due.push({ note, schedule })
      else if (diff < 0) overdue.push({ note, schedule })
      else if (diff <= 14) upcoming.push({ note, schedule, daysUntil: diff })
    }

    upcoming.sort((a, b) => a.daysUntil - b.daysUntil)
    return { due, overdue, upcoming }
  },

  async submitReview(noteId: string, rating: ReviewRating): Promise<ReviewSchedule> {
    await delay()
    const uid = localStorage.getItem(KEYS.currentUserId)!
    const schedules = get<ReviewSchedule>(KEYS.reviewSchedules)
    const idx = schedules.findIndex(s => s.noteId === noteId && s.userId === uid)
    if (idx === -1) throw new Error('Review schedule not found.')

    const updated = applySM2(schedules[idx], rating)
    schedules[idx] = updated
    set(KEYS.reviewSchedules, schedules)

    const history = get<ReviewHistory>(KEYS.reviewHistory)
    history.push({
      id: generateId(), userId: uid, noteId, rating,
      reviewedAt: new Date().toISOString(),
      previousInterval: schedules[idx].interval,
      newInterval: updated.interval,
    })
    set(KEYS.reviewHistory, history)

    return updated
  },

  async enableReview(noteId: string): Promise<ReviewSchedule> {
    await delay()
    const uid = localStorage.getItem(KEYS.currentUserId)!
    const schedules = get<ReviewSchedule>(KEYS.reviewSchedules)
    const existing = schedules.find(s => s.noteId === noteId && s.userId === uid)
    if (existing) return existing
    const schedule: ReviewSchedule = {
      id: generateId(), userId: uid, noteId,
      easeFactor: 2.5, interval: 1, repetitions: 0,
      nextReviewDate: new Date().toISOString().split('T')[0],
    }
    set(KEYS.reviewSchedules, [...schedules, schedule])
    return schedule
  },

  // ── User Settings ─────────────────────────────────────────────────────────

  async updateProfile(updates: { name?: string; email?: string }): Promise<User> {
    await delay()
    const uid = localStorage.getItem(KEYS.currentUserId)!
    const users = get<User & { password: string }>(KEYS.users)
    const idx = users.findIndex(u => u.id === uid)
    if (idx === -1) throw new Error('User not found.')
    users[idx] = { ...users[idx], ...updates }
    set(KEYS.users, users)
    const { password: _pw, ...user } = users[idx]
    return user
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await delay()
    const uid = localStorage.getItem(KEYS.currentUserId)!
    const users = get<User & { password: string }>(KEYS.users)
    const idx = users.findIndex(u => u.id === uid)
    if (idx === -1) throw new Error('User not found.')
    if (users[idx].password !== currentPassword) throw new Error('Current password is incorrect.')
    users[idx] = { ...users[idx], password: newPassword }
    set(KEYS.users, users)
  },

  async deleteAccount(): Promise<void> {
    await delay()
    const uid = localStorage.getItem(KEYS.currentUserId)!
    const users = get<User & { password: string }>(KEYS.users)
    set(KEYS.users, users.filter(u => u.id !== uid))
    set(KEYS.sections, get<Section>(KEYS.sections).filter(s => s.userId !== uid))
    set(KEYS.notes, get<Note>(KEYS.notes).filter(n => n.userId !== uid))
    set(KEYS.tags, get<Tag>(KEYS.tags).filter(t => t.userId !== uid))
    set(KEYS.reviewSchedules, get<ReviewSchedule>(KEYS.reviewSchedules).filter(s => s.userId !== uid))
    set(KEYS.reviewHistory, get<ReviewHistory>(KEYS.reviewHistory).filter(h => h.userId !== uid))
    this.logout()
  },
}
