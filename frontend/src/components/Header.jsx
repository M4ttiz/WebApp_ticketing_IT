import React, { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Bell, Check, CheckCheck, Search } from 'lucide-react'
import api from '../api/axios'
import { cn } from '../lib/utils'

const SEGMENT_LABELS = {
  dashboard: 'Dashboard',
  tickets: 'Ticket',
  new: 'Nuovo',
  profile: 'Profilo',
  users: 'Utenti',
  categories: 'Categorie',
  settings: 'Impostazioni',
  inventory: 'Inventario',
  'asset-categories': 'Categorie asset',
}

function breadcrumbsFromPath(pathname) {
  const parts = pathname.replace(/^\//, '').split('/').filter(Boolean)
  const crumbs = []
  let acc = ''
  parts.forEach((seg, i) => {
    acc += `/${seg}`
    const label =
      SEGMENT_LABELS[seg] ||
      (i === parts.length - 1 && /^[a-f0-9-]{8,}$/i.test(seg) ? 'Dettaglio' : seg.replace(/-/g, ' '))
    crumbs.push({ to: acc, label, isLast: i === parts.length - 1 })
  })
  return crumbs
}

export default function Header() {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const searchRef = useRef(null)
  const [q, setQ] = useState('')
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!user) return
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [user])

  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  async function fetchNotifications() {
    try {
      const res = await api.get('/notifications?unreadOnly=true&limit=10')
      setNotifications(res.data.notifications)
      setUnreadCount(res.data.unreadCount)
    } catch {
      // silent
    }
  }

  async function markRead(id) {
    try {
      await api.patch(`/notifications/${id}/read`)
      fetchNotifications()
    } catch {
      /* noop */
    }
  }

  async function markAllRead() {
    try {
      await api.patch('/notifications/read-all')
      fetchNotifications()
    } catch {
      /* noop */
    }
  }

  function submitSearch(e) {
    e.preventDefault()
    const term = q.trim()
    if (!term) return
    navigate(`/tickets?search=${encodeURIComponent(term)}`)
    setQ('')
  }

  if (!user) return null

  const crumbs = breadcrumbsFromPath(location.pathname)

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border-subtle bg-surface-main px-4 sm:px-6">
      <nav className="hidden min-w-0 flex-1 items-center gap-2 text-sm md:flex" aria-label="Breadcrumb">
        {crumbs.length === 0 ? (
          <span className="truncate text-text-primary">Home</span>
        ) : (
          crumbs.map((c, i) => (
            <span key={c.to} className="flex min-w-0 items-center gap-2">
              {i > 0 && <span className="text-text-disabled">&rsaquo;</span>}
              {c.isLast ? (
                <span className="truncate font-medium capitalize text-text-primary">{c.label}</span>
              ) : (
                <Link to={c.to} className="truncate capitalize text-text-secondary transition-colors hover:text-text-primary">
                  {c.label}
                </Link>
              )}
            </span>
          ))
        )}
      </nav>

      <form onSubmit={submitSearch} className="mx-auto hidden max-w-md flex-1 md:block">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" aria-hidden />
          <input
            ref={searchRef}
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cerca ovunque…"
            className="w-full rounded-ds border border-border-subtle bg-surface-card py-2 pl-10 pr-16 text-sm text-text-primary placeholder:text-text-disabled focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-accent/20"
            aria-label="Ricerca globale"
          />
          <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-border-subtle bg-surface-hover px-1.5 py-0.5 text-[10px] font-medium text-text-secondary sm:inline-block">
            Ctrl K
          </kbd>
        </div>
      </form>

      <div className="flex flex-1 items-center justify-end gap-2 md:flex-none">
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="relative rounded-ds p-2 text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
            aria-label="Apri notifiche"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-semantic-danger px-0.5 text-[10px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-ds border border-border-subtle bg-surface-card shadow-elevated">
              <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
                <span className="text-sm font-semibold text-text-primary">Notifiche</span>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="flex items-center gap-1 text-xs font-medium text-accent hover:text-accent-hover"
                  >
                    <CheckCheck size={14} /> Leggi tutte
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-text-secondary">Nessuna notifica</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={cn(
                        'border-b border-border-subtle/80 px-4 py-3 transition-colors hover:bg-surface-hover',
                        n.isRead && 'opacity-60'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium text-text-primary">{n.title}</div>
                          <div className="line-clamp-2 text-xs text-text-secondary">{n.message}</div>
                        </div>
                        {!n.isRead && (
                          <button
                            type="button"
                            onClick={() => markRead(n.id)}
                            className="shrink-0 text-accent hover:text-accent-hover"
                            aria-label="Segna come letto"
                          >
                            <Check size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <Link
          to="/profile"
          className="flex items-center gap-2 rounded-ds px-2 py-1.5 transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
            {user.firstName?.[0]}
            {user.lastName?.[0]}
          </div>
          <div className="hidden text-left text-sm sm:block">
            <div className="font-medium text-text-primary">
              {user.firstName} {user.lastName}
            </div>
            <div className="text-xs capitalize text-text-secondary">{user.role}</div>
          </div>
        </Link>
      </div>
    </header>
  )
}
