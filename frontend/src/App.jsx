import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import TicketsList from './pages/TicketsList'
import TicketDetail from './pages/TicketDetail'
import NewTicket from './pages/NewTicket'
import Users from './pages/Users'
import Settings from './pages/Settings'
import AssetCategoriesAdmin from './pages/AssetCategoriesAdmin'
import Profile from './pages/Profile'
import Categories from './pages/Categories'
import Inventory from './pages/Inventory'
import AssetDetail from './pages/AssetDetail'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import RoutePermissionGuard, { HomeRedirect } from './components/RoutePermissionGuard'

function App() {
  const { user, isInitializing } = useAuth()

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-main text-text-primary">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-border-subtle border-t-accent" />
      </div>
    )
  }

  return (
    <>
      <Toaster
        position="bottom-right"
        duration={4000}
        richColors={false}
        toastOptions={{
          classNames: {
            toast:
              'group toast bg-surface-elevated border border-border-subtle text-text-primary shadow-elevated rounded-ds',
            title: 'text-text-primary font-medium',
            description: 'text-text-secondary text-sm',
            success: '!border-l-[3px] !border-l-semantic-success',
            error: '!border-l-[3px] !border-l-semantic-danger',
            warning: '!border-l-[3px] !border-l-semantic-warning',
          },
        }}
      />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route element={<RoutePermissionGuard />}>
              <Route path="/" element={<HomeRedirect />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/tickets" element={<TicketsList />} />
              <Route path="/tickets/new" element={<NewTicket />} />
              <Route path="/tickets/:id" element={<TicketDetail />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/users" element={<Users />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/settings/asset-categories" element={<AssetCategoriesAdmin />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/inventory/:id" element={<AssetDetail />} />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default App
