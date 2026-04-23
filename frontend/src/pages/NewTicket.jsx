import React, { useEffect, useState } from 'react'
import api from '../api/axios'
import { useNavigate } from 'react-router-dom'

export default function NewTicket(){
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [priority, setPriority] = useState('medium')
  const [categories, setCategories] = useState([])
  const [files, setFiles] = useState(null)
  const navigate = useNavigate()

  useEffect(()=>{ api.get('/api/categories').then(r=>setCategories(r.data)).catch(()=>{}) }, [])

  const submit = async (e) => {
    e.preventDefault()
    const form = new FormData()
    form.append('title', title)
    form.append('description', description)
    form.append('categoryId', categoryId)
    form.append('priority', priority)
    if (files) {
      for (const f of files) form.append('attachments', f)
    }
    const res = await api.post('/api/tickets', form, { headers: { 'Content-Type': 'multipart/form-data' } })
    navigate(`/tickets/${res.data.id}`)
  }

  return (
    <div className="max-w-2xl bg-slate-800 p-6 rounded border border-slate-700">
      <h2 className="text-xl font-semibold mb-4">Nuovo Ticket</h2>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="text-sm text-slate-300">Titolo</label>
          <input value={title} onChange={e=>setTitle(e.target.value)} className="w-full mt-1 p-2 rounded bg-slate-900 border border-slate-700" />
        </div>
        <div>
          <label className="text-sm text-slate-300">Descrizione</label>
          <textarea value={description} onChange={e=>setDescription(e.target.value)} className="w-full mt-1 p-2 rounded bg-slate-900 border border-slate-700" rows={5}></textarea>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-slate-300">Categoria</label>
            <select value={categoryId} onChange={e=>setCategoryId(e.target.value)} className="w-full mt-1 p-2 rounded bg-slate-900 border border-slate-700">
              <option value="">-- Seleziona --</option>
              {categories.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-slate-300">Priorità</label>
            <select value={priority} onChange={e=>setPriority(e.target.value)} className="w-full mt-1 p-2 rounded bg-slate-900 border border-slate-700">
              <option value="low">Bassa</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
              <option value="urgent">Urgente</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-sm text-slate-300">Allegati</label>
          <input type="file" multiple onChange={(e)=>setFiles(e.target.files)} className="w-full mt-1" />
        </div>
        <div>
          <button type="submit" className="bg-primary-500 text-white px-4 py-2 rounded">Crea Ticket</button>
        </div>
      </form>
    </div>
  )
}
