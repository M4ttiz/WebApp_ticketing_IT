import React, { useEffect, useState } from 'react'
import api from '../api/axios'
import TicketCard from '../components/TicketCard'
import { Link } from 'react-router-dom'

export default function TicketsList(){
  const [tickets, setTickets] = useState([])

  useEffect(()=>{ api.get('/tickets').then(r=>setTickets(r.data.tickets)).catch(()=>{}) }, [])

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Lista Ticket</h1>
        <Link to="/tickets/new" className="bg-primary-500 text-white px-3 py-1 rounded">Nuovo Ticket</Link>
      </div>
      <div className="space-y-3">
        {tickets.map(t=> <TicketCard key={t.id} ticket={t} />)}
      </div>
    </div>
  )
}
