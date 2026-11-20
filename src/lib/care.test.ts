import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CARE_GROUPS, CARE_NEEDS } from '../content/careNeeds';
import { SERVICE_POINTS, DRIVE_ORIGINS } from '../data/servicePoints';
import { matchesQuery, optionsFor } from './care';

const need = (id: string) => CARE_NEEDS.find((n) => n.id === id)!;
const origin = (name: string) => DRIVE_ORIGINS.findIndex((o) => o.name === name);

describe('care needs', () => {
  it('lists 20 needs, each in a known group', () => {
    assert.equal(CARE_NEEDS.length, 20);
    assert.equal(new Set(CARE_NEEDS.map((n) => n.id)).size, 20);
    for (const n of CARE_NEEDS) assert.ok(CARE_GROUPS.some((g) => g.id === n.group), n.id);
  });

  it('nearest point respects the point types that offer the need', () => {
    const lab = optionsFor(SERVICE_POINTS, need('laboratorio'), origin('Soini'));
    assert.equal(lab[0].point.id, 'p-soini');
    assert.equal(lab[0].min, 0);
    const doctor = optionsFor(SERVICE_POINTS, need('hengitystie'), origin('Soini'));
    assert.ok(['ta', 'sote'].includes(doctor[0].point.cat));
    assert.equal(doctor[0].point.id, 's-alajarvi');
    const er = optionsFor(SERVICE_POINTS, need('paivystys'), origin('Isojoki'));
    assert.equal(er.length, 1);
    assert.equal(er[0].point.id, 'skssairaala');
    assert.equal(er[0].min, 104);
  });

  it('options are sorted by drive time', () => {
    const o = optionsFor(SERVICE_POINTS, need('mielenterveys'), origin('Teuva'));
    assert.deepEqual(o.map((x) => x.dur), [...o.map((x) => x.dur)].sort((a, b) => a - b));
    assert.ok(o.every((x) => x.point.cat === 'sote'));
  });

  it('search matches names and examples, ignoring case', () => {
    assert.ok(matchesQuery(need('laboratorio'), 'VERIKOKEET'));
    assert.ok(matchesQuery(need('neuvola'), 'neuvola'));
    assert.ok(!matchesQuery(need('neuvola'), 'hammas'));
    assert.ok(matchesQuery(need('neuvola'), '  '));
  });
});
