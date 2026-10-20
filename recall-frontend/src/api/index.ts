import axios from 'axios'
import type {
  AuthResponse,
  RegisterRequest,
  Section,
  CreateSectionRequest,
  UpdateSectionRequest,
  Note,
  CreateNoteRequest,
  UpdateNoteRequest,
  Tag,
  SearchResult,
  DashboardStats,
  ReviewSession,
  ReviewSchedule,
  ReviewRating,
  User,
} from '../types'

// ─── Constants ────────────────────────────────────────────────────────────────

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8080'
const TOKEN_KEY = 'recall_token'
const USER_KEY = 'recall_user'

// ─── Token helpers ────────────────────────────────────────────────────────────

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

function setStoredUser(user: User): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

function clearStoredUser(): void {
  localStorage.removeItem(USER_KEY)
}

// ─── Axios instance ───────────────────────────────────────────────────────────

const client = axios.create({ baseURL: BASE_URL })

/** Attach JWT to every request that has a stored token. */
client.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers = config.headers ?? {}
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

/** On 401, clear creds and redirect to /login. */
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      clearToken()
      clearStoredUser()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

// ─── Spring Boot Page<T> response shape ───────────────────────────────────────

interface SpringPage<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number   // zero-based page index
  size: number
}

function mapPage<T>(page: SpringPage<T>) {
  return {
    data: page.content,
    total: page.totalElements,
    totalPages: page.totalPages,
    page: page.number,
    pageSize: page.size,
  }
}

// ─── ID mapping helpers ───────────────────────────────────────────────────────
// Backend uses Long (JSON number); frontend expects string IDs.

type WithNumericIds<T> = {
  [K in keyof T]: T[K] extends string
    ? T[K] | number
    : T[K] extends string | undefined
    ? T[K] | number | undefined
    : T[K]
}

function mapUser(raw: WithNumericIds<User>): User {
  return {
    ...raw,
    id: String(raw.id),
  } as User
}

function mapSection(raw: Record<string, unknown>): Section {
  return {
    id: String(raw['id']),
    userId: String(raw['userId']),
    name: String(raw['name'] ?? ''),
    description: raw['description'] != null ? String(raw['description']) : undefined,
    icon: String(raw['icon'] ?? '📁'),
    accentColor: String(raw['accentColor'] ?? '#6366f1'),
    displayOrder: Number(raw['displayOrder'] ?? 0),
    noteCount: raw['noteCount'] != null ? Number(raw['noteCount']) : undefined,
    createdAt: String(raw['createdAt'] ?? ''),
    updatedAt: String(raw['updatedAt'] ?? ''),
  }
}

function mapNote(raw: Record<string, unknown>): Note {
  const tags = Array.isArray(raw['tags'])
    ? (raw['tags'] as Record<string, unknown>[]).map((t) => mapTag(t))
    : []

  const relatedNoteIds = Array.isArray(raw['relatedNoteIds'])
    ? (raw['relatedNoteIds'] as (string | number)[]).map(String)
    : []

  return {
    id: String(raw['id']),
    userId: String(raw['userId']),
    sectionId: String(raw['sectionId']),
    sectionName: raw['sectionName'] != null ? String(raw['sectionName']) : undefined,
    title: String(raw['title'] ?? ''),
    content: String(raw['content'] ?? ''),
    simpleMeaning: raw['simpleMeaning'] != null ? String(raw['simpleMeaning']) : undefined,
    example: raw['example'] != null ? String(raw['example']) : undefined,
    whyItMatters: raw['whyItMatters'] != null ? String(raw['whyItMatters']) : undefined,
    sourceUrl: raw['sourceUrl'] != null ? String(raw['sourceUrl']) : undefined,
    sourceType: raw['sourceType'] as Note['sourceType'],
    sourceTitle: raw['sourceTitle'] != null ? String(raw['sourceTitle']) : undefined,
    timestamp: raw['timestamp'] != null ? String(raw['timestamp']) : undefined,
    tags,
    relatedNoteIds,
    isFavorite: Boolean(raw['isFavorite']),
    reviewEnabled: Boolean(raw['reviewEnabled']),
    createdAt: String(raw['createdAt'] ?? ''),
    updatedAt: String(raw['updatedAt'] ?? ''),
  }
}

function mapTag(raw: Record<string, unknown>): Tag {
  return {
    id: String(raw['id']),
    userId: String(raw['userId'] ?? ''),
    name: String(raw['name'] ?? ''),
    noteCount: raw['noteCount'] != null ? Number(raw['noteCount']) : undefined,
  }
}

function mapReviewSchedule(raw: Record<string, unknown>): ReviewSchedule {
  return {
    id: String(raw['id']),
    userId: String(raw['userId']),
    noteId: String(raw['noteId']),
    easeFactor: Number(raw['easeFactor'] ?? 2.5),
    interval: Number(raw['interval'] ?? 1),
    repetitions: Number(raw['repetitions'] ?? 0),
    nextReviewDate: String(raw['nextReviewDate'] ?? ''),
    lastReviewedAt: raw['lastReviewedAt'] != null ? String(raw['lastReviewedAt']) : undefined,
  }
}

// ─── Auth note: after login/register the token + user are persisted ───────────

async function handleAuthResponse(promise: Promise<{ data: { token: string; user: unknown } }>) {
  const { data } = await promise
  const user = mapUser(data.user as WithNumericIds<User>)
  setToken(data.token)
  setStoredUser(user)
  const response: AuthResponse = { token: data.token, user }
  return response
}

// ─── Public API object ────────────────────────────────────────────────────────

export const api = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  auth: {
    register: (req: RegisterRequest): Promise<AuthResponse> =>
      handleAuthResponse(client.post('/api/auth/register', req)),

    login: (email: string, password: string): Promise<AuthResponse> =>
      handleAuthResponse(client.post('/api/auth/login', { email, password })),

    logout: (): void => {
      clearToken()
      clearStoredUser()
    },

    /** Synchronous — reads from localStorage. */
    getCurrentUser: (): User | null => getStoredUser(),

    /** Synchronous — reads from localStorage. */
    getToken: (): string | null => getToken(),
  },

  // ── Sections ──────────────────────────────────────────────────────────────
  sections: {
    list: async (): Promise<Section[]> => {
      const { data } = await client.get<Record<string, unknown>[]>('/api/sections')
      return data.map(mapSection)
    },

    get: async (id: string): Promise<Section> => {
      const { data } = await client.get<Record<string, unknown>>(`/api/sections/${id}`)
      return mapSection(data)
    },

    create: async (req: CreateSectionRequest): Promise<Section> => {
      const { data } = await client.post<Record<string, unknown>>('/api/sections', req)
      return mapSection(data)
    },

    update: async (id: string, req: UpdateSectionRequest): Promise<Section> => {
      const { data } = await client.put<Record<string, unknown>>(`/api/sections/${id}`, req)
      return mapSection(data)
    },

    delete: async (id: string): Promise<void> => {
      await client.delete(`/api/sections/${id}`)
    },
  },

  // ── Notes ─────────────────────────────────────────────────────────────────
  notes: {
    list: async (filters?: {
      sectionId?: string
      isFavorite?: boolean
      sort?: string
      page?: number
      pageSize?: number
    }): Promise<{ data: Note[]; total: number; totalPages: number; page: number; pageSize: number }> => {
      if (filters?.isFavorite) {
        // favorites endpoint
        const { data } = await client.get<SpringPage<Record<string, unknown>>>('/api/notes/favorites', {
          params: { page: filters.page ?? 0, size: filters.pageSize ?? 20 },
        })
        const mapped = mapPage(data)
        return { ...mapped, data: mapped.data.map(mapNote) }
      }

      if (filters?.sectionId) {
        const { data } = await client.get<SpringPage<Record<string, unknown>>>(
          `/api/notes/section/${filters.sectionId}`,
          { params: { page: filters.page ?? 0, size: filters.pageSize ?? 20 } },
        )
        const mapped = mapPage(data)
        return { ...mapped, data: mapped.data.map(mapNote) }
      }

      const { data } = await client.get<SpringPage<Record<string, unknown>>>('/api/notes', {
        params: {
          page: filters?.page ?? 0,
          size: filters?.pageSize ?? 20,
          sort: filters?.sort,
        },
      })
      const mapped = mapPage(data)
      return { ...mapped, data: mapped.data.map(mapNote) }
    },

    get: async (id: string): Promise<Note> => {
      const { data } = await client.get<Record<string, unknown>>(`/api/notes/${id}`)
      return mapNote(data)
    },

    create: async (req: CreateNoteRequest): Promise<Note> => {
      // Convert string IDs to numbers for backend
      const payload = {
        ...req,
        sectionId: Number(req.sectionId),
        tagIds: req.tagIds?.map(Number),
        relatedNoteIds: req.relatedNoteIds?.map(Number),
      }
      const { data } = await client.post<Record<string, unknown>>('/api/notes', payload)
      return mapNote(data)
    },

    update: async (id: string, req: UpdateNoteRequest): Promise<Note> => {
      const payload = {
        ...req,
        sectionId: req.sectionId !== undefined ? Number(req.sectionId) : undefined,
        tagIds: req.tagIds?.map(Number),
        relatedNoteIds: req.relatedNoteIds?.map(Number),
      }
      const { data } = await client.put<Record<string, unknown>>(`/api/notes/${id}`, payload)
      return mapNote(data)
    },

    delete: async (id: string): Promise<void> => {
      await client.delete(`/api/notes/${id}`)
    },

    toggleFavorite: async (id: string): Promise<Note> => {
      const { data } = await client.post<Record<string, unknown>>(`/api/notes/${id}/favorite`)
      return mapNote(data)
    },
  },

  // ── Tags ──────────────────────────────────────────────────────────────────
  tags: {
    list: async (): Promise<Tag[]> => {
      const { data } = await client.get<Record<string, unknown>[]>('/api/tags')
      return data.map(mapTag)
    },

    /** POST /api/tags — falls back to a local mock if the endpoint is not found (404). */
    create: async (name: string): Promise<Tag> => {
      try {
        const { data } = await client.post<Record<string, unknown>>('/api/tags', { name })
        return mapTag(data)
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          // Backend doesn't support tag creation yet — return a temporary mock tag
          const mockTag: Tag = {
            id: `local-${Date.now()}`,
            userId: getStoredUser()?.id ?? 'local',
            name,
            noteCount: 0,
          }
          return mockTag
        }
        throw err
      }
    },
  },

  // ── Search ────────────────────────────────────────────────────────────────
  search: {
    query: async (q: string): Promise<SearchResult[]> => {
      const { data } = await client.get<SpringPage<Record<string, unknown>>>('/api/notes/search', {
        params: { q, page: 0, size: 20 },
      })
      return data.content.map((raw) => ({
        noteId: String(raw['id']),
        title: String(raw['title'] ?? ''),
        snippet: String(raw['content'] ?? raw['simpleMeaning'] ?? '').slice(0, 200),
        sectionId: String(raw['sectionId']),
        sectionName: String(raw['sectionName'] ?? ''),
        tags: Array.isArray(raw['tags'])
          ? (raw['tags'] as Record<string, unknown>[]).map(mapTag)
          : [],
        matchedIn: 'title' as SearchResult['matchedIn'],
      }))
    },
  },

  // ── Dashboard ─────────────────────────────────────────────────────────────
  dashboard: {
    getStats: async (): Promise<DashboardStats> => {
      const { data } = await client.get<Record<string, unknown>>('/api/dashboard')
      return {
        totalNotes: Number(data['totalNotes'] ?? 0),
        totalSections: Number(data['totalSections'] ?? 0),
        favoriteCount: Number(data['favoriteCount'] ?? 0),
        dueForReviewCount: Number(data['dueForReviewCount'] ?? 0),
        recentNotes: Array.isArray(data['recentNotes'])
          ? (data['recentNotes'] as Record<string, unknown>[]).map(mapNote)
          : [],
        favoriteNotes: Array.isArray(data['favoriteNotes'])
          ? (data['favoriteNotes'] as Record<string, unknown>[]).map(mapNote)
          : [],
      }
    },
  },

  // ── Review ────────────────────────────────────────────────────────────────
  review: {
    getSession: async (): Promise<ReviewSession> => {
      const { data } = await client.get<Record<string, unknown>[]>('/api/reviews/due')
      // Backend returns a flat list of { note, schedule } items; map to ReviewSession shape
      const items = data.map((raw) => ({
        note: mapNote(raw['note'] as Record<string, unknown>),
        schedule: mapReviewSchedule(raw['schedule'] as Record<string, unknown>),
      }))
      return { due: items, overdue: [], upcoming: [] }
    },

    submitReview: async (noteId: string, rating: ReviewRating): Promise<ReviewSchedule> => {
      const { data } = await client.post<Record<string, unknown>>(
        `/api/reviews/notes/${noteId}/rate`,
        { rating },
      )
      return mapReviewSchedule(data)
    },

    enableReview: async (noteId: string): Promise<ReviewSchedule> => {
      const { data } = await client.post<Record<string, unknown>>(
        `/api/reviews/notes/${noteId}/enable`,
      )
      return mapReviewSchedule(data)
    },
  },

  // ── User ──────────────────────────────────────────────────────────────────
  user: {
    updateProfile: async (updates: { name?: string; email?: string }): Promise<User> => {
      const { data } = await client.put<WithNumericIds<User>>('/api/users/me', updates)
      const user = mapUser(data)
      setStoredUser(user)
      return user
    },

    changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
      await client.put('/api/users/me/password', { currentPassword, newPassword })
    },

    deleteAccount: async (): Promise<void> => {
      await client.delete('/api/users/me')
      clearToken()
      clearStoredUser()
    },
  },
}
