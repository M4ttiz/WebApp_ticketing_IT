import React, { useEffect, useState } from 'react'
import api from '../api/axios'
import { toast } from 'sonner'
import { Mail, Server, Save, TestTube } from 'lucide-react'

export default function Settings() {
  const [config, setConfig] = useState({ host: '', port: 587, secure: false, user: '', pass: '', from: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/settings/smtp').then((r) => setConfig(r.data)).catch(() => {})
  }, [])

  const update = (field, value) => setConfig((p) => ({ ...p, [field]: value }))

  const save = async () => {
    setLoading(true)
    try {
      await api.put('/settings/smtp', config)
      toast.success('Configurazione SMTP salvata')
    } catch (e) {
      toast.error('Errore nel salvataggio')
    } finally {
      setLoading(false)
    }
  }

  const test = async () => {
    try {
      await api.post('/settings/smtp/test', config)
      toast.success('Connessione SMTP riuscita')
    } catch (e) {
      toast.error(e.response?.data?.error || 'Test fallito')
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Impostazioni</h1>
        <p className="text-slate-400 text-sm">Configura il server SMTP per le notifiche email</p>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-2 mb-2">
          <Mail size={18} className="text-primary-400" />
          <h3 className="font-semibold">Configurazione SMTP</h3>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Host</label>
            <div className="relative">
              <Server size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input value={config.host} onChange={(e) => update('host', e.target.value)} placeholder="smtp.example.com" className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Porta</label>
            <input type="number" value={config.port} onChange={(e) => update('port', e.target.value)} className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">User</label>
            <input value={config.user} onChange={(e) => update('user', e.target.value)} className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Password</label>
            <input type="password" value={config.pass} onChange={(e) => update('pass', e.target.value)} className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs text-slate-400 mb-1">From</label>
            <input value={config.from} onChange={(e) => update('from', e.target.value)} placeholder="IT Ticketing <noreply@example.com>" className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm" />
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-slate-300 cursor-pointer select-none sm:col-span-2">
            <input type="checkbox" checked={config.secure} onChange={(e) => update('secure', e.target.checked)} className="rounded border-slate-600 bg-slate-900 text-primary-500" />
            Usa connessione sicura (TLS/SSL)
          </label>
        </div>

        <div className="flex gap-2">
          <button onClick={save} disabled={loading} className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
            <Save size={16} /> {loading ? 'Salvataggio...' : 'Salva'}
          </button>
          <button onClick={test} className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors">
            <TestTube size={16} /> Test
          </button>
        </div>
      </div>
    </div>
  )
}

