import { useState, useEffect, useCallback } from 'react'
import { api } from '../api'
import type { Note, CreateNoteRequest, UpdateNoteRequest, NoteFilters } from '../types'
import toast from 'react-hot-toast'

export function useNotes(filters?: NoteFilters) {
  const [notes, setNotes] = useState<Note[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  const fetchNotes = useCallback(async (currentPage = page) => {
    try {
      setIsLoading(true)
      const result = await api.notes.list({
        sectionId: filters?.sectionId,
        isFavorite: filters?.isFavorite,
        sort: filters?.sort,
        page: currentPage,
        pageSize: 20,
      })
      setNotes(result.data)
      setTotal(result.total)
      setTotalPages(result.totalPages)
      setError(null)
    } catch {
      setError('Failed to load notes')
    } finally {
      setIsLoading(false)
    }
  }, [filters?.sectionId, filters?.isFavorite, filters?.sort, page])

  useEffect(() => { fetchNotes() }, [fetchNotes])

  const createNote = async (req: CreateNoteRequest): Promise<Note> => {
    const note = await api.notes.create(req)
    toast.success('Note saved!')
    await fetchNotes()
    return note
  }

  const updateNote = async (id: string, req: UpdateNoteRequest): Promise<Note> => {
    const note = await api.notes.update(id, req)
    setNotes(prev => prev.map(n => n.id === id ? note : n))
    toast.success('Note updated')
    return note
  }

  const deleteNote = async (id: string) => {
    await api.notes.delete(id)
    setNotes(prev => prev.filter(n => n.id !== id))
    setTotal(prev => prev - 1)
    toast.success('Note deleted')
  }

  const toggleFavorite = async (id: string): Promise<Note> => {
    const updated = await api.notes.toggleFavorite(id)
    setNotes(prev => prev.map(n => n.id === id ? updated : n))
    toast.success(updated.isFavorite ? 'Added to favorites' : 'Removed from favorites')
    return updated
  }

  return {
    notes, total, totalPages, isLoading, error, page, setPage,
    refetch: fetchNotes, createNote, updateNote, deleteNote, toggleFavorite
  }
}

export function useNote(id: string | undefined) {
  const [note, setNote] = useState<Note | null>(null)
  const [isLoading, setIsLoading] = useState(!!id)
  const [error, setError] = useState<string | null>(null)

  const fetchNote = useCallback(async () => {
    if (!id) return
    try {
      setIsLoading(true)
      const data = await api.notes.get(id)
      setNote(data)
      setError(null)
    } catch {
      setError('Note not found')
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => { fetchNote() }, [fetchNote])

  const toggleFavorite = async () => {
    if (!note) return
    const updated = await api.notes.toggleFavorite(note.id)
    setNote(updated)
    toast.success(updated.isFavorite ? 'Added to favorites' : 'Removed from favorites')
    return updated
  }

  return { note, isLoading, error, refetch: fetchNote, setNote, toggleFavorite }
}
