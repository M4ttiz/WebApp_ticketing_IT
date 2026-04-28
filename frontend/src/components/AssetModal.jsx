import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save } from 'lucide-react'
import { toast } from 'sonner'
import { createAsset, updateAsset } from '../api/assets'
import { ui } from '../lib/utils'

const CATEGORIES = [
  'LAPTOP', 'DESKTOP', 'MONITOR', 'STAMPANTE',
  'SERVER', 'SWITCH', 'ROUTER', 'TELEFONO', 'TABLET', 'ALTRO'
]

const STATUSES = [
  'DISPONIBILE', 'IN_USO', 'IN_MANUTENZIONE', 'DISMESSO', 'GUASTO'
]

export default function AssetModal({ isOpen, onClose, asset, onSaved }) {
  const isEdit = !!asset
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    category: '',
    brand: '',
    model: '',
    serialNumber: '',
    assetTag: '',
    status: 'DISPONIBILE',
    location: '',
    assignedTo: '',
    assignedUserId: '',
    purchaseDate: '',
    warrantyExpiry: '',
    notes: '',
    ipAddress: '',
    macAddress: '',
    osVersion: '',
  })

  useEffect(() => {
    if (asset) {
      setForm({
        name: asset.name || '',
        category: asset.category || '',
        brand: asset.brand || '',
        model: asset.model || '',
        serialNumber: asset.serialNumber || '',
        assetTag: asset.assetTag || '',
        status: asset.status || 'DISPONIBILE',
        location: asset.location || '',
        assignedTo: asset.assignedTo || '',
        assignedUserId: asset.assignedUserId || '',
        purchaseDate: asset.purchaseDate ? asset.purchaseDate.split('T')[0] : '',
        warrantyExpiry: asset.warrantyExpiry ? asset.warrantyExpiry.split('T')[0] : '',
        notes: asset.notes || '',
        ipAddress: asset.ipAddress || '',
        macAddress: asset.macAddress || '',
        osVersion: asset.osVersion || '',
      })
    } else {
      setForm({
        name: '', category: '', brand: '', model: '',
        serialNumber: '', assetTag: '', status: 'DISPONIBILE',
        location: '', assignedTo: '', assignedUserId: '',
        purchaseDate: '', warrantyExpiry: '', notes: '',
        ipAddress: '', macAddress: '', osVersion: '',
      })
    }
  }, [asset, isOpen])

  const update = (field, value) => setForm(p => ({ ...p, [field]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.category) {
      toast.error('Nome e categoria sono obbligatori')
      return
    }
    setLoading(true)
    try {
      const payload = {
        ...form,
        purchaseDate: form.purchaseDate || null,
        warrantyExpiry: form.warrantyExpiry || null,
      }
      if (isEdit) {
        await updateAsset(asset.id, payload)
        toast.success('Asset aggiornato')
      } else {
        await createAsset(payload)
        toast.success('Asset creato')
      }
      onSaved()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Errore nel salvataggio')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
                <h2 className="text-lg font-semibold">
                  {isEdit ? 'Modifica Asset' : 'Nuovo Asset'}
                </h2>
                <button onClick={onClose} className="text-slate-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Nome <span className="text-rose-400">*</span>
                    </label>
                    <input
                      value={form.name}
                      onChange={e => update('name', e.target.value)}
                      className={ui.input}
                      placeholder="Es. Laptop Dell XPS 13"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Categoria <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={form.category}
                      onChange={e => update('category', e.target.value)}
                      className={ui.select}
                    >
                      <option value="">Seleziona</option>
                      {CATEGORIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Stato</label>
                    <select
                      value={form.status}
                      onChange={e => update('status', e.target.value)}
                      className={ui.select}
                    >
                      {STATUSES.map(s => (
                        <option key={s} value={s}>{s.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Marca</label>
                    <input
                      value={form.brand}
                      onChange={e => update('brand', e.target.value)}
                      className={ui.input}
                      placeholder="Es. Dell"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Modello</label>
                    <input
                      value={form.model}
                      onChange={e => update('model', e.target.value)}
                      className={ui.input}
                      placeholder="Es. XPS 13 9310"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Numero seriale</label>
                    <input
                      value={form.serialNumber}
                      onChange={e => update('serialNumber', e.target.value)}
                      className={ui.input}
                      placeholder="SN123456789"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Asset Tag</label>
                    <input
                      value={form.assetTag}
                      onChange={e => update('assetTag', e.target.value)}
                      className={ui.input}
                      placeholder="IT-00123"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Sede / Ubicazione</label>
                    <input
                      value={form.location}
                      onChange={e => update('location', e.target.value)}
                      className={ui.input}
                      placeholder="Sede Milano, Piano 2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Assegnato a</label>
                    <input
                      value={form.assignedTo}
                      onChange={e => update('assignedTo', e.target.value)}
                      className={ui.input}
                      placeholder="Nome cognome"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Data acquisto</label>
                    <input
                      type="date"
                      value={form.purchaseDate}
                      onChange={e => update('purchaseDate', e.target.value)}
                      className={ui.input}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Scadenza garanzia</label>
                    <input
                      type="date"
                      value={form.warrantyExpiry}
                      onChange={e => update('warrantyExpiry', e.target.value)}
                      className={ui.input}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Indirizzo IP</label>
                    <input
                      value={form.ipAddress}
                      onChange={e => update('ipAddress', e.target.value)}
                      className={ui.input}
                      placeholder="192.168.1.100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Indirizzo MAC</label>
                    <input
                      value={form.macAddress}
                      onChange={e => update('macAddress', e.target.value)}
                      className={ui.input}
                      placeholder="00:1A:2B:3C:4D:5E"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-300 mb-1">Sistema operativo</label>
                    <input
                      value={form.osVersion}
                      onChange={e => update('osVersion', e.target.value)}
                      className={ui.input}
                      placeholder="Windows 11 Pro 23H2"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-300 mb-1">Note</label>
                    <textarea
                      value={form.notes}
                      onChange={e => update('notes', e.target.value)}
                      className={`${ui.textarea} resize-none`}
                      rows={3}
                      placeholder="Note aggiuntive..."
                    />
                  </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-700 hover:bg-slate-600 transition-colors"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white transition-colors"
                  >
                    <Save size={16} />
                    {loading ? 'Salvataggio...' : 'Salva'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
