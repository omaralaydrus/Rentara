import { test } from 'node:test';
import assert from 'node:assert/strict';
import { seedHomes } from '../src/shared/data/homes';
import { defaultFilters } from '../src/shared/models/rental.model';
import { estimate, filterHomes, validDate } from '../src/shared/services/rental.logic';
test('combines location, budget, bedrooms, furnishings and property filters', () => {
  const homes = filterHomes(seedHomes, {
    ...defaultFilters,
    query: 'kuala lumpur',
    maxRent: 2000,
    beds: 2,
    furnished: true,
    type: 'Apartment',
  });
  assert.deepEqual(
    homes.map((h) => h.id),
    ['demo-3'],
  );
  assert.equal(filterHomes(seedHomes, { ...defaultFilters, query: 'does not exist' }).length, 0);
});
test('sorting does not mutate the catalog and paused homes stay private', () => {
  const original = seedHomes.map((h) => h.id);
  const result = filterHomes([...seedHomes, { ...seedHomes[0], id: 'hidden', published: false }], {
    ...defaultFilters,
    sort: 'price-low',
  });
  assert.equal(result[0].rent, 1400);
  assert.equal(
    result.some((h) => h.id === 'hidden'),
    false,
  );
  assert.deepEqual(
    seedHomes.map((h) => h.id),
    original,
  );
});
test('pet-friendly filter excludes restrictive homes and max budget includes boundary', () => {
  const homes = filterHomes(seedHomes, { ...defaultFilters, pets: true, maxRent: 2400 });
  assert.deepEqual(
    homes.map((h) => h.id),
    ['demo-4'],
  );
});
test('move-in estimate adds the first month and disclosed deposit only', () => {
  assert.deepEqual(estimate({ rent: 2800, depositMonths: 2 }), {
    firstMonth: 2800,
    deposit: 5600,
    total: 8400,
  });
  assert.equal(estimate({ rent: 1400, depositMonths: 0 }).total, 1400);
});
test('date validation rejects rolled-over and malformed calendar dates', () => {
  assert.equal(validDate('2028-02-29'), true);
  assert.equal(validDate('2027-02-29'), false);
  assert.equal(validDate('2026-13-01'), false);
  assert.equal(validDate('tomorrow'), false);
});
