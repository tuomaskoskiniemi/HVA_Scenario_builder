/** Seed the database from curated files + the design baseline, and export JSON for the frontend. */
import fs from 'node:fs';
import path from 'node:path';
import { observationLookup, tx, upsertObservations, type Observation } from '../db';
import { parseCard, renderCard } from '../cards';
import { config } from '../config';
import { AREA_COUNTRY, AREA_HVA, MUNICIPALITY_AREAS, PROJ_GROUPS, codeByName, loadReference } from '../reference';
import type { Job } from './types';

const SEEDS = path.resolve('db/seeds');
const readJson = <T>(file: string): T => JSON.parse(fs.readFileSync(path.join(SEEDS, file), 'utf8')) as T;

interface SeedPoint {
  id: string;
  category: string;
  name: string;
  municipality: string;
  address: string | null;
  note: string;
  location_method: string;
  geocode_query: string;
  lat: number | null;
  lon: number | null;
  map: { x: number; y: number };
  valid_from: string | null;
  valid_to: string | null;
  sort_order: number;
}

interface Baseline {
  ajomatkat: { kunnat: { key: string; name: string }[]; points: { id: string; dur: number[]; dist: number[] }[] };
  kuntakortit: { data: Record<string, { title: string; rows: { label: string; v: string; a: string; m: string }[] }[]> };
  vaestoennuste: { areas: { id: string; name: string }[]; data: Record<string, number[][]> };
}

const PROJ_AREA = (id: string) => (id === 'HVA' ? AREA_HVA : id === 'KOKO MAA' ? AREA_COUNTRY : codeByName[id]);
const PROJ_FIRST_YEAR = 2024;

/** Curated service points: upsert, keeping coordinates already geocoded unless the seed sets them. */
function loadServicePoints(db: Parameters<Job['run']>[0]['db']): number {
  const pts = readJson<SeedPoint[]>('service-points.json');
  const stmt = db.prepare(`
    INSERT INTO service_point (id, category_id, name, municipality_code, address, note, location_method, geocode_query,
      lat, lon, map_x, map_y, valid_from, valid_to, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET category_id = excluded.category_id, name = excluded.name,
      municipality_code = excluded.municipality_code, address = excluded.address, note = excluded.note,
      location_method = excluded.location_method, geocode_query = excluded.geocode_query,
      lat = COALESCE(excluded.lat, service_point.lat), lon = COALESCE(excluded.lon, service_point.lon),
      map_x = excluded.map_x, map_y = excluded.map_y, valid_from = excluded.valid_from, valid_to = excluded.valid_to,
      sort_order = excluded.sort_order`);
  tx(db, () => {
    for (const p of pts)
      stmt.run(p.id, p.category, p.name, p.municipality, p.address, p.note, p.location_method, p.geocode_query, p.lat, p.lon, p.map.x, p.map.y, p.valid_from, p.valid_to, p.sort_order);
  });
  const ids = pts.map((p) => p.id);
  db.prepare(`DELETE FROM service_point WHERE id NOT IN (${ids.map(() => '?').join(',')})`).run(...ids);
  return pts.length;
}

export const seed: Job = {
  name: 'seed',
  source: 'design',
  description: 'Load reference data, curated service points and the design baseline values',
  async run(ctx) {
    loadReference(ctx.db);
    let n = loadServicePoints(ctx.db);
    const base: Baseline = {
      ajomatkat: readJson('design-baseline/ajomatkat.json'),
      kuntakortit: readJson('design-baseline/kuntakortit.json'),
      vaestoennuste: readJson('design-baseline/vaestoennuste.json'),
    };

    // Municipality cards → observations
    const obs: Observation[] = [];
    for (const [name, groups] of Object.entries(base.kuntakortit.data)) obs.push(...parseCard(codeByName[name], groups));
    // Projection → observations
    for (const [id, years] of Object.entries(base.vaestoennuste.data)) {
      years.forEach((row, yi) =>
        PROJ_GROUPS.forEach((g, gi) => obs.push({ indicator: `proj_${g.id}`, area: PROJ_AREA(id), period: String(PROJ_FIRST_YEAR + yi), value: row[gi] })),
      );
    }
    // Region/country values repeat across cards; keep one of each.
    const unique = [...new Map(obs.map((o) => [`${o.indicator}|${o.area}|${o.period}`, o])).values()];
    n += upsertObservations(ctx.db, unique, ctx.runId);

    // Drive times
    const origins = base.ajomatkat.kunnat.map((k) => MUNICIPALITY_AREAS.find((m) => m.slug === k.key)!.code);
    const stmt = ctx.db.prepare(`
      INSERT INTO drive_time (service_point_id, origin_code, duration_s, distance_m, fetch_run_id) VALUES (?, ?, ?, ?, ?)
      ON CONFLICT DO UPDATE SET duration_s = excluded.duration_s, distance_m = excluded.distance_m, fetch_run_id = excluded.fetch_run_id`);
    tx(ctx.db, () => {
      for (const p of base.ajomatkat.points)
        origins.forEach((o, i) => {
          stmt.run(p.id, o, p.dur[i], p.dist[i], ctx.runId);
          n++;
        });
    });
    return n;
  },
};

export const exportJob: Job = {
  name: 'export',
  source: null,
  description: 'Write the frontend JSON files (src/data) from the database',
  async run(ctx) {
    const db = ctx.db;
    const get = observationLookup(db);
    const munis = db.prepare(`SELECT code, name, slug FROM area WHERE kind = 'municipality' ORDER BY name COLLATE NOCASE`).all() as { code: string; name: string; slug: string }[];
    munis.sort((a, b) => a.name.localeCompare(b.name, 'fi'));
    const write = (file: string, data: unknown) => {
      fs.writeFileSync(path.join(config.exportDir, file), JSON.stringify(data, null, 1) + '\n');
      ctx.log(`wrote ${path.join(config.exportDir, file)}`);
    };

    // Projection
    const years = (db.prepare(`SELECT DISTINCT period FROM observation WHERE indicator_id = 'proj_total' AND area_code = ? ORDER BY period`).all(AREA_HVA) as { period: string }[]).map((r) => r.period);
    if (!years.length) throw new Error('No projection data in the database (run seed or fetch projection).');
    const areas = [{ id: 'HVA', name: 'Hyvinvointialue (18 kuntaa)' }, ...munis.map((m) => ({ id: m.name, name: m.name })), { id: 'KOKO MAA', name: 'Koko maa' }];
    const projData: Record<string, number[][]> = {};
    for (const a of areas) {
      projData[a.id] = years.map((y) =>
        PROJ_GROUPS.map((g) => {
          const v = get(`proj_${g.id}`, PROJ_AREA(a.id), y);
          if (v == null) throw new Error(`Missing proj_${g.id} for ${a.id} ${y}`);
          return v;
        }),
      );
    }
    write('vaestoennuste.json', { areas, data: projData });

    // Drive times
    const points = db.prepare(`SELECT p.*, a.name AS kunta FROM service_point p JOIN area a ON a.code = p.municipality_code ORDER BY sort_order`).all() as Record<string, unknown>[];
    const dt = db.prepare('SELECT duration_s AS d, distance_m AS m FROM drive_time WHERE service_point_id = ? AND origin_code = ?');
    write('ajomatkat.json', {
      kunnat: munis.map((m) => ({ key: m.slug, name: m.name })),
      points: points.map((p) => {
        const rows = munis.map((m) => dt.get(p.id as string, m.code) as { d: number; m: number } | undefined);
        if (rows.some((r) => !r)) throw new Error(`Missing drive times for ${p.id as string}`);
        return {
          id: p.id,
          cat: p.category_id,
          name: p.name,
          kunta: p.kunta,
          x: p.map_x,
          y: p.map_y,
          method: p.location_method,
          dur: rows.map((r) => r!.d),
          dist: rows.map((r) => r!.m),
          addr: p.address ?? undefined,
          note: p.note,
        };
      }),
    });

    // Municipality cards (map positions only; values rendered from the database)
    const BASE = readJson<{ kunnat: unknown[] }>('design-baseline/kuntakortit.json').kunnat;
    write('kuntakortit.json', { kunnat: BASE, data: Object.fromEntries(munis.map((m) => [m.name, renderCard(m.code, get)])) });
    return 3;
  },
};
