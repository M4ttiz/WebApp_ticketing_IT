import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard,
  Ticket,
  Users,
  Settings,
  FolderKanban,
  Menu,
  X,
  LogOut,
} from 'lucide-react'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'technician', 'user'] },
  { to: '/tickets', label: 'Ticket', icon: Ticket, roles: ['admin', 'technician', 'user'] },
  { to: '/users', label: 'Utenti', icon: Users, roles: ['admin'] },
  { to: '/categories', label: 'Categorie', icon: FolderKanban, roles: ['admin'] },
  { to: '/settings', label: 'Impostazioni', icon: Settings, roles: ['admin'] },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  if (!user) return null

  const filteredNav = navItems.filter((n) => n.roles.includes(user.role))

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-slate-800 rounded-md border border-slate-700"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40 w-64 bg-slate-800 border-r border-slate-700
          transform transition-transform duration-300 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col
        `}
      >
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center font-bold text-white">
            IT
          </div>
          <span className="text-lg font-semibold">Ticketing</span>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {filteredNav.map((item) => {
            const active = location.pathname === item.to || location.pathname.startsWith(item.to + '/')
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${active ? 'bg-primary-500/10 text-primary-400' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}
                `}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <Link
            to="/profile"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-xs font-semibold">
              {user.firstName?.[0]}{user.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="truncate font-medium">{user.firstName} {user.lastName}</div>
              <div className="truncate text-xs text-slate-400 capitalize">{user.role}</div>
            </div>
          </Link>
          <button
            onClick={logout}
            className="mt-2 w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>
    </>
  )
}

