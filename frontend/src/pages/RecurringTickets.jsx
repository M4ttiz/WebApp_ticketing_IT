import React, { useEffect, useState } from 'react'
import api from '../api/axios'
import { toast } from 'sonner'
import { CalendarClock, Play, Pause, Trash2, Repeat } from 'lucide-react'
import { ui } from '../lib/utils'

const weekdays = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato']
const frequencyLabels = { DAILY: 'Ogni giorno', WEEKLY: 'Ogni settimana', MONTHLY: 'Ogni mese' }
const initialForm = { title: '', description: '', categoryId: '', priority: 'MEDIA', frequency: 'WEEKLY', dayOfWeek: '1', dayOfMonth: '1', time: '09:00' }

export default function RecurringTickets() {
  const [rules, setRules] = useState([])
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    try {
      const [rulesResponse, categoriesResponse] = await Promise.all([
        api.get('/recurring-tickets'), api.get('/categories'),
      ])
      setRules(rulesResponse.data)
      setCategories(categoriesResponse.data)
    } catch (error) { toast.error(error.response?.data?.error || 'Errore nel caricamento delle pianificazioni') }
  }

  useEffect(() => { load() }, [])
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  const create = async (event) => {
    event.preventDefault()
    setLoading(true)
    const payload = { ...form, categoryId: Number(form.categoryId) }
    if (form.frequency === 'WEEKLY') payload.dayOfWeek = Number(form.dayOfWeek)
    else delete payload.dayOfWeek
    if (form.frequency === 'MONTHLY') payload.dayOfMonth = Number(form.dayOfMonth)
    else delete payload.dayOfMonth
    try {
      await api.post('/recurring-tickets', payload)
      toast.success('Pianificazione creata')
      setForm(initialForm)
      await load()
    } catch (error) { toast.error(error.response?.data?.error || 'Errore nella creazione della pianificazione') }
    finally { setLoading(false) }
  }

  const toggle = async (rule) => {
    try { await api.patch(`/recurring-tickets/${rule.id}`, { isActive: !rule.isActive }); await load() }
    catch (error) { toast.error(error.response?.data?.error || 'Errore nell’aggiornamento') }
  }

  const remove = async (rule) => {
    if (!window.confirm(`Eliminare la pianificazione “${rule.title}”?`)) return
    try { await api.delete(`/recurring-tickets/${rule.id}`); toast.success('Pianificazione eliminata'); await load() }
    catch (error) { toast.error(error.response?.data?.error || 'Errore nell’eliminazione') }
  }

  const frequencyDescription = (rule) => {
    if (rule.frequency === 'WEEKLY') return `${frequencyLabels[rule.frequency]}, ${weekdays[rule.dayOfWeek].toLowerCase()} alle ${rule.time}`
    if (rule.frequency === 'MONTHLY') return `${frequencyLabels[rule.frequency]}, giorno ${rule.dayOfMonth} alle ${rule.time}`
    return `${frequencyLabels[rule.frequency]} alle ${rule.time}`
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2"><CalendarClock className="text-primary-400" /><h1 className="text-2xl font-semibold tracking-tight">Ticket periodici</h1></div>
        <p className={ui.subtleText}>Crea ticket in automatico per controlli e attività ricorrenti. Orario italiano (Europe/Rome).</p>
      </div>

      <form onSubmit={create} className={`${ui.cardSection} space-y-4`}>
        <h2 className="font-semibold">Nuova pianificazione</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1.5 text-sm text-slate-300 sm:col-span-2">Titolo
            <input required maxLength={255} className={ui.input} value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="Es. Controllo backup server" />
          </label>
          <label className="space-y-1.5 text-sm text-slate-300 sm:col-span-2">Descrizione
            <textarea required rows={3} className={ui.textarea} value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="Attività da svolgere e verifiche da effettuare" />
          </label>
          <label className="space-y-1.5 text-sm text-slate-300">Categoria
            <select required className={ui.select} value={form.categoryId} onChange={(e) => update('categoryId', e.target.value)}><option value="">Seleziona categoria</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          </label>
          <label className="space-y-1.5 text-sm text-slate-300">Priorità
            <select className={ui.select} value={form.priority} onChange={(e) => update('priority', e.target.value)}>{['BASSA', 'MEDIA', 'ALTA', 'CRITICA'].map((p) => <option key={p}>{p}</option>)}</select>
          </label>
          <label className="space-y-1.5 text-sm text-slate-300">Ricorrenza
            <select className={ui.select} value={form.frequency} onChange={(e) => update('frequency', e.target.value)}>{Object.entries(frequencyLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
          </label>
          {form.frequency === 'WEEKLY' && <label className="space-y-1.5 text-sm text-slate-300">Giorno
            <select className={ui.select} value={form.dayOfWeek} onChange={(e) => update('dayOfWeek', e.target.value)}>{weekdays.map((day, index) => <option key={day} value={index}>{day}</option>)}</select>
          </label>}
          {form.frequency === 'MONTHLY' && <label className="space-y-1.5 text-sm text-slate-300">Giorno del mese
            <select className={ui.select} value={form.dayOfMonth} onChange={(e) => update('dayOfMonth', e.target.value)}>{Array.from({ length: 31 }, (_, i) => i + 1).map((day) => <option key={day} value={day}>{day}</option>)}</select>
          </label>}
          <label className="space-y-1.5 text-sm text-slate-300">Ora
            <input required type="time" className={ui.input} value={form.time} onChange={(e) => update('time', e.target.value)} />
          </label>
        </div>
        <button disabled={loading || !categories.length} className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-50"><Repeat size={16} />{loading ? 'Salvataggio…' : 'Crea pianificazione'}</button>
      </form>

      <section className={`${ui.cardSection} space-y-3`}>
        <h2 className="font-semibold">Pianificazioni configurate</h2>
        {!rules.length && <p className={ui.subtleText}>Non ci sono ancora ticket periodici.</p>}
        {rules.map((rule) => <article key={rule.id} className="flex flex-col gap-3 rounded-lg border border-slate-700 bg-slate-900/60 p-4 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-medium">{rule.title}</h3><span className={`rounded-full px-2 py-0.5 text-xs ${rule.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>{rule.isActive ? 'Attiva' : 'In pausa'}</span></div>
            <p className="mt-1 text-sm text-slate-400">{frequencyDescription(rule)} · {rule.category?.name} · {rule.priority}</p>
            <p className="mt-1 text-xs text-slate-500">Prossimo ticket: {new Date(rule.nextRunAt).toLocaleString('it-IT', { timeZone: 'Europe/Rome', dateStyle: 'medium', timeStyle: 'short' })} · Creati: {rule._count?.tickets || 0}</p>
          </div>
          <div className="flex gap-2"><button onClick={() => toggle(rule)} title={rule.isActive ? 'Metti in pausa' : 'Riattiva'} className="rounded-lg border border-slate-700 p-2 text-slate-300 hover:bg-slate-700">{rule.isActive ? <Pause size={17} /> : <Play size={17} />}</button><button onClick={() => remove(rule)} title="Elimina" className="rounded-lg border border-slate-700 p-2 text-rose-400 hover:bg-rose-500/10"><Trash2 size={17} /></button></div>
        </article>)}
      </section>
    </div>
  )
}
