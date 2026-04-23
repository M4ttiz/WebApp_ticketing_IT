import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api/axios'

export default function TicketDetail(){
  const { id } = useParams()
  const [ticket, setTicket] = useState(null)
  const [messages, setMessages] = useState([])
  const [content, setContent] = useState('')

  useEffect(()=>{
    api.get(`/api/tickets/${id}`).then(r=>setTicket(r.data)).catch(()=>{})
    api.get(`/api/tickets/${id}/messages`).then(r=>setMessages(r.data)).catch(()=>{})
  }, [id])

  const send = async () => {
    if (!content) return
    const res = await api.post(`/api/tickets/${id}/messages`, { content })
    setMessages(prev => [...prev, res.data])
    setContent('')
  }

  if (!ticket) return <div>Loading...</div>

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-2">{ticket.ticketNumber} — {ticket.title}</h1>
      <p className="text-slate-400 mb-4">{ticket.description}</p>
      <section className="mb-6">
        <h2 className="font-semibold mb-2">Chat</h2>
        <div className="space-y-3">
          {messages.map(m=> (
            <div key={m.id} className="bg-slate-800 p-3 rounded border border-slate-700">
              <div className="text-sm text-slate-300 font-semibold">{m.author.firstName} {m.author.lastName} <span className="text-xs text-slate-500">• {new Date(m.createdAt).toLocaleString()}</span></div>
              <div className="mt-1 text-slate-100">{m.content}</div>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <textarea value={content} onChange={(e)=>setContent(e.target.value)} className="w-full p-2 rounded bg-slate-900 border border-slate-700" rows={4}></textarea>
          <div className="text-right mt-2"><button onClick={send} className="bg-primary-500 text-white px-3 py-1 rounded">Invia</button></div>
        </div>
      </section>
    </div>
  )
}
