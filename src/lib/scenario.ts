/**
 * Service-network scenarios: close a service point or turn it into a lighter one,
 * then compare each municipality's drive time to the nearest point that still offers
 * the service level being examined.
 *
 * Pure functions, no React: covered by src/lib/scenario.test.ts.
 */
import type { CategoryId, ServicePoint } from '../data/servicePoints';

export type PointStatus = 'open' | 'light' | 'closed';

/** Service levels, highest first. A point serves every level up to its own. */
export type ServiceLevel = 3 | 2 | 1;

export const SERVICE_LEVELS: { level: ServiceLevel; name: string; detail: string }[] = [
  { level: 3, name: 'Sote-keskustason palvelut', detail: 'Lähin sote-keskus tai keskussairaala' },
  { level: 2, name: 'Lääkärin vastaanotto', detail: 'Lähin terveysasema, sote-keskus tai keskussairaala' },
  { level: 1, name: 'Mikä tahansa lähipalvelu', detail: 'Lähin toimipiste, myös sote-pisteet' },
];

const CATEGORY_LEVEL: Record<CategoryId, ServiceLevel> = { sairaala: 3, sote: 3, ta: 2, piste: 1 };

/** The level a point offers under its scenario status (0 = closed). */
export function pointLevel(cat: CategoryId, status: PointStatus): number {
  if (status === 'closed') return 0;
  if (status === 'light') return 1;
  return CATEGORY_LEVEL[cat];
}

/** Which statuses make sense for a point: the hospital is fixed, a sote-piste can't get lighter. */
export function allowedStatuses(cat: CategoryId): PointStatus[] {
  if (cat === 'sairaala') return ['open'];
  if (cat === 'piste') return ['open', 'closed'];
  return ['open', 'light', 'closed'];
}

export interface Nearest {
  point: ServicePoint;
  /** seconds */
  dur: number;
  /** metres */
  dist: number;
}

/** Nearest point offering at least `level` from origin index `o`, or null if none remains. */
export function nearest(points: ServicePoint[], o: number, level: ServiceLevel, status: (id: string) => PointStatus): Nearest | null {
  let best: Nearest | null = null;
  for (const p of points) {
    if (pointLevel(p.cat, status(p.id)) < level) continue;
    if (!best || p.dur[o] < best.dur) best = { point: p, dur: p.dur[o], dist: p.dist[o] };
  }
  return best;
}

export interface OriginInput {
  name: string;
  /** Residents counted for this origin (all residents or 65+). */
  weight: number;
}

export interface OriginResult {
  name: string;
  weight: number;
  before: Nearest | null;
  after: Nearest | null;
  /** minutes, rounded; Infinity when the service is gone entirely */
  minBefore: number;
  minAfter: number;
  /** minutes added (0 if unchanged) */
  delta: number;
}

export interface ScenarioSummary {
  rows: OriginResult[];
  /** weight-averaged minutes over origins that have a point (before / after) */
  avgBefore: number;
  avgAfter: number;
  over30Before: number;
  over30After: number;
  over60Before: number;
  over60After: number;
  /** municipalities whose trip gets longer */
  worse: number;
  /** residents left with no point at this level at all */
  noServiceAfter: number;
}

const minutes = (n: Nearest | null) => (n ? Math.round(n.dur / 60) : Infinity);

export function runScenario(
  points: ServicePoint[],
  origins: OriginInput[],
  level: ServiceLevel,
  statuses: Record<string, PointStatus>,
): ScenarioSummary {
  const now = () => 'open' as PointStatus;
  const scen = (id: string) => statuses[id] ?? 'open';
  const rows = origins.map((o, i) => {
    const before = nearest(points, i, level, now);
    const after = nearest(points, i, level, scen);
    const minBefore = minutes(before);
    const minAfter = minutes(after);
    return { name: o.name, weight: o.weight, before, after, minBefore, minAfter, delta: minAfter - minBefore };
  });

  const avg = (key: 'minBefore' | 'minAfter') => {
    const ok = rows.filter((r) => Number.isFinite(r[key]));
    const w = ok.reduce((a, r) => a + r.weight, 0);
    return w ? ok.reduce((a, r) => a + r[key] * r.weight, 0) / w : 0;
  };
  const over = (key: 'minBefore' | 'minAfter', limit: number) => rows.filter((r) => r[key] > limit).reduce((a, r) => a + r.weight, 0);

  return {
    rows,
    avgBefore: avg('minBefore'),
    avgAfter: avg('minAfter'),
    over30Before: over('minBefore', 30),
    over30After: over('minAfter', 30),
    over60Before: over('minBefore', 60),
    over60After: over('minAfter', 60),
    worse: rows.filter((r) => r.delta > 0).length,
    noServiceAfter: rows.filter((r) => !Number.isFinite(r.minAfter)).reduce((a, r) => a + r.weight, 0),
  };
}
