/** Jobs fetching Tilastokeskus StatFin tables. */
import { upsertObservations, type Observation } from '../db';
import { AREA_COUNTRY, AREA_REGION, MUNICIPALITY_AREAS, POP_GROUPS, PROJ_GROUPS } from '../reference';
import {
  latestYears,
  oneValue,
  openTable,
  query,
  resolveAreas,
  singleAges,
  totalValue,
  variable,
  valuesMatching,
  type PxRow,
  type PxTable,
} from '../sources/pxweb';
import type { Job, JobContext } from './types';

const MUNIS = MUNICIPALITY_AREAS.map((m) => ({ code: m.code, name: m.name }));
const COUNTRY = { code: AREA_COUNTRY, name: 'KOKO MAA' };
const REGION = { code: AREA_REGION, name: 'Etelä-Pohjanmaa' };

/** PX status symbols mean "not published / confidential" rather than zero. */
const statusOf = (r: PxRow): Observation['status'] => (r.value === null ? (r.status && r.status !== '' ? 'suppressed' : 'missing') : 'ok');

/** Sum single-year ages into groups, per area × year. */
function ageGroups(rows: PxRow[], vars: { area: string; year: string; age: string }, areaMap: Record<string, string>, ages: Map<string, number>, groups: { id: string; from: number; to: number }[], prefix: string): Observation[] {
  const acc = new Map<string, number>();
  for (const r of rows) {
    const age = ages.get(r.key[vars.age]);
    if (age === undefined || r.value === null) continue;
    const area = areaMap[r.key[vars.area]];
    for (const g of groups) {
      if (age < g.from || age > g.to) continue;
      const k = `${g.id}|${area}|${r.key[vars.year]}`;
      acc.set(k, (acc.get(k) ?? 0) + r.value);
    }
  }
  return [...acc].map(([k, value]) => {
    const [g, area, period] = k.split('|');
    return { indicator: `${prefix}_${g}`, area, period, value };
  });
}

async function populationByAge(ctx: JobContext, tableId: string, prefix: string, groups: typeof POP_GROUPS, years: (t: PxTable) => string[]) {
  const t = await openTable(ctx, tableId);
  const vArea = variable(t.meta, /^alue$/i);
  const vYear = variable(t.meta, /^vuosi$/i);
  const vAge = variable(t.meta, /^ikä$/i);
  const vSex = variable(t.meta, /^sukupuoli$/i, { optional: true });
  const vInfo = variable(t.meta, /^tiedot$/i, { optional: true });
  const vScenario = variable(t.meta, /^(skenaario|vaihtoehto)$/i, { optional: true });

  const areaMap = resolveAreas(vArea!, [...MUNIS, COUNTRY]);
  const ages = singleAges(vAge!);
  const yrs = years(t);
  const select: Record<string, string[]> = {
    [vArea!.code]: Object.keys(areaMap),
    [vYear!.code]: yrs,
    [vAge!.code]: [...ages.keys()],
  };
  if (vSex) select[vSex.code] = [totalValue(vSex)];
  if (vInfo) select[vInfo.code] = [vInfo.values.length === 1 ? vInfo.values[0] : oneValue(vInfo, /väestö|väkiluku|vaesto/i)];
  if (vScenario) select[vScenario.code] = [vScenario.values[0]];

  ctx.log(`${tableId}: ${Object.keys(areaMap).length} areas × ${yrs.length} years × ${ages.size} ages`);
  const rows = await query(ctx, t, select);
  const obs = ageGroups(rows, { area: vArea!.code, year: vYear!.code, age: vAge!.code }, areaMap, ages, groups, prefix);
  return upsertObservations(ctx.db, obs, ctx.runId);
}

export const population: Job = {
  name: 'population',
  source: 'statfin',
  description: 'Population by age group, latest year (StatFin 11re)',
  run: (ctx) => populationByAge(ctx, '11re', 'pop', POP_GROUPS, (t) => latestYears(variable(t.meta, /^vuosi$/i)!, 1)),
};

export const projection: Job = {
  name: 'projection',
  source: 'statfin',
  description: 'Population projection by age group, all projection years (StatFin 14wx)',
  run: (ctx) => populationByAge(ctx, '14wx', 'proj', PROJ_GROUPS, (t) => variable(t.meta, /^vuosi$/i)!.values),
};

/** Fetch rate-type measures selected by text pattern, for municipalities + region + country. */
async function measures(ctx: JobContext, tableId: string, wanted: { indicator: string; pattern: RegExp }[], opts: { age?: RegExp } = {}) {
  const t = await openTable(ctx, tableId);
  const vArea = variable(t.meta, /^alue$/i)!;
  const vYear = variable(t.meta, /^vuosi$/i)!;
  const vInfo = variable(t.meta, /^tiedot$/i)!;
  const areaMap = resolveAreas(vArea, [...MUNIS, REGION, COUNTRY]);
  const infoCodes = wanted.map((w) => oneValue(vInfo, w.pattern));
  const year = latestYears(vYear, 1);

  const select: Record<string, string[]> = { [vArea.code]: Object.keys(areaMap), [vYear.code]: year, [vInfo.code]: infoCodes };
  // Fix any other classification (sex, age, ...) to its total, or the requested age band.
  for (const v of t.meta.variables) {
    if (v === vArea || v === vYear || v === vInfo) continue;
    if (opts.age && /ikä/i.test(v.text)) select[v.code] = [oneValue(v, opts.age)];
    else select[v.code] = [totalValue(v)];
  }
  ctx.log(`${tableId}: ${wanted.map((w) => w.indicator).join(', ')} for ${year[0]}`);
  const rows = await query(ctx, t, select);
  const obs: Observation[] = rows.map((r) => ({
    indicator: wanted[infoCodes.indexOf(r.key[vInfo.code])].indicator,
    area: areaMap[r.key[vArea.code]],
    period: r.key[vYear.code],
    value: r.value,
    status: statusOf(r),
  }));
  return upsertObservations(ctx.db, obs, ctx.runId);
}

export const employment: Job = {
  name: 'employment',
  source: 'statfin',
  description: 'Employment and unemployment rate, 18–64 (StatFin 115x)',
  run: (ctx) =>
    measures(
      ctx,
      '115x',
      [
        { indicator: 'emp_rate', pattern: /^työllisyysaste/i },
        { indicator: 'unemp_rate', pattern: /^työttömyysaste/i },
      ],
      { age: /^18\s*[-–]\s*64/ },
    ),
};

export const income: Job = {
  name: 'income',
  source: 'statfin',
  description: 'Median income and low-income rates (StatFin 14ww)',
  run: (ctx) =>
    measures(ctx, '14ww', [
      { indicator: 'income_median', pattern: /mediaani/i },
      { indicator: 'low_income_rate', pattern: /^pienituloisuusaste/i },
      { indicator: 'low_income_persistent_rate', pattern: /pitkittyneesti/i },
      { indicator: 'low_income_children_rate', pattern: /lasten pienituloisuus|alle 18-vuotiaiden pienituloisuus/i },
      { indicator: 'basic_security_share', pattern: /perusturvan varassa/i },
    ]),
};

export const education: Job = {
  name: 'education',
  source: 'statfin',
  description: 'Population 15+ and tertiary degree holders, levels 5–8 (StatFin 12bq)',
  async run(ctx) {
    const t = await openTable(ctx, '12bq');
    const vArea = variable(t.meta, /^alue$/i)!;
    const vYear = variable(t.meta, /^vuosi$/i)!;
    const vLevel = variable(t.meta, /koulutusaste/i)!;
    const areaMap = resolveAreas(vArea, [...MUNIS, REGION, COUNTRY]);
    const total = totalValue(vLevel);
    // Tertiary = ISCED-based levels 5 (alin korkea-aste), 6, 7, 8.
    const tertiary = valuesMatching(vLevel, /^[5-8]$/);
    if (tertiary.length !== 4) throw new Error(`12bq: expected levels 5–8, got [${tertiary}] of [${vLevel.values}]`);
    const year = latestYears(vYear, 1);

    const select: Record<string, string[]> = { [vArea.code]: Object.keys(areaMap), [vYear.code]: year, [vLevel.code]: [total, ...tertiary] };
    for (const v of t.meta.variables) {
      if ([vArea, vYear, vLevel].includes(v)) continue;
      select[v.code] = /tiedot/i.test(v.code) && v.values.length > 1 ? [oneValue(v, /väestö|lukumäärä|henkilö/i)] : [totalValue(v)];
    }
    const rows = await query(ctx, t, select);
    const acc = new Map<string, { pop: number; tert: number }>();
    for (const r of rows) {
      const k = `${areaMap[r.key[vArea.code]]}|${r.key[vYear.code]}`;
      const a = acc.get(k) ?? { pop: 0, tert: 0 };
      if (r.key[vLevel.code] === total) a.pop += r.value ?? 0;
      else a.tert += r.value ?? 0;
      acc.set(k, a);
    }
    const obs: Observation[] = [];
    for (const [k, a] of acc) {
      const [area, period] = k.split('|');
      obs.push({ indicator: 'edu_pop_15plus', area, period, value: a.pop }, { indicator: 'edu_tertiary', area, period, value: a.tert });
    }
    return upsertObservations(ctx.db, obs, ctx.runId);
  },
};
