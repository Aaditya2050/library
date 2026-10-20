import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '../api'
import type { Tag } from '../types'
import toast from 'react-hot-toast'

export function useTags() {
  const [tags, setTags] = useState<Tag[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchTags = useCallback(async () => {
    try {
      const data = await api.tags.list()
      setTags(data)
    } catch {
      // silent
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchTags() }, [fetchTags])

  const createTag = async (name: string): Promise<Tag> => {
    const tag = await api.tags.create(name)
    setTags(prev => prev.some(t => t.id === tag.id) ? prev : [...prev, tag])
    return tag
  }

  return { tags, isLoading, refetch: fetchTags, createTag }
}

export function useSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Awaited<ReturnType<typeof api.search.query>>>([])
  const [isSearching, setIsSearching] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    clearTimeout(debounceRef.current)
    if (!query.trim()) { setResults([]); setIsSearching(false); return }

    setIsSearching(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await api.search.query(query)
        setResults(data)
      } catch {
        setResults([])
      } finally {
        setIsSearching(false)
      }
    }, 250)

    return () => clearTimeout(debounceRef.current)
  }, [query])

  const clear = () => { setQuery(''); setResults([]) }

  return { query, setQuery, results, isSearching, clear }
}

export function useDashboard() {
  const [stats, setStats] = useState<Awaited<ReturnType<typeof api.dashboard.getStats>> | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    api.dashboard.getStats()
      .then(data => { setStats(data); setIsLoading(false) })
      .catch(() => setIsLoading(false))
  }, [])

  return { stats, isLoading }
}

export function useReview() {
  const [session, setSession] = useState<Awaited<ReturnType<typeof api.review.getSession>> | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchSession = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await api.review.getSession()
      setSession(data)
    } catch {
      // silent
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchSession() }, [fetchSession])

  const submitReview = async (noteId: string, rating: Parameters<typeof api.review.submitReview>[1]) => {
    const updated = await api.review.submitReview(noteId, rating)
    toast.success('Review recorded!')
    await fetchSession()
    return updated
  }

  return { session, isLoading, refetch: fetchSession, submitReview }
}
