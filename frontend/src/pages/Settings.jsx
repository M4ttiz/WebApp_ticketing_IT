import React, { useEffect, useState } from 'react'
import api from '../api/axios'

export default function Settings(){
  const [config, setConfig] = useState({ host:'', port:587, secure:false, user:'', pass:'', from:'' })
  const [msg, setMsg] = useState('')

  useEffect(()=>{
    api.get('/api/settings/smtp').then(r=>setConfig(r.data)).catch(()=>{})
  },[])

  const save = async () => {
    await api.put('/api/settings/smtp', config)
    setMsg('Salvato')
  }

  const test = async () => {
    try {
      await api.post('/api/settings/smtp/test', config)
      setMsg('Connessione SMTP OK')
    } catch (e) { setMsg('Test fallito: ' + e.message) }
  }

  return (
    <div className="max-w-2xl bg-slate-800 p-6 rounded border border-slate-700">
      <h2 className="text-xl font-semibold mb-4">Impostazioni SMTP</h2>
      <div className="space-y-3">
        <input value={config.host} onChange={e=>setConfig({...config, host:e.target.value})} placeholder="Host" className="w-full p-2 bg-slate-900 rounded" />
        <input value={config.port} onChange={e=>setConfig({...config, port:e.target.value})} placeholder="Porta" className="w-full p-2 bg-slate-900 rounded" />
        <input value={config.user} onChange={e=>setConfig({...config, user:e.target.value})} placeholder="User" className="w-full p-2 bg-slate-900 rounded" />
        <input value={config.pass} onChange={e=>setConfig({...config, pass:e.target.value})} placeholder="Pass" className="w-full p-2 bg-slate-900 rounded" />
        <input value={config.from} onChange={e=>setConfig({...config, from:e.target.value})} placeholder="From" className="w-full p-2 bg-slate-900 rounded" />
        <div className="flex gap-2">
          <button onClick={save} className="bg-primary-500 text-white px-3 py-1 rounded">Salva</button>
          <button onClick={test} className="bg-slate-700 text-white px-3 py-1 rounded">Test</button>
        </div>
        {msg && <div className="text-sm text-slate-300">{msg}</div>}
      </div>
    </div>
  )
}
