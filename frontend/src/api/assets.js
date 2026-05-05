import api from './axios'

export const getAssets = (params = {}) => {
  return api.get('/assets', { params })
}

export const getAsset = (id) => {
  return api.get(`/assets/${id}`)
}

export const createAsset = (data) => {
  return api.post('/assets', data)
}

export const updateAsset = (id, data) => {
  return api.put(`/assets/${id}`, data)
}

export const deleteAsset = (id) => {
  return api.delete(`/assets/${id}`)
}

export const linkTicket = (assetId, ticketId) => {
  return api.post(`/assets/${assetId}/link-ticket`, { ticketId })
}

export const unlinkTicket = (assetId, ticketId) => {
  return api.delete(`/assets/${assetId}/unlink-ticket/${ticketId}`)
}

export const getTopOpenTicketsByProduct = (params = {}) => {
  return api.get('/assets/analytics/top-open-tickets', { params })
}
