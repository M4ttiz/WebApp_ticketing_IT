import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const { login } = useAuth()
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Errore di login')
    }
  }

  return (
    <div className="max-w-md mx-auto mt-12 bg-slate-800 p-6 rounded border border-slate-700">
      <h2 className="text-2xl font-semibold mb-4">Login</h2>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm text-slate-300">Email</label>
          <input value={email} onChange={(e)=>setEmail(e.target.value)} className="w-full mt-1 p-2 rounded bg-slate-900 border border-slate-700" />
        </div>
        <div>
          <label className="block text-sm text-slate-300">Password</label>
          <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} className="w-full mt-1 p-2 rounded bg-slate-900 border border-slate-700" />
        </div>
        {error && <div className="text-sm text-rose-400">{error}</div>}
        <div>
          <button type="submit" className="w-full bg-primary-500 text-white p-2 rounded">Accedi</button>
        </div>
      </form>
    </div>
  )
}
