import React, { useEffect, useState } from 'react'
import api from '../api/axios'

export default function Users(){
  const [users, setUsers] = useState([])

  useEffect(()=>{ api.get('/api/users').then(r=>setUsers(r.data.users)).catch(()=>{}) }, [])

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Gestione Utenti</h1>
      <div className="bg-slate-800 p-4 rounded border border-slate-700">
        {users.map(u=> (
          <div key={u.id} className="flex justify-between py-2 border-b border-slate-700 last:border-b-0">
            <div>{u.firstName} {u.lastName} <span className="text-slate-400">{u.email}</span></div>
            <div className="text-slate-400">{u.role}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
