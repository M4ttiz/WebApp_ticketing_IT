const test = require('node:test');
const assert = require('node:assert/strict');

const { validateStatusTransition } = require('../src/controllers/ticket.controller');
const { AppError } = require('../src/utils/errors');

test('chiusura o risoluzione senza nota viene bloccata', () => {
  const ticket = { status: 'IN_LAVORAZIONE', requesterId: 'user-1' };

  assert.throws(
    () => validateStatusTransition({ ticket, role: 'technician', userId: 'tech-1', targetStatus: 'RISOLTO' }),
    (error) => error instanceof AppError
  );

  assert.doesNotThrow(() =>
    validateStatusTransition({
      ticket,
      role: 'technician',
      userId: 'tech-1',
      targetStatus: 'RISOLTO',
      resolutionNote: 'Ho aggiornato il firmware e verificato la risoluzione.',
    })
  );
});
