const test = require('node:test');
const assert = require('node:assert/strict');

const {
  validateSparePartPayload,
  validateTicketSparePartPayload,
  normalizeUsedSpareParts,
} = require('../src/controllers/sparePart.controller');
const { AppError } = require('../src/utils/errors');

test('ricambio valido viene accettato', () => {
  const result = validateSparePartPayload({
    name: 'Filtro aria',
    code: 'FILT-001',
    description: 'Filtro per notebook',
    quantity: 12,
    notes: 'Eccedenza',
  });

  assert.equal(result.name, 'Filtro aria');
  assert.equal(result.quantity, 12);
});

test('ricambio senza nome viene rifiutato', () => {
  assert.throws(
    () => validateSparePartPayload({ name: '', quantity: 1 }),
    (error) => error instanceof AppError
  );
});

test('quantità di utilizzo non valida viene bloccata', () => {
  assert.throws(
    () => validateTicketSparePartPayload({ sparePartId: 'a1b2', quantity: 0 }),
    (error) => error instanceof AppError
  );
});

test('payload usati del ticket viene normalizzato correttamente', () => {
  const result = normalizeUsedSpareParts([
    { sparePartId: 'part-1', quantity: 2 },
    { sparePartId: 'part-2', quantity: 1 },
  ]);

  assert.equal(result.length, 2);
  assert.equal(result[0].quantity, 2);
});

test('aggiornamento parziale del ricambio consente quantità e soglia senza nome', () => {
  const result = validateSparePartPayload({ quantity: 5, minimumStock: 1 }, { requireName: false });

  assert.equal(result.quantity, 5);
  assert.equal(result.minimumStock, 1);
});
