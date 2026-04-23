import React from 'react'
import { Link } from 'react-router-dom'

export default function TicketCard({ ticket }) {
  return (
    <article className="bg-slate-800 p-4 rounded border border-slate-700">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-semibold">{ticket.ticketNumber} — {ticket.title}</h3>
          <p className="text-sm text-slate-400">{ticket.category?.name} • {ticket.priority}</p>
        </div>
        <Link to={`/tickets/${ticket.id}`} className="text-primary-500">Apri</Link>
      </div>
    </article>
  )
}
