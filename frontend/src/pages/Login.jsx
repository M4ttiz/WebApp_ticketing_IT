import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { Mail, Lock, Loader2, Ticket } from 'lucide-react'
import { toast } from 'sonner'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const validate = () => {
    const e = {}
    if (!email.trim()) e.email = 'Email obbligatoria'
    else if (!/^\S+@\S+\.\S+$/.test(email)) e.email = 'Email non valida'
    if (!password) e.password = 'Password obbligatoria'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await login(email, password)
      toast.success('Login effettuato')
      navigate('/')
    } catch (err) {
      const status = err.response?.status
      const msg = err.response?.data?.error || 'Errore di login'
      if (status === 401) {
        toast.error('Credenziali non valide')
        setErrors({ general: 'Credenziali non valide' })
      } else if (status === 403) {
        toast.error('Account disabilitato')
        setErrors({ general: 'Account disabilitato' })
      } else {
        toast.error(msg)
        setErrors({ general: msg })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-primary-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-primary-500/20">
              <Ticket size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">IT Ticketing</h1>
            <p className="text-sm text-slate-400 mt-1">Accedi alla piattaforma</p>
          </div>

          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: null, general: null })) }}
                  className={`w-full pl-10 pr-3 py-2.5 rounded-lg bg-slate-900 border text-sm transition-colors ${
                    errors.email ? 'border-rose-500 focus:border-rose-500' : 'border-slate-700 focus:border-primary-500'
                  }`}
                  placeholder="you@company.com"
                />
              </div>
              {errors.email && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-rose-400 mt-1.5">
                  {errors.email}
                </motion.p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: null, general: null })) }}
                  className={`w-full pl-10 pr-3 py-2.5 rounded-lg bg-slate-900 border text-sm transition-colors ${
                    errors.password ? 'border-rose-500 focus:border-rose-500' : 'border-slate-700 focus:border-primary-500'
                  }`}
                  placeholder="••••••••"
                />
              </div>
              {errors.password && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-rose-400 mt-1.5">
                  {errors.password}
                </motion.p>
              )}
            </div>

            {errors.general && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-sm text-rose-400">
                {errors.general}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-60 disabled:hover:bg-primary-500 text-white font-medium py-2.5 rounded-lg transition-colors"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : 'Accedi'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}

