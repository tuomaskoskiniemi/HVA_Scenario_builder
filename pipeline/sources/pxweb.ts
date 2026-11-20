/**
 * Tilastokeskus StatFin PxWeb API (v1) client.
 * Docs: https://pxdata.stat.fi/api1.html
 *
 * Tables are addressed by their short id ('11re'). Variable and value codes are
 * resolved from each table's metadata instead of being hard-coded, so small changes
 * in table structure fail loudly with a list of what the table actually offers.
 */
import { config } from '../config';
import { requestJson, type RequestContext } from '../http';

export interface PxVariable {
  code: string;
  text: string;
  values: string[];
  valueTexts: string[];
  time?: boolean;
  elimination?: boolean;
}
export interface PxMeta {
  title: string;
  variables: PxVariable[];
}
export interface PxTable {
  id: string;
  url: string;
  meta: PxMeta;
}

/** Known locations of the tables this project uses (database folder / file). */
export const STATFIN_TABLES: Record<string, string> = {
  '11re': 'vaerak/statfin_vaerak_pxt_11re.px',
  '14wx': 'vaenn/statfin_vaenn_pxt_14wx.px',
  '115x': 'tyokay/statfin_tyokay_pxt_115x.px',
  '12bq': 'vkour/statfin_vkour_pxt_12bq.px',
  '14ww': 'tjt/statfin_tjt_pxt_14ww.px',
};

/** Open a table: try the known path, fall back to the API's search if it has moved. */
export async function openTable(ctx: RequestContext, id: string): Promise<PxTable> {
  const known = STATFIN_TABLES[id];
  if (known) {
    const url = `${config.statfinUrl}/${known}`;
    try {
      return { id, url, meta: await requestJson<PxMeta>(ctx, url) };
    } catch (e) {
      if (!(e instanceof Error && 'status' in e && (e as { status: number }).status === 404)) throw e;
    }
  }
  const hits = await requestJson<{ id: string; path: string }[]>(ctx, `${config.statfinUrl}?query=${encodeURIComponent(id)}`);
  const hit = hits.find((h) => h.id.toLowerCase().includes(`_${id.toLowerCase()}.px`));
  if (!hit) throw new Error(`StatFin table ${id} not found (search returned ${hits.length} results)`);
  const url = `${config.statfinUrl}${hit.path}/${hit.id}`.replace(/(?<!:)\/\//g, '/');
  return { id, url, meta: await requestJson<PxMeta>(ctx, url) };
}

// ---------- metadata helpers ----------

const norm = (s: string) => s.toLowerCase().normalize('NFC').trim();

/** Find a variable by code or text pattern. */
export function variable(meta: PxMeta, pattern: RegExp, opts: { optional?: boolean } = {}): PxVariable | undefined {
  const v = meta.variables.find((x) => pattern.test(x.code) || pattern.test(x.text));
  if (!v && !opts.optional) {
    throw new Error(`Variable ${pattern} not in "${meta.title}". Available: ${meta.variables.map((x) => `${x.code} (${x.text})`).join(', ')}`);
  }
  return v;
}

/** Pick the value codes whose code or text matches. */
export function valuesMatching(v: PxVariable, pattern: RegExp): string[] {
  return v.values.filter((code, i) => pattern.test(code) || pattern.test(v.valueTexts[i]));
}

/** Exactly one value matching `pattern`; error lists the options otherwise. */
export function oneValue(v: PxVariable, pattern: RegExp): string {
  const hits = valuesMatching(v, pattern);
  if (hits.length !== 1) {
    const opts = v.values.map((c, i) => `${c}=${v.valueTexts[i]}`).join('; ');
    throw new Error(`Expected one value of "${v.text}" matching ${pattern}, got ${hits.length}. Options: ${opts}`);
  }
  return hits[0];
}

/** The "total" value of a classification (SSS / Yhteensä / Kaikki ...). */
export function totalValue(v: PxVariable): string {
  return oneValue(v, /^(SSS|S|Yhteensä|Kaikki.*|Total|Sukupuolet yhteensä|Koulutusasteet yhteensä|Kaikki ikäluokat)$/i);
}

export interface AreaWanted {
  code: string; // our code, e.g. KU005 / MK14 / SSS
  name: string;
}

/**
 * Map our area codes to the table's area value codes. Matches on code (KU005, 005),
 * then on name. Returns { tableCode: ourCode }.
 */
export function resolveAreas(v: PxVariable, wanted: AreaWanted[]): Record<string, string> {
  const out: Record<string, string> = {};
  const missing: string[] = [];
  for (const w of wanted) {
    const digits = w.code.replace(/^KU/, '');
    let i = v.values.findIndex((c) => c === w.code || (w.code.startsWith('KU') && (c === digits || c === `KU${digits}`)));
    if (i < 0) i = v.valueTexts.findIndex((t) => norm(t) === norm(w.name) || norm(t).startsWith(norm(w.name) + ' '));
    if (i < 0) missing.push(`${w.code} ${w.name}`);
    else out[v.values[i]] = w.code;
  }
  if (missing.length) throw new Error(`Areas not found in "${v.text}": ${missing.join(', ')}`);
  return out;
}

/** Single-year age values (code → age), e.g. "000"..."100". Totals and ranges are skipped. */
export function singleAges(v: PxVariable): Map<string, number> {
  const ages = new Map<string, number>();
  v.values.forEach((code, i) => {
    if (/^\d{1,3}$/.test(code)) ages.set(code, parseInt(code, 10));
    else if (/^\d{1,3}(\s*v\.?)?\s*(\+|-)?$/.test(v.valueTexts[i]) && !/-\d/.test(v.valueTexts[i])) ages.set(code, parseInt(v.valueTexts[i], 10));
  });
  if (ages.size < 90) throw new Error(`"${v.text}" does not have single-year ages (found ${ages.size}).`);
  return ages;
}

// ---------- data query ----------

export interface PxRow {
  /** variable code → value code */
  key: Record<string, string>;
  value: number | null;
  /** PX status symbol for missing / suppressed values (e.g. "." or "..") */
  status?: string;
}

interface JsonStat2 {
  id: string[];
  size: number[];
  dimension: Record<string, { category: { index: Record<string, number> | string[] } }>;
  value: (number | null)[] | Record<string, number | null>;
  status?: Record<string, string> | string[];
}

/** Query a table. `select` maps variable code → value codes. */
export async function query(ctx: RequestContext, table: PxTable, select: Record<string, string[]>): Promise<PxRow[]> {
  const body = {
    query: Object.entries(select).map(([code, values]) => ({ code, selection: { filter: 'item', values } })),
    response: { format: 'json-stat2' },
  };
  const res = await requestJson<JsonStat2>(ctx, table.url, body);
  return parseJsonStat2(res);
}

/** Flatten a JSON-stat 2.0 dataset into rows. */
export function parseJsonStat2(ds: JsonStat2): PxRow[] {
  const codesByDim = ds.id.map((d) => {
    const idx = ds.dimension[d].category.index;
    if (Array.isArray(idx)) return idx;
    const arr: string[] = [];
    for (const [code, i] of Object.entries(idx)) arr[i] = code;
    return arr;
  });
  const total = ds.size.reduce((a, b) => a * b, 1);
  const valueAt = (i: number) => (Array.isArray(ds.value) ? ds.value[i] : ds.value[String(i)]) ?? null;
  const statusAt = (i: number) => (ds.status ? (Array.isArray(ds.status) ? ds.status[i] : ds.status[String(i)]) : undefined);

  const rows: PxRow[] = [];
  for (let flat = 0; flat < total; flat++) {
    const key: Record<string, string> = {};
    let rem = flat;
    for (let d = ds.id.length - 1; d >= 0; d--) {
      key[ds.id[d]] = codesByDim[d][rem % ds.size[d]];
      rem = Math.floor(rem / ds.size[d]);
    }
    rows.push({ key, value: valueAt(flat), status: statusAt(flat) });
  }
  return rows;
}

/** Latest `n` values of the time variable. */
export function latestYears(v: PxVariable, n = 1): string[] {
  return [...v.values].sort().slice(-n);
}
