import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Bell, Check, CheckCheck } from 'lucide-react'
import api from '../api/axios'

export default function Header() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!user) return
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [user])

  async function fetchNotifications() {
    try {
      const res = await api.get('/notifications?unreadOnly=true&limit=10')
      setNotifications(res.data.notifications)
      setUnreadCount(res.data.unreadCount)
    } catch (e) {
      // silent
    }
  }

  async function markRead(id) {
    try {
      await api.patch(`/notifications/${id}/read`)
      fetchNotifications()
    } catch (e) {}
  }

  async function markAllRead() {
    try {
      await api.patch('/notifications/read-all')
      fetchNotifications()
    } catch (e) {}
  }

  if (!user) return null

  return (
    <header className="flex h-16 items-center justify-end gap-3 border-b border-slate-700 bg-slate-800/80 px-4 sm:px-6">
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="relative rounded-lg p-2 transition-colors hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
          aria-label="Apri notifiche"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>

        {open && (
          <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-slate-700 bg-slate-800 shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
              <span className="font-semibold text-sm">Notifiche</span>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">
                  <CheckCheck size={14} /> Leggi tutte
                </button>
              )}
            </div>
            <div className="max-h-72 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-6 text-sm text-slate-400 text-center">Nessuna notifica</div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`px-4 py-3 border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors ${n.isRead ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{n.title}</div>
                        <div className="text-xs text-slate-400 line-clamp-2">{n.message}</div>
                      </div>
                      {!n.isRead && (
                        <button onClick={() => markRead(n.id)} className="text-primary-400 hover:text-primary-300 shrink-0">
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
        className="flex items-center gap-3 rounded-lg px-2 py-1 transition-colors hover:bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
      >
        <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-xs font-bold text-white">
          {user.firstName?.[0]}{user.lastName?.[0]}
        </div>
        <div className="hidden sm:block text-sm">
          <div className="font-medium">{user.firstName} {user.lastName}</div>
          <div className="text-xs text-slate-400 capitalize">{user.role}</div>
        </div>
      </Link>
    </header>
  )
}

