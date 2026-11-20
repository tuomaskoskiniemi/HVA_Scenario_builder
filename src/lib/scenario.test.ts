import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { ServicePoint } from '../data/servicePoints';
import { allowedStatuses, pointLevel, runScenario } from './scenario';

const pt = (id: string, cat: ServicePoint['cat'], dur: number[]): ServicePoint => ({
  id, cat, name: id, kunta: 'X', note: '', x: 0, y: 0, method: 'laitos', dur, dist: dur.map((d) => d * 15),
});

// Two origins (A, B). Times in seconds.
const POINTS = [
  pt('hosp', 'sairaala', [3600, 3600]),
  pt('soteA', 'sote', [0, 2400]),
  pt('taB', 'ta', [1800, 0]),
  pt('pisteB', 'piste', [1500, 300]),
];
const ORIGINS = [
  { name: 'A', weight: 1000 },
  { name: 'B', weight: 3000 },
];

describe('scenario', () => {
  it('levels: closed 0, light 1, otherwise by category', () => {
    assert.equal(pointLevel('sote', 'open'), 3);
    assert.equal(pointLevel('ta', 'light'), 1);
    assert.equal(pointLevel('sairaala', 'closed'), 0);
    assert.deepEqual(allowedStatuses('sairaala'), ['open']);
    assert.deepEqual(allowedStatuses('piste'), ['open', 'closed']);
  });

  it('no changes: before equals after', () => {
    const s = runScenario(POINTS, ORIGINS, 2, {});
    assert.deepEqual(s.rows.map((r) => [r.minBefore, r.minAfter]), [[0, 0], [0, 0]]);
    assert.equal(s.worse, 0);
  });

  it('lightening a terveysasema moves doctor visits to the next eligible point', () => {
    const s = runScenario(POINTS, ORIGINS, 2, { taB: 'light' });
    const b = s.rows[1];
    assert.equal(b.after?.point.id, 'soteA');
    assert.equal(b.delta, 40);
    assert.equal(s.worse, 1);
    assert.equal(s.over30After, 3000);
    // weighted average: (A 0 min × 1000 + B 40 min × 3000) / 4000
    assert.equal(s.avgAfter, 30);
    // the lightened point still serves level 1
    assert.equal(runScenario(POINTS, ORIGINS, 1, { taB: 'light' }).rows[1].after?.point.id, 'taB');
  });

  it('closing every eligible point leaves residents without service', () => {
    const s = runScenario(POINTS, ORIGINS, 3, { soteA: 'closed' });
    assert.equal(s.rows[0].after?.point.id, 'hosp');
    const none = runScenario([POINTS[1]], ORIGINS, 3, { soteA: 'closed' });
    assert.equal(none.noServiceAfter, 4000);
    assert.equal(none.rows[0].minAfter, Infinity);
  });
});
