import React from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { canAccessPath, redirectForForbiddenRole } from '../lib/routePermissions'
import { normalizeRole } from '../lib/roles'

/**
 * Controlla i permessi per path in base a ROUTE_PERMISSIONS.
 * Deve avvolgere le route autenticate sotto Layout.
 */
export default function RoutePermissionGuard() {
  const { user } = useAuth()
  const location = useLocation()
  const pathname = location.pathname
  const role = user?.role

  if (pathname === '/' || pathname === '') {
    return <Outlet />
  }

  const { ok } = canAccessPath(pathname, role)
  if (ok) return <Outlet />

  const nr = normalizeRole(role)
  const to = redirectForForbiddenRole(nr)
  return <Navigate to={to} replace state={{ from: pathname }} />
}

export function HomeRedirect() {
  const { user } = useAuth()
  const nr = normalizeRole(user?.role)
  if (nr === 'agent') {
    return <Navigate to="/tickets" replace />
  }
  return <Navigate to="/dashboard" replace />
}
