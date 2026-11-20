/** Jobs for THL Sotkanet, Nominatim, OSRM, and derived values. */
import { tx, upsertObservations, type Observation } from '../db';
import { AREA_COUNTRY, AREA_HVA, INDICATORS, MUNICIPALITY_AREAS, SOTKANET_INDICATORS, muniCodes } from '../reference';
import { drivingMatrix, geocode } from '../sources/osm';
import { indicatorData, regions, resolveRegions } from '../sources/sotkanet';
import type { Job } from './types';

export const health: Job = {
  name: 'health',
  source: 'sotkanet',
  description: 'THL health and social indicators, last 3 years (Sotkanet)',
  async run(ctx) {
    const regionMap = resolveRegions(await regions(ctx), {
      municipalities: MUNICIPALITY_AREAS.map((m) => ({ code: m.code, name: m.name })),
      hvaName: 'Etelä-Pohjanmaa',
      country: AREA_COUNTRY,
    });
    const thisYear = new Date().getFullYear();
    const years = [thisYear - 3, thisYear - 2, thisYear - 1];
    let n = 0;
    for (const ind of SOTKANET_INDICATORS) {
      const data = await indicatorData(ctx, ind.id, years);
      const obs: Observation[] = data
        .filter((d) => regionMap.has(d.region) && d.gender === 'total')
        .map((d) => ({
          indicator: `sotkanet_${ind.id}`,
          area: regionMap.get(d.region)!,
          period: String(d.year),
          value: d.value ?? null,
          status: d.value === undefined ? 'suppressed' : 'ok',
        }));
      ctx.log(`sotkanet ${ind.id}: ${obs.length} values`);
      n += upsertObservations(ctx.db, obs, ctx.runId);
    }
    return n;
  },
};

export const geocodeJob: Job = {
  name: 'geocode',
  source: 'nominatim',
  description: 'Coordinates for municipality centres and service points (Nominatim); only missing ones unless --force',
  async run(ctx) {
    const where = ctx.force ? '' : ' AND lat IS NULL';
    const areas = ctx.db.prepare(`SELECT code AS id, geocode_query AS q FROM area WHERE kind = 'municipality'${where}`).all() as { id: string; q: string }[];
    const points = ctx.db.prepare(`SELECT id, geocode_query AS q FROM service_point WHERE 1 = 1${where}`).all() as { id: string; q: string }[];
    const setArea = ctx.db.prepare(`UPDATE area SET lat = ?, lon = ?, geocoded_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE code = ?`);
    const setPoint = ctx.db.prepare(`UPDATE service_point SET lat = ?, lon = ?, geocoded_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?`);
    let n = 0;
    const misses: string[] = [];
    for (const [list, stmt] of [[areas, setArea], [points, setPoint]] as const) {
      for (const item of list) {
        const hit = await geocode(ctx, item.q);
        if (!hit) {
          misses.push(`${item.id} ("${item.q}")`);
          continue;
        }
        stmt.run(hit.lat, hit.lon, item.id);
        ctx.log(`${item.id}: ${hit.lat.toFixed(5)}, ${hit.lon.toFixed(5)} – ${hit.displayName}`);
        n++;
      }
    }
    if (misses.length) ctx.log(`No match (edit geocode_query or set lat/lon in db/seeds/service-points.json): ${misses.join(', ')}`);
    return n;
  },
};

export const driveTimes: Job = {
  name: 'drivetimes',
  source: 'osrm',
  description: 'Driving time and distance from each municipality centre to each service point (OSRM)',
  async run(ctx) {
    const origins = ctx.db.prepare(`SELECT code, name, lat, lon FROM area WHERE kind = 'municipality' ORDER BY name`).all() as { code: string; name: string; lat: number | null; lon: number | null }[];
    const points = ctx.db.prepare(`SELECT id, name, lat, lon FROM service_point ORDER BY sort_order`).all() as { id: string; name: string; lat: number | null; lon: number | null }[];
    const noCoords = [...origins.filter((o) => o.lat == null).map((o) => o.name), ...points.filter((p) => p.lat == null).map((p) => p.name)];
    if (noCoords.length) throw new Error(`Missing coordinates, run "geocode" first: ${noCoords.join(', ')}`);

    const m = await drivingMatrix(
      ctx,
      origins.map((o) => ({ lat: o.lat!, lon: o.lon! })),
      points.map((p) => ({ lat: p.lat!, lon: p.lon! })),
    );
    const stmt = ctx.db.prepare(`
      INSERT INTO drive_time (service_point_id, origin_code, duration_s, distance_m, fetch_run_id) VALUES (?, ?, ?, ?, ?)
      ON CONFLICT (service_point_id, origin_code) DO UPDATE SET duration_s = excluded.duration_s, distance_m = excluded.distance_m,
        fetch_run_id = excluded.fetch_run_id, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`);
    let n = 0;
    tx(ctx.db, () => {
      origins.forEach((o, i) =>
        points.forEach((p, j) => {
          const d = m.durations[i][j];
          const dist = m.distances[i][j];
          if (d == null || dist == null) return ctx.log(`no route ${o.name} → ${p.name}`);
          stmt.run(p.id, o.code, d, dist, ctx.runId);
          n++;
        }),
      );
    });
    return n;
  },
};

/**
 * Derived values:
 *  - wellbeing county (HVA) totals = sum of the 18 municipalities, for additive counts
 *  - shares: under-18 / 0–6 / 65+ of population, municipality share of HVA, tertiary share
 * Only fills HVA totals when all 18 municipalities have a value for that period.
 */
export const derive: Job = {
  name: 'derive',
  source: null,
  description: 'Compute county totals and shares from fetched counts',
  async run(ctx) {
    const rows = ctx.db.prepare('SELECT indicator_id AS i, area_code AS a, period AS p, value AS v FROM observation').all() as { i: string; a: string; p: string; v: number | null }[];
    const get = new Map(rows.map((r) => [`${r.i}|${r.a}|${r.p}`, r.v]));
    const out: Observation[] = [];

    // HVA sums
    const munis = new Set(muniCodes);
    const sums = new Map<string, { sum: number; n: number }>();
    for (const r of rows) {
      if (!munis.has(r.a) || r.v === null || !INDICATORS.find((x) => x.id === r.i)?.additive) continue;
      const k = `${r.i}|${r.p}`;
      const s = sums.get(k) ?? { sum: 0, n: 0 };
      s.sum += r.v;
      s.n++;
      sums.set(k, s);
    }
    for (const [k, s] of sums) {
      if (s.n !== munis.size) continue;
      const [i, p] = k.split('|');
      out.push({ indicator: i, area: AREA_HVA, period: p, value: s.sum, status: 'derived' });
      get.set(`${i}|${AREA_HVA}|${p}`, s.sum);
    }

    // Shares
    const ratios: [string, string, string][] = [
      ['pop_0_17_share', 'pop_0_17', 'pop_total'],
      ['pop_0_6_share', 'pop_0_6', 'pop_total'],
      ['pop_65plus_share', 'pop_65plus', 'pop_total'],
      ['edu_tertiary_share', 'edu_tertiary', 'edu_pop_15plus'],
    ];
    const keys = [...get.keys()].map((k) => k.split('|'));
    for (const [target, num, den] of ratios) {
      for (const [i, a, p] of keys) {
        if (i !== num) continue;
        const n = get.get(`${num}|${a}|${p}`);
        const d = get.get(`${den}|${a}|${p}`);
        if (n == null || !d) continue;
        out.push({ indicator: target, area: a, period: p, value: Math.round((1000 * n) / d) / 10, status: 'derived' });
      }
    }
    for (const [i, a, p] of keys) {
      if (i !== 'pop_total' || !munis.has(a)) continue;
      const hva = get.get(`pop_total|${AREA_HVA}|${p}`);
      const v = get.get(`pop_total|${a}|${p}`);
      if (hva && v != null) out.push({ indicator: 'pop_share_of_hva', area: a, period: p, value: Math.round((1000 * v) / hva) / 10, status: 'derived' });
    }
    return upsertObservations(ctx.db, out, ctx.runId);
  },
};
