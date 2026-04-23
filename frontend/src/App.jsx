import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import TicketsList from './pages/TicketsList'
import TicketDetail from './pages/TicketDetail'
import NewTicket from './pages/NewTicket'
import Users from './pages/Users'
import Settings from './pages/Settings'
import Profile from './pages/Profile'
import Navbar from './components/Navbar'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  const { loading } = useAuth()
  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <Navbar />
      <main className="p-6 max-w-6xl mx-auto">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}> 
            <Route path="/" element={<Dashboard />} />
            <Route path="/tickets" element={<TicketsList />} />
            <Route path="/tickets/new" element={<NewTicket />} />
            <Route path="/tickets/:id" element={<TicketDetail />} />
            <Route path="/users" element={<Users />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
