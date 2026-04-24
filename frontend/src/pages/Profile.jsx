import React, { useEffect, useState } from 'react'
import api from '../api/axios'

export default function Profile(){
  const [profile, setProfile] = useState(null)

  useEffect(()=>{ api.get('/users/me').then(r=>setProfile(r.data)).catch(()=>{}) }, [])

  if (!profile) return <div>Loading...</div>

  return (
    <div className="max-w-2xl bg-slate-800 p-6 rounded border border-slate-700">
      <h2 className="text-xl font-semibold mb-4">Profilo</h2>
      <div><strong>{profile.firstName} {profile.lastName}</strong></div>
      <div className="text-slate-400">{profile.email}</div>
      <div className="text-slate-400">Ruolo: {profile.role}</div>
    </div>
  )
}
