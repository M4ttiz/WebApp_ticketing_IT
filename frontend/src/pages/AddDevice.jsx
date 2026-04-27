import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import ProtectedRoute from '../components/ProtectedRoute'
import { ui } from '../lib/utils'
import { ArrowLeft, Save, Laptop, Smartphone, Tablet, Monitor, Printer, Router, Package } from 'lucide-react'
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

export default function AddDevice() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState([])
  const [formData, setFormData] = useState({
    name: '',
    type: 'LAPTOP',
    brand: '',
    model: '',
    serialNumber: '',
    status: 'AVAILABLE',
    purchaseDate: '',
    assignedTo: ''
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users')
      setUsers(response.data)
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Il nome è obbligatorio'
    }
    
    if (!formData.brand.trim()) {
      newErrors.brand = 'La marca è obbligatoria'
    }
    
    if (!formData.model.trim()) {
      newErrors.model = 'Il modello è obbligatorio'
    }
    
    if (!formData.serialNumber.trim()) {
      newErrors.serialNumber = 'Il numero di serie è obbligatorio'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      const payload = {
        ...formData,
        purchaseDate: formData.purchaseDate || null
      }
      
      await api.post('/inventory/devices', payload)
      toast.success('Dispositivo creato con successo')
      navigate('/inventory')
    } catch (error) {
      if (error.response?.data?.error) {
        toast.error(error.response.data.error)
      } else {
        toast.error('Errore nella creazione del dispositivo')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  return (
    <ProtectedRoute roles={['admin', 'technician']}>
      <div className={ui.page}>
        <div className="mb-6">
          <button
            onClick={() => navigate('/inventory')}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Torna all'inventario
          </button>
          <h1 className="text-2xl font-semibold tracking-tight">Nuovo Dispositivo</h1>
          <p className={ui.subtleText}>Aggiungi un nuovo dispositivo all'inventario</p>
        </div>

        <div className="bg-white rounded-lg shadow">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Informazioni di base</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Nome dispositivo *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full rounded-md shadow-sm ${errors.name ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-indigo-500'}`}
                    placeholder="es. Laptop Dell XPS 15"
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>

                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo dispositivo *
                  </label>
                  <div className="relative">
                    <select
                      id="type"
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 appearance-none pr-10"
                    >
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
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      {React.createElement(DEVICE_TYPE_ICONS[formData.type] || Package, { className: "h-5 w-5 text-gray-400" })}
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-1">
                    Marca *
                  </label>
                  <input
                    type="text"
                    id="brand"
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    className={`w-full rounded-md shadow-sm ${errors.brand ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-indigo-500'}`}
                    placeholder="es. Dell"
                  />
                  {errors.brand && <p className="mt-1 text-sm text-red-600">{errors.brand}</p>}
                </div>

                <div>
                  <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-1">
                    Modello *
                  </label>
                  <input
                    type="text"
                    id="model"
                    name="model"
                    value={formData.model}
                    onChange={handleChange}
                    className={`w-full rounded-md shadow-sm ${errors.model ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-indigo-500'}`}
                    placeholder="es. XPS 15 9510"
                  />
                  {errors.model && <p className="mt-1 text-sm text-red-600">{errors.model}</p>}
                </div>

                <div>
                  <label htmlFor="serialNumber" className="block text-sm font-medium text-gray-700 mb-1">
                    Numero di serie *
                  </label>
                  <input
                    type="text"
                    id="serialNumber"
                    name="serialNumber"
                    value={formData.serialNumber}
                    onChange={handleChange}
                    className={`w-full rounded-md shadow-sm ${errors.serialNumber ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-indigo-500'}`}
                    placeholder="es. DLX15X95102021"
                  />
                  {errors.serialNumber && <p className="mt-1 text-sm text-red-600">{errors.serialNumber}</p>}
                </div>

                <div>
                  <label htmlFor="purchaseDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Data di acquisto
                  </label>
                  <input
                    type="date"
                    id="purchaseDate"
                    name="purchaseDate"
                    value={formData.purchaseDate}
                    onChange={handleChange}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Status and Assignment */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Stato e Assegnazione</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                    Stato
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500"
                  >
                    <option value="AVAILABLE">Disponibile</option>
                    <option value="DEPLOYED">Assegnato</option>
                    <option value="BROKEN">Rotto</option>
                    <option value="MAINTENANCE">Manutenzione</option>
                    <option value="RETIRED">Ritirato</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700 mb-1">
                    Assegnato a
                  </label>
                  <select
                    id="assignedTo"
                    name="assignedTo"
                    value={formData.assignedTo}
                    onChange={handleChange}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500"
                  >
                    <option value="">Nessuno</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.firstName} {user.lastName} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/inventory')}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Salvataggio...' : 'Salva Dispositivo'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  )
}
