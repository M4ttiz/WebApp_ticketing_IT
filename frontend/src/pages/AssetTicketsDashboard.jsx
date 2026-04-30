import React, { useEffect, useState } from 'react'
import { BarChart3 } from 'lucide-react'
import { toast } from 'sonner'
import { getTopOpenTicketsByProduct } from '../api/assets'
import { ui } from '../lib/utils'

export default function AssetTicketsDashboard() {
  const now = new Date()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('OPEN')
  const [useMonthYear, setUseMonthYear] = useState(false)
  const [month, setMonth] = useState(String(now.getMonth() + 1))
  const [year, setYear] = useState(String(now.getFullYear()))

  useEffect(() => {
    let active = true

    const loadData = async () => {
      setLoading(true)
      try {
        const params = {
          status: statusFilter,
          ...(useMonthYear ? { month, year } : {}),
        }
        const res = await getTopOpenTicketsByProduct(params)
        if (active) setItems(res.data.items || [])
      } catch (err) {
        if (active) toast.error('Errore nel caricamento ticket per asset')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadData()
    return () => {
      active = false
    }
  }, [statusFilter, useMonthYear, month, year])

  return (
    <div className={ui.page}>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <BarChart3 size={24} className="text-primary-400" />
          Ticket per Asset
        </h1>
        <p className={ui.subtleText}>Classifica asset con ticket in base ai filtri selezionati</p>
      </div>

      <div className={`${ui.cardSection} p-4 flex flex-col sm:flex-row sm:items-center gap-3`}>
        <div className="min-w-[180px]">
          <label className="block text-xs text-slate-400 mb-1">Stato</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={ui.select}>
            <option value="OPEN">Aperti</option>
            <option value="CLOSED">Chiusi</option>
            <option value="ALL">Tutti</option>
          </select>
        </div>

        <div className="flex items-end gap-3">
          <label className="inline-flex items-center gap-2 text-sm text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={useMonthYear}
              onChange={(e) => setUseMonthYear(e.target.checked)}
              className="rounded border-slate-600 bg-slate-900 text-primary-500"
            />
            Filtra mese/anno
          </label>
        </div>

        {useMonthYear && (
          <>
            <div className="min-w-[140px]">
              <label className="block text-xs text-slate-400 mb-1">Mese</label>
              <select value={month} onChange={(e) => setMonth(e.target.value)} className={ui.select}>
                {Array.from({ length: 12 }).map((_, i) => {
                  const v = String(i + 1)
                  return <option key={v} value={v}>{v}</option>
                })}
              </select>
            </div>
            <div className="min-w-[160px]">
              <label className="block text-xs text-slate-400 mb-1">Anno</label>
              <select value={year} onChange={(e) => setYear(e.target.value)} className={ui.select}>
                {Array.from({ length: 5 }).map((_, i) => {
                  const v = String(new Date().getFullYear() - i)
                  return <option key={v} value={v}>{v}</option>
                })}
              </select>
            </div>
          </>
        )}
      </div>

      <div className={`${ui.card} overflow-hidden`}>
        {loading ? (
          <div className="p-6 text-sm text-slate-400">Caricamento dati...</div>
        ) : items.length === 0 ? (
          <div className="p-6 text-sm text-slate-500">Nessun risultato per i filtri selezionati</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-700/40 text-xs uppercase text-slate-300">
                <tr>
                  <th className="px-5 py-3">Asset</th>
                  <th className="px-5 py-3">Categoria</th>
                  <th className="px-5 py-3">Sede</th>
                  <th className="px-5 py-3">Reparto</th>
                  <th className="px-5 py-3 text-right">Ticket aperti</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {items.map((item, idx) => (
                  <tr key={item.id ?? idx} className="transition-colors hover:bg-slate-700/20">
                    <td className="px-5 py-3 font-medium">{item.descrizione || item.name || '-'}</td>
                    <td className="px-5 py-3 text-slate-300">{item.categoria || item.category || '-'}</td>
                    <td className="px-5 py-3 text-slate-300">{item.sede || item.location || '-'}</td>
                    <td className="px-5 py-3 text-slate-300">{item.reparto || item.department || '-'}</td>
                    <td className="px-5 py-3 text-right font-semibold text-primary-300">{item.openTickets || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
