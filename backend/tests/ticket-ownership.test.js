const test = require('node:test');
const assert = require('node:assert/strict');

const {
  ALLOWED_TRANSITIONS,
  validateTicketTakeover,
  validateStatusTransition,
} = require('../src/controllers/ticket.controller');
const { AppError, ForbiddenError, NotFoundError } = require('../src/utils/errors');

test('1. un ticket senza asset non può essere preso in carico', async () => {
  await assert.rejects(
    () => validateTicketTakeover({
      ticket: { id: 12, assigneeId: null, status: 'APERTO', assets: [] },
      user: { id: 'tech-1', role: 'technician' },
      assetId: null,
      assetLookup: async () => null,
    }),
    (error) => error instanceof AppError && /asset/i.test(error.message)
  );
});

test('2. un ticket con asset valido può essere preso in carico', async () => {
  const result = await validateTicketTakeover({
    ticket: { id: 12, assigneeId: null, status: 'APERTO', assets: [] },
    user: { id: 'tech-1', role: 'technician' },
    assetId: 'asset-123',
    assetLookup: async () => ({ id: 'asset-123', name: 'Laptop 14', status: 'DISPONIBILE' }),
  });

  assert.equal(result.assetId, 'asset-123');
});

test('3. un ticket con asset già associato non richiede una nuova selezione', async () => {
  const result = await validateTicketTakeover({
    ticket: { id: 12, assigneeId: null, status: 'APERTO', assets: [{ assetId: 'asset-456' }] },
    user: { id: 'tech-1', role: 'technician' },
    assetId: undefined,
    assetLookup: async () => ({ id: 'asset-456', name: 'Stampante', status: 'DISPONIBILE' }),
  });

  assert.equal(result.assetId, 'asset-456');
});

test('4. la validazione rifiuta un asset inesistente', async () => {
  await assert.rejects(
    () => validateTicketTakeover({
      ticket: { id: 12, assigneeId: null, status: 'APERTO', assets: [] },
      user: { id: 'tech-1', role: 'technician' },
      assetId: 'missing-asset',
      assetLookup: async () => null,
    }),
    (error) => error instanceof NotFoundError && /asset/i.test(error.message)
  );
});

test('5. un utente senza permessi non può far cambiare stato', () => {
  assert.throws(
    () => validateStatusTransition({
      ticket: { id: 1, status: 'RISOLTO', requesterId: 'user-2' },
      role: 'user',
      userId: 'user-1',
      targetStatus: 'CHIUSO',
    }),
    (error) => error instanceof ForbiddenError
  );
});

test('6. transizioni non consentite vengono rifiutate', () => {
  assert.throws(
    () => validateStatusTransition({
      ticket: { id: 1, status: 'APERTO', requesterId: 'user-1' },
      role: 'admin',
      userId: 'admin-1',
      targetStatus: 'CHIUSO',
    }),
    (error) => error instanceof AppError && /non permessa/i.test(error.message)
  );
});

test('7. transizioni consentite passano senza blocchi', () => {
  const result = validateStatusTransition({
    ticket: { id: 1, status: 'APERTO', requesterId: 'user-1' },
    role: 'admin',
    userId: 'admin-1',
    targetStatus: 'IN_LAVORAZIONE',
  });

  assert.deepEqual(result.allowed, true);
  assert.deepEqual(ALLOWED_TRANSITIONS.APERTO.includes('IN_LAVORAZIONE'), true);
});

test('8. l’asset per il ticket già associato viene rilevato correttamente', async () => {
  const result = await validateTicketTakeover({
    ticket: { id: 99, assigneeId: null, status: 'APERTO', assets: [{ assetId: 'asset-999' }] },
    user: { id: 'tech-2', role: 'technician' },
    assetId: undefined,
    assetLookup: async () => ({ id: 'asset-999', name: 'Monitor', status: 'IN_USO' }),
  });

  assert.equal(result.assetId, 'asset-999');
});

test('9. asset non accessibile per un utente non autorizzato viene rifiutato', async () => {
  await assert.rejects(
    () => validateTicketTakeover({
      ticket: { id: 50, assigneeId: null, status: 'APERTO', assets: [] },
      user: { id: 'user-1', role: 'user' },
      assetId: 'asset-hello',
      assetLookup: async () => ({ id: 'asset-hello', name: 'Access point', status: 'DISPONIBILE' }),
    }),
    (error) => error instanceof ForbiddenError
  );
});
