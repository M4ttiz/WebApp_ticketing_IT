import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../api/axios'
import FileDropzone from '../components/FileDropzone'
import StatusBadge from '../components/StatusBadge'
import PriorityBadge from '../components/PriorityBadge'
import { toast } from 'sonner'
import { ChevronRight, ChevronLeft, Send, CheckCircle2 } from 'lucide-react'
import { ui } from '../lib/utils'

const STEPS = [
  { id: 1, label: 'Categoria e priorità' },
  { id: 2, label: 'Dettagli' },
  { id: 3, label: 'Allegati e conferma' },
]

export default function NewTicket() {
  const [step, setStep] = useState(1)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const [form, setForm] = useState({
    categoryId: '',
    priority: 'MEDIA',
    title: '',
    description: '',
    files: [],
  })
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    api.get('/categories').then((r) => setCategories(r.data)).catch(() => {})
  }, [])

  const update = (field, value) => setForm((p) => ({ ...p, [field]: value }))

  const canNext = () => {
    if (step === 1) return form.categoryId && form.priority
    if (step === 2) return form.title.trim().length >= 3 && form.description.trim().length >= 10
    return true
  }

  const submit = async () => {
    setSubmitted(true)
    if (!canNext()) return
    setLoading(true)
    try {
      const data = new FormData()
      data.append('title', form.title)
      data.append('description', form.description)
      data.append('categoryId', form.categoryId)
      data.append('priority', form.priority)
      form.files.forEach((f) => data.append('attachments', f))

      const res = await api.post('/tickets', data, { headers: { 'Content-Type': 'multipart/form-data' } })

      toast.success('Ticket creato con successo')
      navigate(`/tickets/${res.data.id}`)
    } catch (e) {
      toast.error(e.response?.data?.error || 'Errore nella creazione del ticket')
    } finally {
      setLoading(false)
    }
  }

  const titleError = submitted && step >= 2 && form.title.trim().length < 3
  const descriptionError = submitted && step >= 2 && form.description.trim().length < 10
  const categoryError = submitted && step >= 1 && !form.categoryId

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nuovo Ticket</h1>
        <p className={ui.subtleText}>Compila il modulo in 3 passaggi</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <React.Fragment key={s.id}>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              step >= s.id ? 'bg-primary-500/10 text-primary-400' : 'bg-slate-800 text-slate-500'
            }`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step > s.id ? 'bg-green-500 text-white' : step === s.id ? 'bg-primary-500 text-white' : 'bg-slate-700 text-slate-400'
              }`}>
                {step > s.id ? <CheckCircle2 size={12} /> : s.id}
              </div>
              {s.label}
            </div>
            {i < STEPS.length - 1 && <ChevronRight size={14} className="text-slate-600" />}
          </React.Fragment>
        ))}
      </div>

      {/* Form steps */}
      <div className={`${ui.cardSection} p-6`}>
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Categoria</label>
                <select
                  value={form.categoryId}
                  onChange={(e) => update('categoryId', e.target.value)}
                  className={ui.select}
                >
                  <option value="">Seleziona categoria</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {categoryError && (
                  <p className="mt-1 text-xs text-rose-400">Seleziona una categoria.</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Priorità</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['BASSA', 'MEDIA', 'ALTA', 'CRITICA'].map((p) => (
                    <button
                      key={p}
                      onClick={() => update('priority', p)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                        form.priority === p
                          ? 'bg-primary-500/10 border-primary-500/30 text-primary-400'
                          : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Titolo</label>
                <input
                  value={form.title}
                  onChange={(e) => update('title', e.target.value)}
                  placeholder="Breve riassunto del problema"
                  className={ui.input}
                />
                {titleError && (
                  <p className="mt-1 text-xs text-rose-400">Inserisci almeno 3 caratteri nel titolo.</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Descrizione</label>
                <textarea
                  value={form.description}
                  onChange={(e) => update('description', e.target.value)}
                  placeholder="Descrivi il problema in dettaglio..."
                  rows={6}
                  className={`${ui.textarea} resize-none`}
                />
                {descriptionError && (
                  <p className="mt-1 text-xs text-rose-400">Inserisci almeno 10 caratteri nella descrizione.</p>
                )}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <FileDropzone files={form.files} onChange={(files) => update('files', files)} />

              <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                <h4 className="text-sm font-semibold mb-3">Anteprima ticket</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-400">Categoria:</span> <span>{categories.find((c) => String(c.id) === form.categoryId)?.name}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Priorità:</span> <PriorityBadge priority={form.priority} /></div>
                  <div className="flex justify-between"><span className="text-slate-400">Titolo:</span> <span className="text-right max-w-xs truncate">{form.title}</span></div>
                  <div><span className="text-slate-400">Descrizione:</span> <p className="mt-1 text-slate-300 whitespace-pre-wrap">{form.description}</p></div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-700/50">
          <button
            onClick={() => setStep((p) => p - 1)}
            disabled={step === 1}
            className="inline-flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium bg-slate-700 hover:bg-slate-600 disabled:opacity-30 transition-colors"
          >
            <ChevronLeft size={16} /> Indietro
          </button>
          {step < 3 ? (
            <button
              onClick={() => setStep((p) => p + 1)}
              disabled={!canNext()}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium bg-primary-500 hover:bg-primary-600 disabled:opacity-30 text-white transition-colors"
              type="button"
            >
              Avanti <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white transition-colors"
            >
              {loading ? 'Creazione in corso...' : <><Send size={16} /> Crea Ticket</>}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

