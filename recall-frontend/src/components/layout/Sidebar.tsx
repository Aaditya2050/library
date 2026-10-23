import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, BookOpen, Star, Clock, Brain, Settings,
  ChevronLeft, ChevronRight, Plus, FolderOpen, LogOut, Loader2
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useAuth } from '../../context/AuthContext'
import { useSections } from '../../hooks/useSections'
import { Button } from '../ui/Button'
import { Tooltip } from '../ui/index'

interface SidebarProps {
  onQuickAdd: () => void
}

const mainNav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/notes', label: 'All Notes', icon: BookOpen },
  { to: '/review', label: 'Daily Review', icon: Brain },
  { to: '/favorites', label: 'Favorites', icon: Star },
  { to: '/recent', label: 'Recently Added', icon: Clock },
]

export function Sidebar({ onQuickAdd }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const { user, logout } = useAuth()
  const { sections, isLoading } = useSections()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navItem = (to: string, label: string, icon: React.ElementType, end?: boolean) => {
    const Icon = icon
    return (
      <NavLink
        key={to}
        to={to}
        end={end}
        className={({ isActive }) =>
          cn(
            'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150',
            'hover:bg-secondary hover:text-foreground',
            collapsed ? 'justify-center px-2' : '',
            isActive
              ? 'bg-accent text-accent-foreground'
              : 'text-muted-foreground'
          )
        }
      >
        {({ isActive }) => (
          <>
            <Icon className={cn('w-4 h-4 shrink-0', isActive && 'text-primary')} />
            {!collapsed && <span className="truncate">{label}</span>}
          </>
        )}
      </NavLink>
    )
  }

  return (
    <aside
      className={cn(
        'flex flex-col h-full bg-[hsl(var(--sidebar-bg))] border-r border-[hsl(var(--sidebar-border))]',
        'transition-all duration-300 ease-in-out',
        collapsed ? 'w-14' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className={cn(
        'flex items-center h-14 px-4 border-b border-[hsl(var(--sidebar-border))]',
        collapsed && 'justify-center px-2'
      )}>
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Brain className="w-4 h-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="text-base font-bold text-foreground tracking-tight truncate">
              Recall
            </span>
          )}
        </div>
      </div>

      {/* Quick Add */}
      <div className={cn('px-3 pt-4 pb-2', collapsed && 'px-2')}>
        {collapsed ? (
          <Tooltip content="New Note (N)">
            <button
              onClick={onQuickAdd}
              className="w-full h-9 flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </Tooltip>
        ) : (
          <Button onClick={onQuickAdd} className="w-full" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
            New Note
          </Button>
        )}
      </div>

      {/* Main Nav */}
      <nav className={cn('px-2 space-y-0.5 flex-1 overflow-y-auto', collapsed && 'px-1')}>
        {mainNav.map(item =>
          collapsed ? (
            <Tooltip key={item.to} content={item.label}>
              <div>{navItem(item.to, item.label, item.icon, item.end)}</div>
            </Tooltip>
          ) : navItem(item.to, item.label, item.icon, item.end)
        )}

        {/* Sections */}
        {!collapsed && (
          <div className="pt-4">
            <div className="px-3 pb-1.5 flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                My Sections
              </span>
              <button
                onClick={() => navigate('/sections/new')}
                className="w-5 h-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                title="Create section"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {isLoading ? (
              <div className="px-3 py-2">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            ) : sections.length === 0 ? (
              <p className="px-3 text-xs text-muted-foreground py-1">No sections yet</p>
            ) : (
              sections.map(section => (
                <NavLink
                  key={section.id}
                  to={`/sections/${section.id}`}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm transition-colors duration-150',
                      'hover:bg-secondary hover:text-foreground',
                      isActive
                        ? 'bg-accent text-accent-foreground font-medium'
                        : 'text-muted-foreground'
                    )
                  }
                >
                  <span className="text-base">{section.icon}</span>
                  <span className="truncate flex-1">{section.name}</span>
                  {section.noteCount !== undefined && (
                    <span className="text-xs text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-md">
                      {section.noteCount}
                    </span>
                  )}
                </NavLink>
              ))
            )}
          </div>
        )}

        {collapsed && (
          <div className="pt-2 space-y-0.5">
            <Tooltip content="My Sections">
              <NavLink
                to="/sections"
                className={({ isActive }) =>
                  cn(
                    'flex items-center justify-center h-9 rounded-lg text-sm transition-colors',
                    'hover:bg-secondary hover:text-foreground',
                    isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
                  )
                }
              >
                <FolderOpen className="w-4 h-4" />
              </NavLink>
            </Tooltip>
          </div>
        )}
      </nav>

      {/* Bottom */}
      <div className={cn('border-t border-[hsl(var(--sidebar-border))] p-2 space-y-0.5', collapsed && 'px-1')}>
        {collapsed ? (
          <>
            <Tooltip content="Settings">
              <NavLink
                to="/settings"
                className={({ isActive }) =>
                  cn(
                    'flex items-center justify-center h-9 rounded-lg transition-colors',
                    'hover:bg-secondary text-muted-foreground hover:text-foreground',
                    isActive && 'bg-accent text-accent-foreground'
                  )
                }
              >
                <Settings className="w-4 h-4" />
              </NavLink>
            </Tooltip>
            <Tooltip content="Logout">
              <button
                onClick={handleLogout}
                className="w-full h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </Tooltip>
          </>
        ) : (
          <>
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  'hover:bg-secondary hover:text-foreground',
                  isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
                )
              }
            >
              <Settings className="w-4 h-4 shrink-0" />
              <span>Settings</span>
            </NavLink>

            <div className="flex items-center gap-2 px-3 py-2">
              <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        )}

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'w-full flex items-center justify-center h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors text-xs gap-1',
            collapsed ? '' : 'mt-1'
          )}
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : (
            <>
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
