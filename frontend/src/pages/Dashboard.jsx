import React, { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import api from '../api/axios'
import KpiCard from '../components/KpiCard'
import { SkeletonCard, SkeletonRow } from '../components/Skeleton'
import StatusBadge from '../components/StatusBadge'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Inbox, Clock, CheckCircle2, Timer, BarChart3, TrendingUp, FileDown } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
import { useAuth } from '../context/AuthContext'
import { ui } from '../lib/utils'

export default function Dashboard() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const normalizedRole = String(user?.role || '').toLowerCase()

  const now = new Date()
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [useMonthYear, setUseMonthYear] = useState(false)
  const [month, setMonth] = useState(String(now.getMonth() + 1))
  const [year, setYear] = useState(String(now.getFullYear()))

  useEffect(() => {
    if (normalizedRole === 'user') {
      setLoading(false)
      return
    }

    setLoading(true)
    const params = {
      status: statusFilter,
      ...(useMonthYear ? { month, year } : {}),
    }

    api.get('/dashboard', { params })
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [normalizedRole, statusFilter, useMonthYear, month, year])

  if (normalizedRole === 'user') {
    return <Navigate to="/tickets" replace />
  }

  const kpi = data?.kpi || {}
  const charts = data?.charts || {}
  const recentTickets = data?.recentTickets || []
  const topAgents = data?.topAgents || []

  const handleExportCsv = () => {
    const escape = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`
    const lines = []

    lines.push('SEZIONE;CAMPO;VALORE')
    lines.push(['KPI', 'Ticket aperti', kpi.totalOpen ?? 0].map(escape).join(';'))
    lines.push(['KPI', 'In lavorazione', kpi.inProgress ?? 0].map(escape).join(';'))
    lines.push(['KPI', 'Risolti oggi', kpi.resolvedToday ?? 0].map(escape).join(';'))
    lines.push(['KPI', 'Tempo medio (h)', kpi.avgResolutionHours ?? 0].map(escape).join(';'))

    lines.push('')
    lines.push('TICKET_RECENTI;NUMERO;TITOLO;STATO;CATEGORIA')
    recentTickets.forEach((t) => {
      lines.push([
        'TICKET_RECENTI',
        t.ticketNumber || '',
        t.title || '',
        t.status || '',
        t.category?.name || '',
      ].map(escape).join(';'))
    })

    lines.push('')
    lines.push('TOP_AGENTI;NOME;RISOLTI')
    topAgents.forEach((agent) => {
      lines.push(['TOP_AGENTI', agent.name || '', agent.resolved ?? 0].map(escape).join(';'))
    })

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'dashboard_filtrato.csv'
    link.click()
    URL.revokeObjectURL(link.href)
  }

  return (
    <div className={ui.page}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className={ui.subtleText}>Panoramica ticket e performance operative</p>
        </div>
        <button
          type="button"
          onClick={handleExportCsv}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
        >
          <FileDown size={16} />
          Export CSV
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <KpiCard title="Ticket aperti" value={kpi.totalOpen} icon={Inbox} colorClass="text-blue-400" delay={0} />
            <KpiCard title="In lavorazione" value={kpi.inProgress} icon={Clock} colorClass="text-orange-400" delay={0.1} />
            <KpiCard title="Risolti oggi" value={kpi.resolvedToday} icon={CheckCircle2} colorClass="text-green-400" delay={0.2} />
            <KpiCard title="Tempo medio (h)" value={kpi.avgResolutionHours} icon={Timer} colorClass="text-purple-400" delay={0.3} />
          </>
        )}
      </div>

      {/* Filtri dashboard (sopra i grafici) */}
      <div className={`${ui.cardSection} p-4 flex flex-col sm:flex-row sm:items-center gap-3`}>
        <div className="min-w-[180px]">
          <label className="block text-xs text-slate-400 mb-1">Stato</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={ui.select}>
            <option value="ALL">Tutti</option>
            <option value="OPEN">Aperti</option>
            <option value="CLOSED">Chiusi</option>
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

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className={ui.cardSection}>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={18} className="text-primary-400" />
            <h3 className="font-semibold text-sm">Ticket per categoria</h3>
          </div>
          {loading ? (
            <div className="h-64 skeleton" />
          ) : (
            <ResponsiveContainer width="100%" height={256}>
              <BarChart data={charts.byCategory || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="category" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  itemStyle={{ color: '#f1f5f9' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {(charts.byCategory || []).map((_, i) => (
                    <Cell key={i} fill={['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899'][i % 5]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className={ui.cardSection}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-primary-400" />
            <h3 className="font-semibold text-sm">Attività ultimi 7 giorni</h3>
          </div>
          {loading ? (
            <div className="h-64 skeleton" />
          ) : (
            <ResponsiveContainer width="100%" height={256}>
              <LineChart data={charts.ticketsByDay || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="date"
                  stroke="#94a3b8"
                  fontSize={12}
                  tickFormatter={(v) => format(parseISO(v), 'dd MMM', { locale: it })}
                />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  itemStyle={{ color: '#f1f5f9' }}
                  labelFormatter={(v) => format(parseISO(v), 'dd MMMM yyyy', { locale: it })}
                />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent tickets + Top agents */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className={`lg:col-span-2 ${ui.card} overflow-hidden`}>
          <div className="px-5 py-4 border-b border-slate-700">
            <h3 className="font-semibold text-sm">Ticket recenti</h3>
          </div>
          {loading ? (
            <div className="p-5 space-y-3">
              <SkeletonRow cols={4} />
              <SkeletonRow cols={4} />
              <SkeletonRow cols={4} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-700/40 text-xs uppercase text-slate-300">
                  <tr>
                    <th className="px-5 py-3">Numero</th>
                    <th className="px-5 py-3">Titolo</th>
                    <th className="px-5 py-3">Stato</th>
                    <th className="px-5 py-3">Categoria</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {recentTickets.map((t) => (
                    <tr key={t.id} className="transition-colors hover:bg-slate-700/20">
                      <td className="px-5 py-3 font-mono text-xs text-slate-400">{t.ticketNumber}</td>
                      <td className="px-5 py-3 max-w-xs truncate">{t.title}</td>
                      <td className="px-5 py-3"><StatusBadge status={t.status} /></td>
                      <td className="px-5 py-3 text-slate-400">{t.category?.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className={ui.cardSection}>
          <h3 className="font-semibold text-sm mb-4">Top agenti (settimana)</h3>
          {loading ? (
            <div className="space-y-3">
              <SkeletonRow cols={2} />
              <SkeletonRow cols={2} />
              <SkeletonRow cols={2} />
            </div>
          ) : (
            <div className="space-y-3">
              {topAgents.map((agent, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary-500/10 text-primary-400 text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </div>
                    <span className="text-sm">{agent.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-200">{agent.resolved}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

