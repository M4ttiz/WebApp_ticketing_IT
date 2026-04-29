import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '../lib/utils'

const TABS = [
  { to: '/users', label: 'Utenti', match: (p) => p === '/users' },
  { to: '/categories', label: 'Categorie', match: (p) => p === '/categories' },
  { to: '/settings', label: 'Sistema', match: (p) => p.startsWith('/settings') },
]

export default function AdminTabs({ className }) {
  const { pathname } = useLocation()
  return (
    <nav className={cn('flex flex-wrap gap-1 border-b border-border-subtle', className)} aria-label="Sezioni amministrazione">
      {TABS.map((tab) => {
        const active = tab.match(pathname)
        return (
          <Link
            key={tab.to}
            to={tab.to}
            className={cn(
              '-mb-px rounded-t-ds px-4 py-2.5 text-sm font-medium transition-colors duration-150',
              active ? 'border border-b-0 border-border-subtle bg-surface-card text-text-primary' : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
