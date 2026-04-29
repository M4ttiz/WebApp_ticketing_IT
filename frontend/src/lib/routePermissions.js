import { normalizeRole } from './roles'

/**
 * Route canoniche → ruoli ammessi (dopo normalizzazione: technician → agent).
 */
export const ROUTE_PERMISSIONS = {
  '/dashboard': ['admin', 'user', 'viewer'],
  '/tickets': ['admin', 'agent', 'user'],
  '/tickets/new': ['admin', 'agent', 'user'],
  '/tickets/:id': ['admin', 'agent', 'user'],
  '/profile': ['admin', 'agent', 'user'],
  '/users': ['admin'],
  '/categories': ['admin'],
  '/settings': ['admin'],
  '/settings/asset-categories': ['admin'],
  '/inventory': ['admin', 'agent'],
  '/inventory/:id': ['admin', 'agent'],
}

function pathToPattern(pathname) {
  const p = pathname.replace(/\/$/, '') || '/'
  if (ROUTE_PERMISSIONS[p]) return p
  if (p.startsWith('/settings/asset-categories')) return '/settings/asset-categories'
  if (p.startsWith('/settings')) return '/settings'
  if (p === '/tickets/new') return '/tickets/new'
  if (p.startsWith('/tickets/')) return '/tickets/:id'
  if (p.startsWith('/inventory/')) return '/inventory/:id'
  return null
}

export function getAllowedRolesForPath(pathname) {
  const pattern = pathToPattern(pathname)
  if (!pattern) return null
  return ROUTE_PERMISSIONS[pattern] ?? null
}

export function canAccessPath(pathname, role) {
  const allowed = getAllowedRolesForPath(pathname)
  if (!allowed) return { ok: false }
  const nr = normalizeRole(role)
  return { ok: allowed.includes(nr) }
}

export function redirectForForbiddenRole(role) {
  const nr = normalizeRole(role)
  if (nr === 'viewer') return '/dashboard'
  return '/tickets'
}
