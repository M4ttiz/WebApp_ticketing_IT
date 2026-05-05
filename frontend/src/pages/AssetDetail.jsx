import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, Server, Edit, Trash2, Link as LinkIcon, Unlink,
  Calendar, MapPin, User, Monitor, Cpu, Hash, FileText, Ticket,
} from 'lucide-react'
import { toast } from 'sonner'
import { getAsset, deleteAsset, unlinkTicket } from '../api/assets'
import AssetModal from '../components/AssetModal'
import ConfirmModal from '../components/ConfirmModal'
import { useAuth } from '../context/AuthContext'
import { ui } from '../lib/utils'

const STATUS_COLORS = {
  DISPONIBILE: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  IN_USO: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  IN_MANUTENZIONE: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  DISMESSO: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  GUASTO: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
}

export default function AssetDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [asset, setAsset] = useState(null)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const isAdmin = user?.role === 'admin'

  const fetchAsset = async () => {
    setLoading(true)
    try {
      const res = await getAsset(id)
      setAsset(res.data)
    } catch (err) {
      toast.error('Asset non trovato')
      navigate('/inventory')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAsset()
  }, [id])

  const handleDelete = async () => {
    try {
      await deleteAsset(id)
      toast.success('Asset eliminato')
      navigate('/inventory')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Errore')
    }
    setConfirmDelete(false)
  }

  const handleUnlink = async (ticketId) => {
    try {
      await unlinkTicket(id, ticketId)
      toast.success('Ticket scollegato')
      fetchAsset()
    } catch (err) {
      toast.error('Errore nello scollegamento')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500" />
      </div>
    )
  }

  if (!asset) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/inventory')} className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">{asset.name}</h1>
              <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${STATUS_COLORS[asset.status]}`}>
                {asset.status.replace('_', ' ')}
              </span>
            </div>
            <p className="text-sm text-slate-400">{asset.category} {asset.assetTag ? `· ${asset.assetTag}` : ''}</p>
          </div>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <button onClick={() => setModalOpen(true)} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-primary-500/10 text-primary-400 hover:bg-primary-500/20 transition-colors">
              <Edit size={16} /> Modifica
            </button>
            <button onClick={() => setConfirmDelete(true)} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors">
              <Trash2 size={16} /> Elimina
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonna principale */}
        <div className="lg:col-span-2 space-y-6">
          <div className={ui.cardSection}>
            <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <Monitor size={16} className="text-primary-400" />
              Dettagli tecnici
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <InfoRow icon={<Hash size={14} />} label="Seriale" value={asset.serialNumber} />
              <InfoRow icon={<Cpu size={14} />} label="Marca/Modello" value={asset.brand && asset.model ? `${asset.brand} ${asset.model}` : asset.brand || asset.model} />
              <InfoRow icon={<MapPin size={14} />} label="Sede" value={asset.location} />
              <InfoRow icon={<User size={14} />} label="Assegnato a" value={asset.assignedTo} />
              <InfoRow icon={<Calendar size={14} />} label="Data acquisto" value={asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString('it-IT') : null} />
              <InfoRow icon={<Calendar size={14} />} label="Scadenza garanzia" value={asset.warrantyExpiry ? new Date(asset.warrantyExpiry).toLocaleDateString('it-IT') : null} isDate isExpired={asset.warrantyExpiry && new Date(asset.warrantyExpiry) < new Date()} />
              <InfoRow icon={<Server size={14} />} label="Indirizzo IP" value={asset.ipAddress} />
              <InfoRow icon={<Server size={14} />} label="Indirizzo MAC" value={asset.macAddress} />
              <InfoRow icon={<Monitor size={14} />} label="Sistema operativo" value={asset.osVersion} />
            </div>
            {asset.notes && (
              <div className="mt-4 pt-4 border-t border-slate-700/50">
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                  <FileText size={14} /> Note
                </div>
                <p className="text-sm text-slate-300 whitespace-pre-wrap">{asset.notes}</p>
              </div>
            )}
          </div>

          {/* Ticket collegati */}
          <div className={ui.cardSection}>
            <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <Ticket size={16} className="text-primary-400" />
              Ticket collegati ({asset.tickets?.length || 0})
            </h3>
            {asset.tickets?.length === 0 ? (
              <p className="text-sm text-slate-500">Nessun ticket collegato</p>
            ) : (
              <div className="space-y-2">
                {asset.tickets.map(ta => (
                  <div key={ta.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-700/50 hover:border-slate-600 transition-colors">
                    <Link to={`/tickets/${ta.ticket.id}`} className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-slate-400">{ta.ticket.ticketNumber}</span>
                        <span className="text-sm font-medium truncate">{ta.ticket.title}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                        <span>{ta.ticket.status}</span>
                        <span>·</span>
                        <span>{ta.ticket.priority}</span>
                      </div>
                    </Link>
                    {isAdmin && (
                      <button onClick={() => handleUnlink(ta.ticket.id)} className="ml-3 p-1.5 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors" title="Scollega ticket">
                        <Unlink size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        {/* Sidebar */}
        <div className="space-y-6">
          <div className={ui.cardSection}>
            <h3 className="text-sm font-semibold text-slate-200 mb-3">Informazioni</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-400">
                <span>Creato il</span>
                <span className="text-slate-200">{new Date(asset.createdAt).toLocaleDateString('it-IT')}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Aggiornato il</span>
                <span className="text-slate-200">{new Date(asset.updatedAt).toLocaleDateString('it-IT')}</span>
              </div>
              {asset.assignedUser && (
                <div className="flex justify-between text-slate-400">
                  <span>Utente assegnato</span>
                  <span className="text-slate-200">{asset.assignedUser.firstName} {asset.assignedUser.lastName}</span>
                </div>
              )}
            </div>
          </div>

          <div className={ui.cardSection}>
            <h3 className="text-sm font-semibold text-slate-200 mb-3">Azioni rapide</h3>
            <Link to="/tickets/new" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-primary-500/10 text-primary-400 hover:bg-primary-500/20 transition-colors">
              <LinkIcon size={14} /> Apri ticket su questo asset
            </Link>
          </div>
        </div>
      </div>

      <AssetModal isOpen={modalOpen} onClose={() => setModalOpen(false)} asset={asset} onSaved={fetchAsset} />
      <ConfirmModal
        open={confirmDelete}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Elimina asset"
        message={`Sei sicuro di voler eliminare "${asset.name}"?`}
        confirmText="Elimina"
        danger
      />
    </div>
  )
}

function InfoRow({ icon, label, value, isDate, isExpired }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-slate-500">{icon}</span>
      <div>
        <div className="text-xs text-slate-500">{label}</div>
        <div className={`font-medium ${isDate && isExpired ? 'text-rose-400' : 'text-slate-200'}`}>
          {value}
          {isDate && isExpired && ' (scaduta)'}
        </div>
      </div>
    </div>
  )
}
