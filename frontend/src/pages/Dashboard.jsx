import React, { useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import api from '../api/axios'
import KpiCard from '../components/KpiCard'
import { SkeletonCard, SkeletonRow } from '../components/Skeleton'
import StatusBadge from '../components/StatusBadge'
import Button from '../components/ui/Button'
import { SelectField } from '../components/ui/SelectField'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Inbox, Clock, CheckCircle2, Timer, BarChart3, TrendingUp } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
import { useAuth } from '../context/AuthContext'
import { normalizeRole } from '../lib/roles'
import { cn, ui } from '../lib/utils'
import { chartPalette } from '../styles/design-system'

const STATUS_OPTIONS_CHART = [
  { value: 'ALL', label: 'Tutti gli stati' },
  { value: 'APERTO', label: 'Aperto' },
  { value: 'IN_LAVORAZIONE', label: 'In lavorazione' },
  { value: 'IN_ATTESA', label: 'In attesa' },
  { value: 'RISOLTO', label: 'Risolto' },
  { value: 'CHIUSO', label: 'Chiuso' },
  { value: 'RIFIUTATO', label: 'Rifiutato' },
]

const MONTHS_IT = [
  { value: 'ALL', label: 'Tutti i mesi' },
  ...Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: format(new Date(2000, i, 1), 'LLLL', { locale: it }),
  })),
]

function aggregateByCategory(tickets, status, month, year) {
  let rows = tickets || []
  if (status && status !== 'ALL') {
    rows = rows.filter((t) => t.status === status)
  }
  if (year && year !== 'ALL') {
    const y = parseInt(year, 10)
    rows = rows.filter((t) => new Date(t.createdAt).getFullYear() === y)
  }
  if (month && month !== 'ALL') {
    const m = parseInt(month, 10) - 1
    rows = rows.filter((t) => new Date(t.createdAt).getMonth() === m)
  }
  const map = new Map()
  rows.forEach((t) => {
    const name = t.category?.name || '—'
    map.set(name, (map.get(name) || 0) + 1)
  })
  return Array.from(map.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-ds border border-border-subtle bg-surface-card px-3 py-2 text-xs shadow-elevated">
      <div className="font-medium text-text-primary">{label}</div>
      {payload.map((p) => (
        <div key={p.name} className="text-text-secondary">
          {p.name}: <span className="text-text-primary">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const nr = normalizeRole(user?.role)

  const [data, setData] = useState(null)
  const [chartTickets, setChartTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [chartStatus, setChartStatus] = useState('ALL')
  const [chartMonth, setChartMonth] = useState('ALL')
  const [chartYear, setChartYear] = useState('ALL')

  const now = new Date()
  const yearOptions = useMemo(() => {
    const cur = now.getFullYear()
    return [
      { value: 'ALL', label: 'Tutti gli anni' },
      ...Array.from({ length: 4 }, (_, i) => {
        const y = cur - i
        return { value: String(y), label: String(y) }
      }),
    ]
  }, [now])

  useEffect(() => {
    if (nr === 'agent') return

    let cancelled = false
    setLoading(true)
    api
      .get('/dashboard', { params: { status: 'ALL' } })
      .then((r) => {
        if (!cancelled) setData(r.data)
      })
      .catch(() => {
        if (!cancelled) setData(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [nr])

  useEffect(() => {
    if (nr === 'agent') return

    let cancelled = false
    api
      .get('/tickets?limit=500&page=1&sortBy=createdAt&sortOrder=desc')
      .then((r) => {
        if (!cancelled) setChartTickets(r.data.tickets || [])
      })
      .catch(() => {
        if (!cancelled) setChartTickets([])
      })
    return () => {
      cancelled = true
    }
  }, [nr])

  const filteredByCategory = useMemo(
    () => aggregateByCategory(chartTickets, chartStatus, chartMonth, chartYear),
    [chartTickets, chartStatus, chartMonth, chartYear]
  )

  const filtersActive =
    chartStatus !== 'ALL' || chartMonth !== 'ALL' || chartYear !== 'ALL'

  const permissionDenied = !loading && data === null && nr === 'user'

  if (nr === 'agent') {
    return <Navigate to="/tickets" replace />
  }

  const kpi = data?.kpi || {}
  const charts = data?.charts || {}
  const recentTickets = data?.recentTickets || []
  const topAgents = data?.topAgents || []

  return (
    <div className={ui.page}>
      <div>
        <h1 className="text-[20px] font-semibold tracking-tight text-text-primary">Dashboard</h1>
        <p className={ui.subtleText}>Panoramica ticket e performance operative</p>
      </div>

      {permissionDenied && (
        <div className={`${ui.cardSection} border-semantic-warning/30 bg-semantic-warning/5`}>
          <p className="text-sm text-text-secondary">
            Non hai accesso ai dati della dashboard da questo account.{' '}
            <Link to="/tickets" className="font-medium text-accent hover:text-accent-hover">
              Vai ai ticket
            </Link>
          </p>
        </div>
      )}

      {/* KPI */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <KpiCard title="Ticket aperti" value={kpi.totalOpen} icon={Inbox} delay={0} />
            <KpiCard title="In lavorazione" value={kpi.inProgress} icon={Clock} delay={0.05} />
            <KpiCard title="Risolti oggi" value={kpi.resolvedToday} icon={CheckCircle2} delay={0.1} />
            <KpiCard title="Tempo medio (h)" value={kpi.avgResolutionHours} icon={Timer} delay={0.15} />
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className={ui.cardSection}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <BarChart3 size={18} className="text-accent" aria-hidden />
              <h3 className="text-[15px] font-semibold text-text-primary">Ticket per categoria</h3>
            </div>
          </div>

          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <SelectField
              label="Stato"
              value={chartStatus}
              onChange={(e) => setChartStatus(e.target.value)}
              className="text-sm"
            >
              {STATUS_OPTIONS_CHART.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </SelectField>
            <SelectField label="Mese" value={chartMonth} onChange={(e) => setChartMonth(e.target.value)}>
              {MONTHS_IT.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </SelectField>
            <SelectField label="Anno" value={chartYear} onChange={(e) => setChartYear(e.target.value)}>
              {yearOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </SelectField>
          </div>

          {filtersActive && (
            <div className="mb-4 flex justify-end">
              <Button type="button" variant="ghost" onClick={() => { setChartStatus('ALL'); setChartMonth('ALL'); setChartYear('ALL') }}>
                Reset
              </Button>
            </div>
          )}

          {loading ? (
            <div className="skeleton h-64 rounded-ds" />
          ) : (
            <ResponsiveContainer width="100%" height={256}>
              <BarChart data={filteredByCategory} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="transparent" vertical={false} />
                <XAxis dataKey="category" stroke="#8B8FA8" tick={{ fill: '#8B8FA8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#8B8FA8" tick={{ fill: '#8B8FA8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(79,110,247,0.06)' }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} animationDuration={400} isAnimationActive>
                  {filteredByCategory.map((_, i) => (
                    <Cell key={`cell-${i}`} fill={chartPalette[i % chartPalette.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className={ui.cardSection}>
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-accent" aria-hidden />
            <h3 className="text-[15px] font-semibold text-text-primary">Attività ultimi 7 giorni</h3>
          </div>
          {loading ? (
            <div className="skeleton h-64 rounded-ds" />
          ) : (
            <ResponsiveContainer width="100%" height={256}>
              <LineChart data={charts.ticketsByDay || []}>
                <CartesianGrid stroke="transparent" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#8B8FA8"
                  tick={{ fill: '#8B8FA8', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => format(parseISO(v), 'dd MMM', { locale: it })}
                />
                <YAxis stroke="#8B8FA8" tick={{ fill: '#8B8FA8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke={chartPalette[0]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5, fill: chartPalette[0] }}
                  animationDuration={500}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent + top agents — hidden for viewer */}
      {nr !== 'viewer' && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className={cn(ui.card, 'lg:col-span-2 overflow-hidden')}>
            <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
              <h3 className="text-[15px] font-semibold text-text-primary">Ticket recenti</h3>
              <Link to="/tickets" className="text-[13px] font-medium text-accent hover:text-accent-hover">
                Vedi tutti →
              </Link>
            </div>
            {loading ? (
              <div className="space-y-3 p-5">
                <SkeletonRow cols={4} />
                <SkeletonRow cols={4} />
                <SkeletonRow cols={4} />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border-subtle bg-surface-card text-[11px] uppercase tracking-wide text-text-secondary">
                    <tr>
                      <th className="px-5 py-3">Numero</th>
                      <th className="px-5 py-3">Titolo</th>
                      <th className="px-5 py-3">Stato</th>
                      <th className="px-5 py-3">Categoria</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle/80">
                    {recentTickets.map((t) => (
                      <tr key={t.id} className="transition-colors duration-150 hover:bg-surface-hover/80">
                        <td className="whitespace-nowrap px-5 py-3 font-mono text-xs text-text-secondary">{t.ticketNumber}</td>
                        <td className="max-w-xs truncate px-5 py-3 font-semibold text-text-primary">{t.title}</td>
                        <td className="px-5 py-3">
                          <StatusBadge status={t.status} />
                        </td>
                        <td className="px-5 py-3 text-text-secondary">{t.category?.name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className={ui.cardSection}>
            <h3 className="mb-4 text-[15px] font-semibold text-text-primary">Top agenti (settimana)</h3>
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
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent">
                        {i + 1}
                      </div>
                      <span className="text-sm text-text-primary">{agent.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-text-primary">{agent.resolved}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
