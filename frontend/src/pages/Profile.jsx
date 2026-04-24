import React, { useEffect, useState } from 'react'
import api from '../api/axios'
import { toast } from 'sonner'
import { User, Mail, Lock, Save } from 'lucide-react'

export default function Profile() {
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', department: '' })
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' })
  const [loading, setLoading] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)

  useEffect(() => {
    api.get('/users/me').then((r) => {
      setProfile(r.data)
      setForm({
        firstName: r.data.firstName || '',
        lastName: r.data.lastName || '',
        email: r.data.email || '',
        department: r.data.department || '',
      })
    }).catch(() => {})
  }, [])

  const updateField = (field, value) => setForm((p) => ({ ...p, [field]: value }))

  const saveProfile = async () => {
    setLoading(true)
    try {
      const res = await api.patch('/users/me', form)
      setProfile(res.data)
      toast.success('Profilo aggiornato')
    } catch (e) {
      toast.error(e.response?.data?.error || 'Errore nell\'aggiornamento')
    } finally {
      setLoading(false)
    }
  }

  const changePassword = async () => {
    if (passwordForm.newPassword.length < 8) {
      toast.error('La nuova password deve avere almeno 8 caratteri')
      return
    }
    setPwLoading(true)
    try {
      await api.patch('/users/me/password', passwordForm)
      toast.success('Password aggiornata')
      setPasswordForm({ currentPassword: '', newPassword: '' })
    } catch (e) {
      toast.error(e.response?.data?.error || 'Errore nel cambio password')
    } finally {
      setPwLoading(false)
    }
  }

  if (!profile) {
    return (
      <div className="space-y-4 max-w-2xl">
        <div className="h-8 w-40 bg-slate-700 rounded animate-pulse" />
        <div className="h-64 bg-slate-700 rounded animate-pulse" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profilo</h1>
        <p className="text-slate-400 text-sm">Gestisci i tuoi dati e la password</p>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-16 h-16 rounded-full bg-primary-500 flex items-center justify-center text-xl font-bold text-white">
            {profile.firstName?.[0]}{profile.lastName?.[0]}
          </div>
          <div>
            <div className="text-lg font-semibold">{profile.firstName} {profile.lastName}</div>
            <div className="text-sm text-slate-400 capitalize">{profile.role}</div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Nome</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input value={form.firstName} onChange={(e) => updateField('firstName', e.target.value)} className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Cognome</label>
            <input value={form.lastName} onChange={(e) => updateField('lastName', e.target.value)} className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Dipartimento</label>
            <input value={form.department} onChange={(e) => updateField('department', e.target.value)} className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm" />
          </div>
        </div>

        <button
          onClick={saveProfile}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Save size={16} /> {loading ? 'Salvataggio...' : 'Salva modifiche'}
        </button>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-5">
        <h3 className="font-semibold flex items-center gap-2">
          <Lock size={18} className="text-primary-400" /> Cambia password
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Password attuale</label>
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Nuova password</label>
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm"
            />
          </div>
        </div>
        <button
          onClick={changePassword}
          disabled={pwLoading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Lock size={16} /> {pwLoading ? 'Aggiornamento...' : 'Aggiorna password'}
        </button>
      </div>
    </div>
  )
}

