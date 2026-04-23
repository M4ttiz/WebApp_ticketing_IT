import React, { useEffect, useState } from 'react'
import api from '../api/axios'
import { LineChart, Line, PieChart, Pie, Cell, Tooltip, XAxis, YAxis } from 'recharts'

export default function Dashboard(){
  const [stats, setStats] = useState(null)
  const [charts, setCharts] = useState(null)

  useEffect(()=>{
    api.get('/api/dashboard/stats').then(r=>setStats(r.data)).catch(()=>{})
    api.get('/api/dashboard/charts').then(r=>setCharts(r.data)).catch(()=>{})
  },[])

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Dashboard</h1>
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-800 p-4 rounded border border-slate-700">Aperti oggi<br/><strong>{stats.openToday}</strong></div>
          <div className="bg-slate-800 p-4 rounded border border-slate-700">In lavorazione<br/><strong>{stats.inProgress}</strong></div>
          <div className="bg-slate-800 p-4 rounded border border-slate-700">Risolti questa settimana<br/><strong>{stats.resolvedThisWeek}</strong></div>
          <div className="bg-slate-800 p-4 rounded border border-slate-700">Tempo medio (ore)<br/><strong>{stats.avgResolutionHours}</strong></div>
        </div>
      )}

      {charts && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-slate-800 p-4 rounded border border-slate-700">
            <h3 className="font-semibold mb-2">Andamento</h3>
            <LineChart width={500} height={250} data={charts.ticketsByDay}>
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" />
            </LineChart>
          </div>

          <div className="bg-slate-800 p-4 rounded border border-slate-700">
            <h3 className="font-semibold mb-2">Stato</h3>
            <PieChart width={300} height={250}>
              <Pie data={charts.byStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80}>
                {charts.byStatus.map((entry, index) => <Cell key={index} fill={["#3b82f6", "#22c55e", "#f59e0b", "#8b5cf6", "#64748b"][index % 5]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </div>
        </div>
      )}
    </div>
  )
}
