import { useState, useRef, useEffect } from 'react'
import { Search, Plus, Sun, Moon, Monitor, Brain, Menu, X } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { cn } from '../../lib/utils'
import { Button } from '../ui/Button'

interface TopBarProps {
  onSearch: () => void
  onQuickAdd: () => void
  onMobileMenuToggle?: () => void
  showMobileMenu?: boolean
}

export function TopBar({ onSearch, onQuickAdd, onMobileMenuToggle, showMobileMenu }: TopBarProps) {
  const { theme, setTheme } = useTheme()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const cycleTheme = () => {
    const next: Record<string, 'light' | 'dark' | 'system'> = {
      light: 'dark', dark: 'system', system: 'light'
    }
    setTheme(next[theme])
  }

  const ThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="h-14 flex items-center gap-3 px-4 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-30">
      {/* Mobile menu toggle */}
      <button
        className="lg:hidden text-muted-foreground hover:text-foreground transition-colors"
        onClick={onMobileMenuToggle}
      >
        {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile logo */}
      <div className="lg:hidden flex items-center gap-1.5">
        <Brain className="w-5 h-5 text-primary" />
        <span className="font-bold text-foreground">Recall</span>
      </div>

      {/* Search trigger */}
      <button
        onClick={onSearch}
        className={cn(
          'flex-1 max-w-md flex items-center gap-2.5 px-3 h-9 rounded-lg border border-input bg-secondary',
          'text-sm text-muted-foreground hover:border-primary/40 hover:bg-secondary/80 transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
        )}
        id="global-search-trigger"
      >
        <Search className="w-3.5 h-3.5 shrink-0" />
        <span className="flex-1 text-left">Search notes…</span>
        <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-background border border-border text-muted-foreground">
          ⌘K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-1">
        {/* Theme toggle */}
        <button
          onClick={cycleTheme}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          title={`Theme: ${theme}`}
          id="theme-toggle"
        >
          <ThemeIcon className="w-4 h-4" />
        </button>

        {/* Quick add */}
        <Button size="sm" onClick={onQuickAdd} leftIcon={<Plus className="w-3.5 h-3.5" />} className="hidden sm:inline-flex">
          New Note
        </Button>
        <button
          className="sm:hidden w-9 h-9 flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          onClick={onQuickAdd}
        >
          <Plus className="w-4 h-4" />
        </button>

        {/* User menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-semibold hover:ring-2 hover:ring-primary/30 transition-all ml-1"
            id="user-menu-button"
          >
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-card border border-border rounded-xl shadow-lg overflow-hidden animate-scale-in z-50">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
              <div className="p-1">
                <button
                  onClick={() => { navigate('/settings'); setShowUserMenu(false) }}
                  className="w-full px-3 py-2 text-sm text-left rounded-lg text-foreground hover:bg-secondary transition-colors"
                >
                  Settings
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full px-3 py-2 text-sm text-left rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                >
                  Log out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
