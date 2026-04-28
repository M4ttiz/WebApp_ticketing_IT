import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard,
  Ticket,
  Users,
  Settings,
  FolderKanban,
  Tags,
  Server,
  Menu,
  X,
  LogOut,
} from 'lucide-react'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'technician'] },
  { to: '/tickets', label: 'Ticket', icon: Ticket, roles: ['admin', 'technician', 'user'] },
  { to: '/users', label: 'Utenti', icon: Users, roles: ['admin'] },
  { to: '/categories', label: 'Categorie', icon: FolderKanban, roles: ['admin'] },
  { to: '/settings', label: 'Impostazioni', icon: Settings, roles: ['admin'] },
  { to: '/settings/asset-categories', label: 'Categorie Asset', icon: Tags, roles: ['admin'] },
  { to: '/inventory', label: 'Inventario IT', icon: Server, roles: ['admin', 'technician'] },
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
        className="fixed left-3 top-3 z-50 rounded-md border border-slate-700 bg-slate-800 p-2 lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label={mobileOpen ? 'Chiudi menu' : 'Apri menu'}
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
        className={`fixed inset-y-0 left-0 z-40 flex w-64 transform flex-col border-r border-slate-700 bg-slate-800 transition-transform duration-300 ease-in-out lg:static ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center gap-3 border-b border-slate-700/60 px-5 py-4">
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center font-bold text-white">
            IT
          </div>
          <span className="text-lg font-semibold">Ticketing</span>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {filteredNav.map((item) => {
            const active = location.pathname === item.to || location.pathname.startsWith(item.to + '/')
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-primary-500/15 text-primary-300 ring-1 ring-primary-500/30'
                    : 'text-slate-300 hover:bg-slate-700/70 hover:text-white'
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-slate-700/60 p-3">
          <Link
            to="/profile"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-700/70 hover:text-white"
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
            className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-rose-400 transition-colors hover:bg-rose-500/10"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>
    </>
  )
}

