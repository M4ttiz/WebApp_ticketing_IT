import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import ProtectedRoute from '../components/ProtectedRoute'
import { ui } from '../lib/utils'
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Monitor, 
  Smartphone, 
  Tablet, 
  Laptop, 
  Printer,
  Router,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle
} from 'lucide-react'
import { toast } from 'sonner'

const DEVICE_TYPE_ICONS = {
  LAPTOP: Laptop,
  SMARTPHONE: Smartphone,
  TABLET: Tablet,
  DESKTOP: Monitor,
  MONITOR: Monitor,
  PRINTER: Printer,
  ROUTER: Router,
  SWITCH: Router,
  OTHER: Package
}

const DEVICE_STATUS_COLORS = {
  AVAILABLE: 'bg-green-100 text-green-800',
  DEPLOYED: 'bg-blue-100 text-blue-800',
  BROKEN: 'bg-red-100 text-red-800',
  MAINTENANCE: 'bg-yellow-100 text-yellow-800',
  RETIRED: 'bg-gray-100 text-gray-800'
}

const DEVICE_STATUS_ICONS = {
  AVAILABLE: CheckCircle,
  DEPLOYED: Package,
  BROKEN: XCircle,
  MAINTENANCE: AlertTriangle,
  RETIRED: Clock
}

export default function InventoryDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [devices, setDevices] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    search: ''
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })

  useEffect(() => {
    fetchDevices()
    fetchStats()
  }, [filters, pagination.page])

  const fetchDevices = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value)
        )
      })
      
      const response = await api.get(`/inventory/devices?${params}`)
      setDevices(response.data.devices)
      setPagination(response.data.pagination)
    } catch (error) {
      toast.error('Errore nel caricamento dei dispositivi')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await api.get('/inventory/stats')
      setStats(response.data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleDelete = async (deviceId) => {
    if (!confirm('Sei sicuro di voler ritirare questo dispositivo?')) return
    
    try {
      await api.delete(`/inventory/devices/${deviceId}`)
      toast.success('Dispositivo ritirato con successo')
      fetchDevices()
      fetchStats()
    } catch (error) {
      toast.error('Errore nell\'eliminazione del dispositivo')
    }
  }

  const renderStats = () => {
    if (!stats) return null

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-slate-800 rounded-lg shadow-lg p-4 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Totali</p>
              <p className="text-2xl font-bold text-slate-100">{stats.total}</p>
            </div>
            <Package className="h-8 w-8 text-blue-400" />
          </div>
        </div>
        
        <div className="bg-slate-800 rounded-lg shadow-lg p-4 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Disponibili</p>
              <p className="text-2xl font-bold text-green-400">{stats.byStatus.available}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg shadow-lg p-4 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Assegnati</p>
              <p className="text-2xl font-bold text-blue-400">{stats.byStatus.deployed}</p>
            </div>
            <Package className="h-8 w-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg shadow-lg p-4 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Rotti</p>
              <p className="text-2xl font-bold text-red-400">{stats.byStatus.broken}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-400" />
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg shadow-lg p-4 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Manutenzione</p>
              <p className="text-2xl font-bold text-yellow-400">{stats.byStatus.maintenance}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-yellow-400" />
          </div>
        </div>
      </div>
    )
  }

  const renderTable = () => {
    if (loading) {
      return (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4">
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="bg-slate-800 rounded-lg shadow-lg overflow-hidden border border-slate-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-700">
            <thead className="bg-slate-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Dispositivo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Marca/Modello
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Numero Serie
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Stato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Assegnato a
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody className="bg-slate-800 divide-y divide-slate-700">
              {devices.map((device) => {
                const TypeIcon = DEVICE_TYPE_ICONS[device.type] || Package
                const StatusIcon = DEVICE_STATUS_ICONS[device.status] || Clock
                
                return (
                  <tr key={device.id} className="hover:bg-slate-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <TypeIcon className="h-5 w-5 text-slate-400 mr-2" />
                        <span className="text-sm font-medium text-slate-100">{device.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-slate-300">{device.type}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-100">{device.brand}</div>
                      <div className="text-sm text-slate-400">{device.model}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-slate-400">{device.serialNumber}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${DEVICE_STATUS_COLORS[device.status]}`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {device.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {device.assignedUser ? (
                        <div className="text-sm text-slate-100">
                          {device.assignedUser.firstName} {device.assignedUser.lastName}
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">Non assegnato</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => navigate(`/inventory/devices/${device.id}/edit`)}
                        className="text-blue-400 hover:text-blue-300 mr-3"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(device.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        
        {devices.length === 0 && (
          <div className="text-center py-8">
            <Package className="mx-auto h-12 w-12 text-slate-400" />
            <p className="mt-2 text-sm text-slate-400">Nessun dispositivo trovato</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <ProtectedRoute roles={['admin', 'technician']}>
      <div className={ui.page}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Inventario Dispositivi</h1>
            <p className={ui.subtleText}>Gestisci l'inventario dei dispositivi IT</p>
          </div>
          <button
            onClick={() => navigate('/inventory/devices/new')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuovo Dispositivo
          </button>
        </div>

        {renderStats()}

        {/* Filters */}
        <div className="bg-slate-800 rounded-lg shadow-lg p-4 mb-6 border border-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cerca dispositivo..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className={ui.input}
              />
            </div>
            
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className={ui.select}
            >
              <option value="">Tutti i tipi</option>
              <option value="LAPTOP">Laptop</option>
              <option value="SMARTPHONE">Smartphone</option>
              <option value="TABLET">Tablet</option>
              <option value="DESKTOP">Desktop</option>
              <option value="MONITOR">Monitor</option>
              <option value="PRINTER">Stampante</option>
              <option value="ROUTER">Router</option>
              <option value="SWITCH">Switch</option>
              <option value="OTHER">Altro</option>
            </select>

            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className={ui.select}
            >
              <option value="">Tutti gli stati</option>
              <option value="AVAILABLE">Disponibile</option>
              <option value="DEPLOYED">Assegnato</option>
              <option value="BROKEN">Rotto</option>
              <option value="MAINTENANCE">Manutenzione</option>
              <option value="RETIRED">Ritirato</option>
            </select>

            <button
              onClick={() => setFilters({ type: '', status: '', search: '' })}
              className="w-full px-4 py-2 border border-slate-600 rounded-md shadow-sm text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700"
            >
              Reset Filtri
            </button>
          </div>
        </div>

        {renderTable()}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-between items-center mt-6">
            <div className="text-sm text-slate-400">
              Mostrando {((pagination.page - 1) * pagination.limit) + 1} a {Math.min(pagination.page * pagination.limit, pagination.total)} di {pagination.total} risultati
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page === 1}
                className="px-3 py-1 border border-slate-600 rounded-md text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Precedente
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                disabled={pagination.page === pagination.pages}
                className="px-3 py-1 border border-slate-600 rounded-md text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Successivo
              </button>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
