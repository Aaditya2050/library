import { useState, useEffect, useCallback } from 'react'
import { api } from '../api'
import type { Section, CreateSectionRequest, UpdateSectionRequest } from '../types'
import toast from 'react-hot-toast'

export function useSections() {
  const [sections, setSections] = useState<Section[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSections = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await api.sections.list()
      setSections(data)
      setError(null)
    } catch (e) {
      setError('Failed to load sections')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchSections() }, [fetchSections])

  const createSection = async (req: CreateSectionRequest) => {
    const section = await api.sections.create(req)
    setSections(prev => [...prev, section])
    toast.success(`Section "${section.name}" created`)
    return section
  }

  const updateSection = async (id: string, req: UpdateSectionRequest) => {
    const section = await api.sections.update(id, req)
    setSections(prev => prev.map(s => s.id === id ? section : s))
    toast.success('Section updated')
    return section
  }

  const deleteSection = async (id: string) => {
    await api.sections.delete(id)
    setSections(prev => prev.filter(s => s.id !== id))
    toast.success('Section deleted')
  }

  return { sections, isLoading, error, refetch: fetchSections, createSection, updateSection, deleteSection }
}
