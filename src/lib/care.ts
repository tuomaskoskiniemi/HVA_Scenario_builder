/** Nearest service points for a care need. Pure functions: covered by src/lib/care.test.ts. */
import type { CareNeed } from '../content/careNeeds';
import { CARE_GROUP_BY_ID } from '../content/careNeeds';
import type { ServicePoint } from '../data/servicePoints';

export interface Option {
  point: ServicePoint;
  /** whole minutes */
  min: number;
  /** whole kilometres */
  km: number;
  /** seconds, for exact ordering */
  dur: number;
}

/** Points that offer `need`, nearest first, from drive-time origin index `o`. */
export function optionsFor(points: ServicePoint[], need: CareNeed, o: number): Option[] {
  const cats = CARE_GROUP_BY_ID[need.group].categories;
  return points
    .filter((p) => cats.includes(p.cat))
    .map((p) => ({ point: p, dur: p.dur[o], min: Math.round(p.dur[o] / 60), km: Math.round(p.dist[o] / 1000) }))
    .sort((a, b) => a.dur - b.dur);
}

/** Case- and accent-tolerant search over need names and examples. */
export function matchesQuery(need: CareNeed, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return `${need.name} ${need.examples}`.toLowerCase().includes(q);
}
