import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ roles }) {
  const { user } = useAuth()
  if (!user) {
    return <Navigate to="/login" />
  }
  if (roles && !roles.includes(user.role)) {
    return <div className="p-6">Accesso negato</div>
  }
  return <Outlet />
}
