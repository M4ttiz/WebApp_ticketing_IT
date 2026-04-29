/**
 * Normalizza ruoli backend → ruoli logici UI.
 * `technician` è trattato come `agent` ovunque serva coerenza con il product plan.
 */
// TODO: aggiungere "viewer" enum nel schema.prisma (backend)

export function normalizeRole(role) {
  const r = String(role || '').toLowerCase()
  if (r === 'technician') return 'agent'
  return r
}

export function isAgentRole(role) {
  return normalizeRole(role) === 'agent'
}
