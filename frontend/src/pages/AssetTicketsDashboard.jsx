import React, { useEffect, useState } from 'react'
import { BarChart3 } from 'lucide-react'
import { toast } from 'sonner'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
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
  const [topLimit, setTopLimit] = useState(10)

  useEffect(() => {
    let active = true

    const loadData = async () => {
      setLoading(true)
      try {
        const params = {
          limit: topLimit,
          status: statusFilter,
          ...(useMonthYear ? { month, year } : {}),
        }
        const res = await getTopOpenTicketsByProduct(params)
        if (active) {
          const sorted = [...(res.data.items || [])].sort((a, b) => (b.openTickets || 0) - (a.openTickets || 0))
          setItems(sorted.slice(0, topLimit))
        }
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
  }, [statusFilter, useMonthYear, month, year, topLimit])

  const chartData = items.map((item, idx) => ({
    id: item.id ?? String(idx),
    asset: item.descrizione || item.name || '-',
    openTickets: item.openTickets || 0,
  }))

  const chartColors = ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#64748b']

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

        <div className="min-w-[160px]">
          <label className="block text-xs text-slate-400 mb-1">Mostra Top</label>
          <select value={topLimit} onChange={(e) => setTopLimit(parseInt(e.target.value, 10))} className={ui.select}>
            {[5, 10, 20, 50].map((n) => (
              <option key={n} value={n}>{n} asset</option>
            ))}
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

      <div className={ui.cardSection}>
        <h3 className="font-semibold text-sm mb-4">Grafico ticket aperti per asset</h3>
        {loading ? (
          <div className="h-72 flex items-center justify-center text-sm text-slate-400">Caricamento grafico...</div>
        ) : chartData.length === 0 ? (
          <div className="h-72 flex items-center justify-center text-sm text-slate-500">Nessun dato da visualizzare</div>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="asset"
                  stroke="#94a3b8"
                  fontSize={12}
                  tickFormatter={(v) => (v.length > 18 ? `${v.slice(0, 16)}…` : v)}
                />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#f1f5f9' }}
                  itemStyle={{ color: '#f1f5f9' }}
                  formatter={(val) => [`${val} ticket`, '']}
                />
                <Bar dataKey="openTickets" radius={[6, 6, 0, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={chartColors[i % chartColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
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
