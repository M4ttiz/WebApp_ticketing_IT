import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { normalizeRole } from '../lib/roles'
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
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '../lib/utils'

const SECTIONS = [
  {
    heading: 'GESTIONE',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'user', 'viewer'] },
      {
        to: '/tickets',
        label: 'Ticket',
        labelUser: 'I miei Ticket',
        icon: Ticket,
        roles: ['admin', 'agent', 'user'],
      },
    ],
  },
  {
    heading: 'OPERAZIONI',
    items: [{ to: '/inventory', label: 'Inventario IT', icon: Server, roles: ['admin', 'agent'] }],
  },
  {
    heading: 'SISTEMA',
    items: [
      { to: '/users', label: 'Utenti', icon: Users, roles: ['admin'] },
      { to: '/categories', label: 'Categorie', icon: FolderKanban, roles: ['admin'] },
      { to: '/settings', label: 'Impostazioni', icon: Settings, roles: ['admin'] },
      { to: '/settings/asset-categories', label: 'Categorie Asset', icon: Tags, roles: ['admin'] },
    ],
  },
]

function isNavActive(pathname, item) {
  if (item.to === '/dashboard') return pathname === '/dashboard' || pathname === '/'
  if (item.to === '/tickets') return pathname === '/tickets' || pathname.startsWith('/tickets/')
  if (item.to === '/settings') return pathname === '/settings'
  if (item.to === '/settings/asset-categories') return pathname.startsWith('/settings/asset-categories')
  return pathname === item.to || pathname.startsWith(`${item.to}/`)
}

export default function Sidebar() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const pathname = location.pathname
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebar-collapsed') === '1')

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', collapsed ? '1' : '0')
  }, [collapsed])

  if (!user) return null

  const nr = normalizeRole(user.role)

  const filteredSections = SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => item.roles.includes(nr)),
  })).filter((s) => s.items.length > 0)

  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.trim() || '?'

  return (
    <>
      <button
        type="button"
        className="fixed left-3 top-3 z-50 rounded-ds border border-border-subtle bg-surface-card p-2 shadow-card lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label={mobileOpen ? 'Chiudi menu' : 'Apri menu'}
      >
        {mobileOpen ? <X size={20} className="text-text-primary" /> : <Menu size={20} className="text-text-primary" />}
      </button>

      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          aria-label="Chiudi overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex transform flex-col border-r border-border-subtle bg-surface-sidebar transition-all duration-300 ease-in-out lg:static',
          collapsed ? 'w-16' : 'w-[240px]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex h-14 items-center gap-2 border-b border-border-subtle px-3">
          <div className="flex min-w-0 flex-1 items-center gap-2.5 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-ds bg-accent/15 ring-1 ring-accent/25">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden className="text-accent">
                <path d="M4 7h16v10H4V7z" stroke="currentColor" strokeWidth="1.5" />
                <path d="M8 11h8M8 14h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <div className="truncate text-[15px] font-semibold tracking-tight text-text-primary">Ticketing IT</div>
                <div className="truncate text-[10px] font-medium uppercase tracking-wide text-text-disabled">Helpdesk</div>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="hidden rounded-ds p-1 text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary lg:inline-flex"
            aria-label={collapsed ? 'Espandi sidebar' : 'Comprimi sidebar'}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-4">
          {filteredSections.map((section) => (
            <div key={section.heading} className="mb-6">
              {!collapsed && (
                <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wide text-text-disabled">{section.heading}</div>
              )}
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const active = isNavActive(pathname, item)
                  const label =
                    nr === 'user' && item.labelUser ? item.labelUser : item.label
                  const Icon = item.icon
                  return (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        onClick={() => setMobileOpen(false)}
                        title={collapsed ? label : undefined}
                        className={cn(
                          'group flex h-10 items-center gap-3 rounded-ds border-l-[3px] px-3 text-sm font-medium transition-colors duration-150',
                          active
                            ? 'border-accent bg-surface-hover text-text-primary'
                            : 'border-transparent text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                        )}
                      >
                        <Icon size={18} className="shrink-0 opacity-90" aria-hidden />
                        {!collapsed && <span className="truncate">{label}</span>}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-border-subtle p-3">
          <div
            className={cn(
              'flex items-start gap-3 rounded-ds px-2 py-2 transition-colors duration-150 hover:bg-surface-hover',
              collapsed && 'justify-center px-0'
            )}
          >
            <div className="relative shrink-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-hover text-xs font-semibold text-text-primary ring-1 ring-border-subtle">
                {initials}
              </div>
              <span
                className="absolute bottom-0 right-0 h-2 w-2 rounded-full border-2 border-surface-sidebar bg-semantic-success"
                title="Online"
                aria-hidden
              />
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-text-primary">
                  {user.firstName} {user.lastName}
                </div>
                <div className="truncate text-xs capitalize text-text-secondary">{nr}</div>
                {nr === 'viewer' && (
                  <div className="mt-1 inline-block rounded-ds-sm bg-surface-hover px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-text-secondary">
                    Sola lettura
                  </div>
                )}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={logout}
            className={cn(
              'mt-2 flex w-full items-center gap-3 rounded-ds px-3 py-2 text-sm text-semantic-danger transition-colors duration-150 hover:bg-semantic-danger/10',
              collapsed && 'justify-center px-2'
            )}
          >
            <LogOut size={18} />
            {!collapsed && 'Logout'}
          </button>
        </div>
      </aside>
    </>
  )
}
