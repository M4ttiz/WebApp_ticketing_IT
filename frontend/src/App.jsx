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
import Profile from './pages/Profile'
import Categories from './pages/Categories'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'

function App() {
  const { user, isInitializing } = useAuth()

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-100">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500" />
      </div>
    )
  }

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#f1f5f9',
            border: '1px solid #334155',
          },
        }}
      />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={user?.role === 'user' ? <Navigate to="/tickets" replace /> : <Dashboard />} />
            <Route path="/tickets" element={<TicketsList />} />
            <Route path="/tickets/new" element={<NewTicket />} />
            <Route path="/tickets/:id" element={<TicketDetail />} />
            <Route path="/profile" element={<Profile />} />
            <Route element={<ProtectedRoute roles={['admin']} />}>
              <Route path="/users" element={<Users />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default App

