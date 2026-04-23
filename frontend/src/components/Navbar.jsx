import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  return (
    <header className="bg-slate-800 border-b border-slate-700">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/" className="text-white font-semibold text-lg">IT Ticketing</Link>
          {user && <Link to="/tickets" className="text-slate-300 hover:text-white">Ticket</Link>}
          {user && (user.role === 'admin') && <Link to="/users" className="text-slate-300 hover:text-white">Utenti</Link>}
        </div>
        <div className="flex items-center space-x-4">
          {!user && <Link to="/login" className="text-slate-300">Login</Link>}
          {user && (
            <>
              <span className="text-slate-300">{user.firstName} {user.lastName}</span>
              <button onClick={logout} className="bg-primary-500 text-white px-3 py-1 rounded">Logout</button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
