/**
 * Offline tests: external APIs are replaced with a fake `fetch` that serves
 * responses in each service's documented format.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { beforeEach, describe, it } from 'node:test';
import { config } from '../config';
import { observationLookup, openDb, type Db } from '../db';
import { derive, driveTimes, geocodeJob, health } from '../jobs/other';
import { exportJob, seed } from '../jobs/seed-export';
import { employment, population } from '../jobs/statfin';
import type { Job } from '../jobs/types';
import { MUNICIPALITY_AREAS, loadReference } from '../reference';
import { parseJsonStat2 } from '../sources/pxweb';

config.defaultHostDelayMs = 0;
for (const k of Object.keys(config.hostDelayMs)) config.hostDelayMs[k] = 0;
config.retries = 0;

type Handler = (url: URL, body: unknown) => unknown;
let handler: Handler = () => {
  throw new Error('no fake handler');
};
globalThis.fetch = (async (input: string | URL, init?: RequestInit) => {
  const url = new URL(String(input));
  const body = init?.body ? JSON.parse(String(init.body)) : undefined;
  try {
    return new Response(JSON.stringify(handler(url, body)), { status: 200 });
  } catch (e) {
    return new Response(String(e), { status: 404 });
  }
}) as typeof fetch;

const run = async (db: Db, job: Job) => job.run({ db, runId: (db.prepare(`INSERT INTO fetch_run (job) VALUES (?) RETURNING id`).get(job.name) as { id: number }).id, force: false, log: () => {} });

const MUNI_CODES = MUNICIPALITY_AREAS.map((m) => m.code);
const AGES = Array.from({ length: 101 }, (_, i) => String(i).padStart(3, '0'));

/** Minimal JSON-stat 2.0 dataset from the query selection; value = fn(key). */
function jsonStat(select: { code: string; selection: { values: string[] } }[], fn: (key: Record<string, string>) => number | null) {
  const id = select.map((s) => s.code);
  const size = select.map((s) => s.selection.values.length);
  const dimension = Object.fromEntries(select.map((s) => [s.code, { category: { index: Object.fromEntries(s.selection.values.map((v, i) => [v, i])) } }]));
  const value: (number | null)[] = [];
  const rec = (d: number, key: Record<string, string>) => {
    if (d === id.length) return void value.push(fn(key));
    for (const v of select[d].selection.values) rec(d + 1, { ...key, [id[d]]: v });
  };
  rec(0, {});
  return { id, size, dimension, value };
}

describe('pxweb', () => {
  it('flattens JSON-stat 2.0 in row-major order', () => {
    const rows = parseJsonStat2({
      id: ['A', 'B'],
      size: [2, 2],
      dimension: { A: { category: { index: { a1: 0, a2: 1 } } }, B: { category: { index: ['b1', 'b2'] } } },
      value: [1, 2, 3, null],
      status: { '3': '..' },
    });
    assert.deepEqual(rows.map((r) => [r.key.A, r.key.B, r.value, r.status]), [
      ['a1', 'b1', 1, undefined],
      ['a1', 'b2', 2, undefined],
      ['a2', 'b1', 3, undefined],
      ['a2', 'b2', null, '..'],
    ]);
  });
});

describe('jobs with fake services', () => {
  let db: Db;
  beforeEach(() => {
    db = openDb(':memory:');
    loadReference(db);
  });

  it('population: sums single-year ages, then derive fills county totals and shares', async () => {
    handler = (url, body) => {
      assert.match(url.pathname, /11re\.px$/);
      if (!body)
        return {
          title: 'Väestö',
          variables: [
            { code: 'Alue', text: 'Alue', values: ['SSS', ...MUNI_CODES, 'KU999'], valueTexts: ['KOKO MAA', ...MUNICIPALITY_AREAS.map((m) => m.name), 'Muu'] },
            { code: 'Ikä', text: 'Ikä', values: ['SSS', ...AGES], valueTexts: ['Yhteensä', ...AGES.map(Number).map(String)] },
            { code: 'Sukupuoli', text: 'Sukupuoli', values: ['SSS', '1', '2'], valueTexts: ['Yhteensä', 'Miehet', 'Naiset'] },
            { code: 'Vuosi', text: 'Vuosi', values: ['2024', '2025'], valueTexts: ['2024', '2025'], time: true },
            { code: 'Tiedot', text: 'Tiedot', values: ['vaesto'], valueTexts: ['Väestö 31.12.'] },
          ],
        };
      const q = (body as { query: { code: string; selection: { values: string[] } }[] }).query;
      assert.deepEqual(q.find((x) => x.code === 'Vuosi')!.selection.values, ['2025']);
      assert.deepEqual(q.find((x) => x.code === 'Sukupuoli')!.selection.values, ['SSS']);
      return jsonStat(q, (k) => (k.Alue === 'SSS' ? 100 : 10)); // 10 persons per age per municipality
    };
    await run(db, population);
    await run(db, derive);
    const get = observationLookup(db);
    assert.equal(get('pop_total', 'KU743', '2025'), 1010);
    assert.equal(get('pop_0_6', 'KU743', '2025'), 70);
    assert.equal(get('pop_65plus', 'KU743', '2025'), 360);
    assert.equal(get('pop_total', 'HVA', '2025'), 18 * 1010);
    assert.equal(get('pop_total', 'SSS', '2025'), 10100);
    assert.equal(get('pop_0_17_share', 'KU743', '2025'), 17.8);
    assert.equal(get('pop_share_of_hva', 'KU743', '2025'), 5.6);
  });

  it('employment: picks the 18–64 age band and measures by name, fails clearly on a missing one', async () => {
    const meta = {
      title: 'Työssäkäynti',
      variables: [
        { code: 'Alue', text: 'Alue', values: ['SSS', 'MK14', ...MUNI_CODES], valueTexts: ['KOKO MAA', 'Etelä-Pohjanmaa', ...MUNICIPALITY_AREAS.map((m) => m.name)] },
        { code: 'Ikä', text: 'Ikä', values: ['SSS', '18-64', '15-74'], valueTexts: ['Yhteensä', '18-64', '15-74'] },
        { code: 'Vuosi', text: 'Vuosi', values: ['2023', '2024'], valueTexts: ['2023', '2024'] },
        { code: 'Tiedot', text: 'Tiedot', values: ['tyollisyysaste', 'tyottomyysaste'], valueTexts: ['Työllisyysaste, %', 'Työttömyysaste, %'] },
      ],
    };
    handler = (_url, body) =>
      body ? jsonStat((body as { query: never }).query, (k) => (k.Tiedot === 'tyollisyysaste' ? 75.5 : 9)) : meta;
    await run(db, employment);
    const get = observationLookup(db);
    assert.equal(get('emp_rate', 'MK14', '2024'), 75.5);
    assert.equal(get('unemp_rate', 'KU005', '2024'), 9);

    meta.variables[3].valueTexts = ['Työlliset', 'Työttömät'];
    await assert.rejects(run(db, employment), /Työllisyysaste.*Options: tyollisyysaste=Työlliset/is);
  });

  it('health: maps Sotkanet region ids and keeps suppressed values as such', async () => {
    const regions = [
      ...MUNICIPALITY_AREAS.map((m, i) => ({ id: 1000 + i, code: m.code.slice(2), category: 'KUNTA', title: { fi: m.name } })),
      { id: 7, code: '15', category: 'HYVINVOINTIALUE', title: { fi: 'Etelä-Pohjanmaan hyvinvointialue' } },
      { id: 1, code: '1', category: 'MAA', title: { fi: 'Koko Suomi' } },
    ];
    handler = (url) => {
      if (url.pathname.endsWith('/regions')) return regions;
      const ind = Number(url.searchParams.get('indicator'));
      return regions.flatMap((r) => [
        { indicator: ind, region: r.id, year: 2024, gender: 'total', ...(r.id === 1000 ? {} : { value: 100 + (r.id % 10) }) },
        { indicator: ind, region: r.id, year: 2024, gender: 'male', value: 1 },
      ]);
    };
    await run(db, health);
    const row = db.prepare(`SELECT value, status FROM observation WHERE indicator_id = 'sotkanet_5641' AND area_code = ? AND period = '2024'`);
    assert.deepEqual({ ...(row.get(MUNICIPALITY_AREAS[0].code) as object) }, { value: null, status: 'suppressed' });
    assert.equal((row.get('HVA') as { value: number }).value, 107);
    assert.equal((row.get('SSS') as { value: number }).value, 101);
  });

  it('geocode → drivetimes: stores coordinates and the OSRM matrix', async () => {
    await run(db, seed);
    db.exec('DELETE FROM drive_time');
    handler = (url) => {
      if (url.host === 'nominatim.openstreetmap.org') {
        assert.equal(url.searchParams.get('countrycodes'), 'fi');
        return [{ lat: '62.79', lon: '22.84', display_name: url.searchParams.get('q'), osm_type: 'node', category: 'place', type: 'town' }];
      }
      const n = (url.searchParams.get('sources') ?? '').split(';').length;
      const m = (url.searchParams.get('destinations') ?? '').split(';').length;
      return { code: 'Ok', durations: Array.from({ length: n }, (_, i) => Array.from({ length: m }, (_, j) => 60 * (i + j))), distances: Array.from({ length: n }, () => Array(m).fill(1000)) };
    };
    assert.equal(await run(db, geocodeJob), 18 + 25);
    assert.equal(await run(db, geocodeJob), 0, 'already geocoded points are not re-fetched');
    assert.equal(await run(db, driveTimes), 18 * 25);
    const d = db.prepare(`SELECT duration_s FROM drive_time WHERE service_point_id = 's-seinajoki' AND origin_code = 'KU005'`).get() as { duration_s: number };
    assert.equal(d.duration_s, 60 * (0 + 1));
  });
});

describe('seed → export', () => {
  it('reproduces the design baseline exactly', async () => {
    const db = openDb(':memory:');
    loadReference(db);
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hyvaep-'));
    const prev = config.exportDir;
    config.exportDir = dir;
    try {
      await run(db, seed);
      await run(db, derive);
      await run(db, exportJob);
    } finally {
      config.exportDir = prev;
    }
    const read = (base: string, f: string) => JSON.parse(fs.readFileSync(path.join(base, f), 'utf8'));
    for (const f of ['vaestoennuste.json', 'kuntakortit.json']) assert.deepEqual(read(dir, f), read('db/seeds/design-baseline', f), f);
    const strip = (x: { kunnat: unknown; points: Record<string, unknown>[] }) => ({ kunnat: x.kunnat, points: x.points.map(({ addr: _a, note: _n, ...r }) => r) });
    assert.deepEqual(strip(read(dir, 'ajomatkat.json')), strip(read('db/seeds/design-baseline', 'ajomatkat.json')));
  });
});
