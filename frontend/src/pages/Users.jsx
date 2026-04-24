import React, { useEffect, useState } from 'react'
import api from '../api/axios'
import DataTable from '../components/DataTable'
import ConfirmModal from '../components/ConfirmModal'
import { toast } from 'sonner'
import { UserPlus, ToggleLeft, ToggleRight, Trash2, KeyRound } from 'lucide-react'

const ROLE_OPTIONS = ['user', 'technician', 'admin']

export default function Users() {
  const [users, setUsers] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [newUser, setNewUser] = useState({ firstName: '', lastName: '', email: '', role: 'user' })
  const [showCreate, setShowCreate] = useState(false)

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '15' })
      if (search) params.append('search', search)
      const res = await api.get(`/users?${params.toString()}`)
      setUsers(res.data.users)
      setPagination(res.data.pagination)
    } catch (e) {
      toast.error('Errore nel caricamento utenti')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [page, search])

  const toggleActive = async (user) => {
    try {
      await api.patch(`/users/${user.id}`, { isActive: !user.isActive })
      toast.success(`Utente ${user.isActive ? 'disattivato' : 'attivato'}`)
      fetchUsers()
    } catch (e) {
      toast.error('Errore')
    }
  }

  const changeRole = async (id, role) => {
    try {
      await api.patch(`/users/${id}`, { role })
      toast.success('Ruolo aggiornato')
      fetchUsers()
    } catch (e) {
      toast.error('Errore')
    }
  }

  const deleteUser = async (id) => {
    try {
      await api.delete(`/users/${id}`)
      toast.success('Utente eliminato')
      setModal(null)
      fetchUsers()
    } catch (e) {
      toast.error('Errore')
    }
  }

  const resetPassword = async (id) => {
    try {
      await api.post(`/users/${id}/reset-password`)
      toast.success('Password reimpostata e inviata via email')
    } catch (e) {
      toast.error('Errore')
    }
  }

  const createUser = async () => {
    try {
      await api.post('/users', newUser)
      toast.success('Utente creato')
      setShowCreate(false)
      setNewUser({ firstName: '', lastName: '', email: '', role: 'user' })
      fetchUsers()
    } catch (e) {
      toast.error(e.response?.data?.error || 'Errore')
    }
  }

  const columns = [
    { key: 'name', label: 'Nome', render: (u) => `${u.firstName} ${u.lastName}` },
    { key: 'email', label: 'Email' },
    {
      key: 'role',
      label: 'Ruolo',
      render: (u) => (
        <select
          value={u.role}
          onChange={(e) => changeRole(u.id, e.target.value)}
          className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs"
        >
          {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      ),
    },
    {
      key: 'active',
      label: 'Stato',
      render: (u) => (
        <button onClick={() => toggleActive(u)} className="inline-flex items-center gap-1 text-sm">
          {u.isActive ? <ToggleRight size={20} className="text-green-400" /> : <ToggleLeft size={20} className="text-slate-500" />}
          <span className={u.isActive ? 'text-green-400' : 'text-slate-500'}>{u.isActive ? 'Attivo' : 'Disattivato'}</span>
        </button>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (u) => (
        <div className="flex items-center gap-2">
          <button onClick={() => resetPassword(u.id)} title="Reset password" className="p-1.5 rounded hover:bg-slate-700 text-primary-400 transition-colors">
            <KeyRound size={16} />
          </button>
          <button onClick={() => setModal({ type: 'delete', user: u })} title="Elimina" className="p-1.5 rounded hover:bg-rose-500/10 text-rose-400 transition-colors">
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Gestione Utenti</h1>
          <p className="text-slate-400 text-sm">Crea, modifica e gestisci gli utenti</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <UserPlus size={18} /> Nuovo Utente
        </button>
      </div>

      <input
        type="text"
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1) }}
        placeholder="Cerca per nome, email, dipartimento..."
        className="w-full max-w-md px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm"
      />

      <DataTable
        columns={columns}
        data={users}
        pagination={pagination}
        onPageChange={setPage}
        loading={loading}
      />

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-semibold">Nuovo Utente</h3>
            <div className="grid gap-3">
              <input placeholder="Nome" value={newUser.firstName} onChange={(e) => setNewUser((p) => ({ ...p, firstName: e.target.value }))} className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm" />
              <input placeholder="Cognome" value={newUser.lastName} onChange={(e) => setNewUser((p) => ({ ...p, lastName: e.target.value }))} className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm" />
              <input placeholder="Email" type="email" value={newUser.email} onChange={(e) => setNewUser((p) => ({ ...p, email: e.target.value }))} className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm" />
              <select value={newUser.role} onChange={(e) => setNewUser((p) => ({ ...p, role: e.target.value }))} className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm">
                {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-lg text-sm bg-slate-700 hover:bg-slate-600">Annulla</button>
              <button onClick={createUser} className="px-4 py-2 rounded-lg text-sm bg-primary-500 hover:bg-primary-600 text-white">Crea</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={modal?.type === 'delete'}
        title="Elimina utente"
        message={`Sei sicuro di voler eliminare ${modal?.user?.firstName} ${modal?.user?.lastName}? L'azione è irreversibile.`}
        danger
        onConfirm={() => deleteUser(modal.user.id)}
        onCancel={() => setModal(null)}
      />
    </div>
  )
}

