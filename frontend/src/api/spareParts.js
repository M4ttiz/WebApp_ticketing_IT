import api from './axios'

export const getSpareParts = (params = {}) => api.get('/spare-parts', { params })
export const getSparePart = (id) => api.get(`/spare-parts/${id}`)
export const getSparePartHistory = (id) => api.get(`/spare-parts/${id}/history`)
export const createSparePart = (data) => api.post('/spare-parts', data)
export const updateSparePart = (id, data) => api.patch(`/spare-parts/${id}`, data)
export const deleteSparePart = (id) => api.delete(`/spare-parts/${id}`)
export const getTicketSpareParts = (ticketId) => api.get(`/spare-parts/ticket/${ticketId}`)
export const addTicketSparePart = (ticketId, data) => api.post(`/spare-parts/ticket/${ticketId}`, data)
export const removeTicketSparePart = (ticketId, sparePartId) => api.delete(`/spare-parts/ticket/${ticketId}/${sparePartId}`)
