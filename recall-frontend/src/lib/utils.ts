import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr)
  if (isToday(date)) return `Today at ${format(date, 'h:mm a')}`
  if (isYesterday(date)) return `Yesterday at ${format(date, 'h:mm a')}`
  return formatDistanceToNow(date, { addSuffix: true })
}

export function formatDate(dateStr: string): string {
  return format(new Date(dateStr), 'MMM d, yyyy')
}

export function formatFullDate(dateStr: string): string {
  return format(new Date(dateStr), 'MMMM d, yyyy \'at\' h:mm a')
}

export function generateId(): string {
  return crypto.randomUUID()
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength).trim() + '…'
}

export function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/>\s/g, '')
    .replace(/[-*+]\s/g, '')
    .trim()
}

export function highlightText(text: string, query: string): string {
  if (!query.trim()) return text
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return text.replace(new RegExp(`(${escaped})`, 'gi'), '<mark>$1</mark>')
}

export const SOURCE_TYPE_LABELS: Record<string, string> = {
  book: 'Book',
  video: 'Video',
  article: 'Article',
  course: 'Course',
  personal: 'Personal Thought',
  other: 'Other',
}

export const SECTION_ICONS = [
  '📚', '💡', '🎵', '📈', '💻', '🧠', '🌍', '⚗️', '🎨', '🏋️',
  '📝', '🔬', '🎯', '🌱', '🚀', '💰', '🎭', '🏛️', '🔧', '✨',
]

export const ACCENT_COLORS = [
  { name: 'Violet', value: '#7c3aed' },
  { name: 'Blue', value: '#2563eb' },
  { name: 'Emerald', value: '#059669' },
  { name: 'Amber', value: '#d97706' },
  { name: 'Rose', value: '#e11d48' },
  { name: 'Cyan', value: '#0891b2' },
  { name: 'Indigo', value: '#4338ca' },
  { name: 'Pink', value: '#db2777' },
  { name: 'Orange', value: '#ea580c' },
  { name: 'Teal', value: '#0d9488' },
]

export function debounce<T extends (...args: unknown[]) => unknown>(fn: T, ms: number) {
  let timeout: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => fn(...args), ms)
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
