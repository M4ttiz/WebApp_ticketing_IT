import React, { useEffect, useState } from 'react'
import api from '../api/axios'
import AdminTabs from '../components/AdminTabs'
import Button from '../components/ui/Button'
import { toast } from 'sonner'
import { Mail, Server, Save, TestTube } from 'lucide-react'
import { ui } from '../lib/utils'

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
      <AdminTabs className="mb-2" />

      <div>
        <h1 className="text-[20px] font-semibold tracking-tight text-text-primary">Impostazioni</h1>
        <p className={ui.subtleText}>Configura il server SMTP per le notifiche email</p>
      </div>

      <div className={`${ui.cardSection} space-y-5`}>
        <div className="mb-2 flex items-center gap-2">
          <Mail size={18} className="text-accent" aria-hidden />
          <h3 className="font-semibold text-text-primary">Configurazione SMTP</h3>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={ui.label}>Host</label>
            <div className="relative">
              <Server size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" aria-hidden />
              <input
                value={config.host}
                onChange={(e) => update('host', e.target.value)}
                placeholder="smtp.example.com"
                className={`${ui.input} pl-9`}
              />
            </div>
          </div>
          <div>
            <label className={ui.label}>Porta</label>
            <input type="number" value={config.port} onChange={(e) => update('port', e.target.value)} className={ui.input} />
          </div>
          <div>
            <label className={ui.label}>User</label>
            <input value={config.user} onChange={(e) => update('user', e.target.value)} className={ui.input} />
          </div>
          <div>
            <label className={ui.label}>Password</label>
            <input type="password" value={config.pass} onChange={(e) => update('pass', e.target.value)} className={ui.input} />
          </div>
          <div className="sm:col-span-2">
            <label className={ui.label}>From</label>
            <input
              value={config.from}
              onChange={(e) => update('from', e.target.value)}
              placeholder="IT Ticketing <noreply@example.com>"
              className={ui.input}
            />
          </div>
          <label className="inline-flex cursor-pointer select-none items-center gap-2 text-sm text-text-secondary sm:col-span-2">
            <input
              type="checkbox"
              checked={config.secure}
              onChange={(e) => update('secure', e.target.checked)}
              className="rounded border-border-subtle bg-surface-card text-accent focus:ring-accent/30"
            />
            Usa connessione sicura (TLS/SSL)
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={save} disabled={loading}>
            {loading ? (
              'Salvataggio…'
            ) : (
              <>
                <Save size={16} /> Salva
              </>
            )}
          </Button>
          <Button type="button" variant="secondary" onClick={test}>
            <TestTube size={16} /> Test
          </Button>
        </div>
      </div>
    </div>
  )
}
