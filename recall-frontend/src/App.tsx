import { useState, useEffect } from 'react'
import { Routes, Route, Outlet, useNavigate } from 'react-router-dom'

import { ProtectedRoute, PublicRoute } from './router/ProtectedRoute'
import { Sidebar } from './components/layout/Sidebar'
import { TopBar } from './components/layout/TopBar'
import { SearchModal } from './components/search/SearchModal'
import { NoteEditor } from './components/notes/NoteEditor'
import { SectionDialog } from './components/sections/SectionDialog'

// Pages
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Register from './pages/Register'
import AllNotes from './pages/AllNotes'
import NoteDetail from './pages/NoteDetail'
import SectionView from './pages/SectionView'
import DailyReview from './pages/DailyReview'
import Favorites from './pages/Favorites'
import RecentlyAdded from './pages/RecentlyAdded'
import SettingsPage from './pages/Settings'

// ── /sections/new ─────────────────────────────────────────────────────────────
// Opens a section creation dialog, then redirects back to dashboard.

function SectionNewPage() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(true)

  const handleClose = () => {
    setOpen(false)
    navigate('/')
  }

  return (
    <SectionDialog
      open={open}
      onClose={handleClose}
      onSaved={handleClose}
    />
  )
}

// ── 404 ───────────────────────────────────────────────────────────────────────

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-24 text-center px-4">
      <p className="text-6xl font-bold text-primary mb-4">404</p>
      <h1 className="text-xl font-semibold text-foreground mb-2">Page not found</h1>
      <p className="text-sm text-muted-foreground mb-8">
        The page you're looking for doesn't exist.
      </p>
      <a
        href="/"
        className="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        Back to Dashboard
      </a>
    </div>
  )
}

// ── App Shell Layout ──────────────────────────────────────────────────────────

function AppLayout() {
  const [showSearch, setShowSearch] = useState(false)
  const [showNoteEditor, setShowNoteEditor] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // ⌘K / Ctrl+K → search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setShowSearch(true)
      }
      // N → new note (when not in an input)
      const tag = (e.target as HTMLElement).tagName
      if (e.key === 'n' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) {
        e.preventDefault()
        setShowNoteEditor(true)
      }
      // Escape → close mobile menu
      if (e.key === 'Escape') {
        setShowMobileMenu(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar – desktop */}
      <div className="hidden lg:flex flex-shrink-0">
        <Sidebar onQuickAdd={() => setShowNoteEditor(true)} />
      </div>

      {/* Mobile sidebar overlay */}
      {showMobileMenu && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setShowMobileMenu(false)}
        >
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
          <div
            className="absolute left-0 top-0 bottom-0 z-50 animate-slide-in-left"
            onClick={e => e.stopPropagation()}
          >
            <Sidebar
              onQuickAdd={() => {
                setShowNoteEditor(true)
                setShowMobileMenu(false)
              }}
            />
          </div>
        </div>
      )}

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar
          onSearch={() => setShowSearch(true)}
          onQuickAdd={() => setShowNoteEditor(true)}
          onMobileMenuToggle={() => setShowMobileMenu(!showMobileMenu)}
          showMobileMenu={showMobileMenu}
        />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Global modals */}
      <SearchModal open={showSearch} onClose={() => setShowSearch(false)} />

      <NoteEditor
        open={showNoteEditor}
        onClose={() => setShowNoteEditor(false)}
        onSaved={() => {
          setShowNoteEditor(false)
          // Lightweight signal for pages to refresh
          window.dispatchEvent(new CustomEvent('recall:note-saved'))
        }}
      />
    </div>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <Routes>
      {/* Public (unauthenticated) routes */}
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Protected routes – wrapped in the app shell */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="/notes" element={<AllNotes />} />
          <Route path="/notes/:id" element={<NoteDetail />} />
          <Route path="/sections/new" element={<SectionNewPage />} />
          <Route path="/sections/:id" element={<SectionView />} />
          <Route path="/review" element={<DailyReview />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/recent" element={<RecentlyAdded />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
  )
}
