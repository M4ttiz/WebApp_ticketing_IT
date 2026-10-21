const test = require('node:test');
const assert = require('node:assert/strict');

const { validateStatusTransition } = require('../src/controllers/ticket.controller');
const { AppError } = require('../src/utils/errors');

test('risoluzione senza nota viene bloccata ma chiusura definitiva può proseguire senza nota', () => {
  const inProgressTicket = { status: 'IN_LAVORAZIONE', requesterId: 'user-1' };
  const resolvedTicket = { status: 'RISOLTO', requesterId: 'user-1' };

  assert.throws(
    () => validateStatusTransition({ ticket: inProgressTicket, role: 'technician', userId: 'tech-1', targetStatus: 'RISOLTO' }),
    (error) => error instanceof AppError
  );

  assert.doesNotThrow(() =>
    validateStatusTransition({
      ticket: inProgressTicket,
      role: 'technician',
      userId: 'tech-1',
      targetStatus: 'RISOLTO',
      resolutionNote: 'Ho aggiornato il firmware e verificato la risoluzione.',
    })
  );

  assert.doesNotThrow(() =>
    validateStatusTransition({
      ticket: resolvedTicket,
      role: 'technician',
      userId: 'tech-1',
      targetStatus: 'CHIUSO',
    })
  );
});
