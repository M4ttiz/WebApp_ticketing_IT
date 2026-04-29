import React, { useEffect, useState } from 'react'
import api from '../api/axios'
import DataTable from '../components/DataTable'
import ConfirmModal from '../components/ConfirmModal'
import AdminTabs from '../components/AdminTabs'
import Button from '../components/ui/Button'
import { toast } from 'sonner'
import { UserPlus, ToggleLeft, ToggleRight, Trash2, KeyRound } from 'lucide-react'
import { ui, cn } from '../lib/utils'

const ROLE_OPTIONS = ['user', 'technician', 'admin']

function initials(u) {
  const a = u.firstName?.[0] || ''
  const b = u.lastName?.[0] || ''
  return `${a}${b}`.toUpperCase() || '?'
}

function roleBadgeClass(role) {
  switch (role) {
    case 'admin':
      return 'border-accent/30 bg-accent/15 text-accent'
    case 'technician':
      return 'border-semantic-warning/30 bg-semantic-warning/15 text-semantic-warning'
    default:
      return 'border-border-subtle bg-surface-hover text-text-secondary'
  }
}

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

  const toggleActive = async (userRow) => {
    try {
      await api.patch(`/users/${userRow.id}`, { isActive: !userRow.isActive })
      toast.success(`Utente ${userRow.isActive ? 'disattivato' : 'attivato'}`)
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
      toast.success('Utente cancellato definitivamente')
      setModal(null)
      fetchUsers()
    } catch (e) {
      toast.error(e.response?.data?.error || 'Errore')
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
    {
      key: 'name',
      label: 'Nome',
      render: (u) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-hover text-xs font-semibold text-text-primary ring-1 ring-border-subtle">
            {initials(u)}
          </div>
          <span className="font-medium text-text-primary">
            {u.firstName} {u.lastName}
          </span>
        </div>
      ),
    },
    { key: 'email', label: 'Email', render: (u) => <span className="text-text-secondary">{u.email}</span> },
    {
      key: 'role',
      label: 'Ruolo',
      render: (u) => (
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn('rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide', roleBadgeClass(u.role))}>
            {u.role}
          </span>
          <select
            value={u.role}
            onChange={(e) => changeRole(u.id, e.target.value)}
            className={`${ui.select} max-w-[140px] py-1.5 text-xs`}
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      ),
    },
    {
      key: 'active',
      label: 'Stato',
      render: (u) => (
        <button type="button" onClick={() => toggleActive(u)} className="inline-flex items-center gap-1 text-sm">
          {u.isActive ? <ToggleRight size={20} className="text-semantic-success" /> : <ToggleLeft size={20} className="text-text-disabled" />}
          <span className={u.isActive ? 'text-semantic-success' : 'text-text-secondary'}>{u.isActive ? 'Attivo' : 'Disattivato'}</span>
        </button>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (u) => (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => resetPassword(u.id)}
            title="Reset password"
            className="rounded-ds p-1.5 text-accent transition-colors hover:bg-accent/10"
          >
            <KeyRound size={16} />
          </button>
          <button
            type="button"
            onClick={() => setModal({ type: 'delete', user: u })}
            title="Elimina"
            className="rounded-ds p-1.5 text-semantic-danger transition-colors hover:bg-semantic-danger/10"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <AdminTabs className="mb-2" />

      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-[20px] font-semibold tracking-tight text-text-primary">Gestione Utenti</h1>
          <p className={ui.subtleText}>Crea, modifica e gestisci gli utenti</p>
        </div>
        <Button type="button" onClick={() => setShowCreate(true)}>
          <UserPlus size={18} /> Nuovo Utente
        </Button>
      </div>

      <input
        type="text"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value)
          setPage(1)
        }}
        placeholder="Cerca per nome, email, dipartimento..."
        className={`${ui.input} max-w-md`}
      />

      <DataTable columns={columns} data={users} pagination={pagination} onPageChange={setPage} loading={loading} />

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-[4px]">
          <div className={`${ui.cardSection} w-full max-w-md space-y-4 shadow-elevated`}>
            <h3 className="text-lg font-semibold text-text-primary">Nuovo Utente</h3>
            <div className="grid gap-3">
              <input
                placeholder="Nome"
                value={newUser.firstName}
                onChange={(e) => setNewUser((p) => ({ ...p, firstName: e.target.value }))}
                className={ui.input}
              />
              <input
                placeholder="Cognome"
                value={newUser.lastName}
                onChange={(e) => setNewUser((p) => ({ ...p, lastName: e.target.value }))}
                className={ui.input}
              />
              <input
                placeholder="Email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser((p) => ({ ...p, email: e.target.value }))}
                className={ui.input}
              />
              <select value={newUser.role} onChange={(e) => setNewUser((p) => ({ ...p, role: e.target.value }))} className={ui.select}>
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>
                Annulla
              </Button>
              <Button type="button" onClick={createUser}>
                Crea
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={modal?.type === 'delete'}
        title="Cancella utente definitivamente"
        message={`Confermi la cancellazione definitiva di ${modal?.user?.firstName} ${modal?.user?.lastName}?`}
        danger
        onConfirm={() => deleteUser(modal.user.id)}
        onCancel={() => setModal(null)}
      />
    </div>
  )
}
