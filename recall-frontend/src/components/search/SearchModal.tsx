import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X, ArrowRight, Loader2 } from 'lucide-react'
import { useSearch } from '../../hooks/useData'
import { cn, highlightText } from '../../lib/utils'
import type { SearchResult } from '../../types'

interface SearchModalProps {
  open: boolean
  onClose: () => void
}

function groupBySection(results: SearchResult[]): Record<string, SearchResult[]> {
  return results.reduce((acc, r) => {
    if (!acc[r.sectionName]) acc[r.sectionName] = []
    acc[r.sectionName].push(r)
    return acc
  }, {} as Record<string, SearchResult[]>)
}

export function SearchModal({ open, onClose }: SearchModalProps) {
  const { query, setQuery, results, isSearching, clear } = useSearch()
  const [selectedIdx, setSelectedIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setSelectedIdx(0)
    } else {
      clear()
    }
  }, [open])

  useEffect(() => { setSelectedIdx(0) }, [results])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!open) return
    if (e.key === 'Escape') { onClose(); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, results.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)) }
    if (e.key === 'Enter' && results[selectedIdx]) {
      navigate(`/notes/${results[selectedIdx].noteId}`)
      onClose()
    }
  }, [open, results, selectedIdx, navigate, onClose])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  const grouped = groupBySection(results)
  const flatResults = results // for keyboard navigation index

  const handleResultClick = (noteId: string) => {
    navigate(`/notes/${noteId}`)
    onClose()
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4"
      onClick={e => { if (e.target === overlayRef.current) onClose() }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div className="relative w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search across all notes…"
            className="flex-1 text-sm bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
            id="search-input"
          />
          {isSearching && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
          {query && !isSearching && (
            <button onClick={clear} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="px-1.5 py-0.5 text-xs rounded border border-border text-muted-foreground">Esc</kbd>
        </div>

        {/* Results */}
        <div className="max-h-[480px] overflow-y-auto">
          {!query && (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-muted-foreground">Type to search across all your notes…</p>
              <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded border border-border">↑↓</kbd> navigate</span>
                <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded border border-border">↵</kbd> open</span>
                <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded border border-border">Esc</kbd> close</span>
              </div>
            </div>
          )}

          {query && results.length === 0 && !isSearching && (
            <div className="px-4 py-8 text-center">
              <p className="text-sm font-medium text-foreground mb-1">No results for "{query}"</p>
              <p className="text-xs text-muted-foreground">Try a different keyword or check your spelling.</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="p-2">
              {Object.entries(grouped).map(([sectionName, sectionResults]) => (
                <div key={sectionName} className="mb-2">
                  <div className="px-3 py-1.5">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {sectionName}
                    </p>
                  </div>
                  {sectionResults.map(result => {
                    const globalIdx = flatResults.indexOf(result)
                    const isSelected = globalIdx === selectedIdx
                    return (
                      <button
                        key={result.noteId}
                        onClick={() => handleResultClick(result.noteId)}
                        onMouseEnter={() => setSelectedIdx(globalIdx)}
                        className={cn(
                          'w-full text-left px-3 py-2.5 rounded-xl transition-colors flex items-start gap-3 group',
                          isSelected ? 'bg-accent' : 'hover:bg-secondary'
                        )}
                        id={`search-result-${result.noteId}`}
                      >
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-sm font-medium text-foreground truncate"
                            dangerouslySetInnerHTML={{ __html: highlightText(result.title, query) }}
                          />
                          {result.snippet && (
                            <p
                              className="text-xs text-muted-foreground mt-0.5 line-clamp-2"
                              dangerouslySetInnerHTML={{ __html: highlightText(result.snippet, query) }}
                            />
                          )}
                          {result.tags.length > 0 && (
                            <div className="flex gap-1 mt-1.5">
                              {result.tags.slice(0, 3).map(tag => (
                                <span key={tag.id} className="text-xs px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                                  {tag.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <ArrowRight className={cn(
                          'w-4 h-4 shrink-0 mt-0.5 transition-opacity',
                          isSelected ? 'opacity-100 text-primary' : 'opacity-0'
                        )} />
                      </button>
                    )
                  })}
                </div>
              ))}

              <div className="px-3 py-2 border-t border-border mt-1">
                <p className="text-xs text-muted-foreground">
                  {results.length} result{results.length !== 1 ? 's' : ''} found
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Highlight styles */}
      <style>{`
        mark {
          background: hsl(var(--primary) / 0.2);
          color: hsl(var(--primary));
          border-radius: 2px;
          padding: 0 1px;
          font-weight: 500;
        }
      `}</style>
    </div>
  )
}
