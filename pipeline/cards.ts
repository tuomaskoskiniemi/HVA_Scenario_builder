/**
 * Municipality card ("Kuntakortti") layout: which indicator, period and comparison
 * area each row shows. Used both to render cards from the database (export) and to
 * read the design's baseline cards into the database (seed).
 */
import type { Observation } from './db';
import { INDICATOR_BY_ID, AREA_COUNTRY, AREA_HVA, AREA_REGION } from './reference';

type RowKind =
  /** Plain count, e.g. population. */
  | 'count'
  /** Municipality's share of the wellbeing county population. */
  | 'share_of_hva'
  /** Count with share in brackets, e.g. "1 758 (19,6 %)"; region/country show the share. */
  | 'count_share'
  /** Single value formatted by the indicator's unit. */
  | 'value';

export interface CardRow {
  label: string;
  kind: RowKind;
  indicator: string;
  /** For count_share: the share indicator. */
  shareIndicator?: string;
  period: string;
  /** Area used for the "Alue" column. */
  regionArea: string;
}

export interface CardGroup {
  title: string;
  rows: CardRow[];
}

export const CARD_SPEC: CardGroup[] = [
  {
    title: 'Väestö 31.12.2025 · Tilastokeskus 11re',
    rows: [
      { label: 'Väkiluku', kind: 'count', indicator: 'pop_total', period: '2025', regionArea: AREA_HVA },
      { label: 'Osuus alueen väestöstä', kind: 'share_of_hva', indicator: 'pop_share_of_hva', period: '2025', regionArea: AREA_HVA },
      { label: 'Alle 18-vuotiaat', kind: 'count_share', indicator: 'pop_0_17', shareIndicator: 'pop_0_17_share', period: '2025', regionArea: AREA_HVA },
      { label: '0–6-vuotiaat', kind: 'count_share', indicator: 'pop_0_6', shareIndicator: 'pop_0_6_share', period: '2025', regionArea: AREA_HVA },
      { label: '65 vuotta täyttäneet', kind: 'value', indicator: 'pop_65plus_share', period: '2025', regionArea: AREA_HVA },
    ],
  },
  {
    title: 'Työ ja koulutus 2024 · Tilastokeskus 115x, 12bq',
    rows: [
      { label: 'Työllisyysaste, 18–64 v.', kind: 'value', indicator: 'emp_rate', period: '2024', regionArea: AREA_REGION },
      { label: 'Työttömyysaste, 18–64 v.', kind: 'value', indicator: 'unemp_rate', period: '2024', regionArea: AREA_REGION },
      { label: 'Korkea-asteen tutkinto, 15 v. täyttäneet', kind: 'value', indicator: 'edu_tertiary_share', period: '2024', regionArea: AREA_HVA },
    ],
  },
  {
    title: 'Toimeentulo 2024–2025 · Tilastokeskus 14ww, THL Sotkanet',
    rows: [
      { label: 'Mediaanitulo, € / kulutusyksikkö', kind: 'value', indicator: 'income_median', period: '2024', regionArea: AREA_REGION },
      { label: 'Pienituloisuusaste', kind: 'value', indicator: 'low_income_rate', period: '2024', regionArea: AREA_REGION },
      { label: 'Lasten pienituloisuusaste', kind: 'value', indicator: 'low_income_children_rate', period: '2024', regionArea: AREA_REGION },
      { label: 'Kokonaan perusturvan varassa', kind: 'value', indicator: 'basic_security_share', period: '2024', regionArea: AREA_REGION },
      { label: 'Toimeentulotukea saaneet 25–64 v. (2025)', kind: 'value', indicator: 'sotkanet_5', period: '2025', regionArea: AREA_HVA },
    ],
  },
  {
    title: 'Terveys 2024–2025 · THL Sotkanet (indeksi: koko maa = 100)',
    rows: [
      { label: 'Sairastavuusindeksi', kind: 'value', indicator: 'sotkanet_5641', period: '2024', regionArea: AREA_HVA },
      { label: 'Diabetesindeksi', kind: 'value', indicator: 'sotkanet_5661', period: '2024', regionArea: AREA_HVA },
      { label: 'Mielenterveysindeksi', kind: 'value', indicator: 'sotkanet_5651', period: '2024', regionArea: AREA_HVA },
      { label: 'Työkyvyttömyysindeksi', kind: 'value', indicator: 'sotkanet_5663', period: '2024', regionArea: AREA_HVA },
      { label: 'Työkyvyttömyyseläke, 25–64 v. (2025)', kind: 'value', indicator: 'sotkanet_306', period: '2025', regionArea: AREA_HVA },
      { label: 'Mielenterveysperust. sairauspäiväraha, ‰ 25–64 v. (2025)', kind: 'value', indicator: 'sotkanet_2345', period: '2025', regionArea: AREA_HVA },
      { label: 'Kodin ulkopuolelle sijoitetut 0–17 v. (2025)', kind: 'value', indicator: 'sotkanet_191', period: '2025', regionArea: AREA_HVA },
    ],
  },
];

// ---------- formatting (matches the frontend's Finnish number style) ----------

const DASH = '–';

export function fmtNum(x: number, decimals: number): string {
  const [int, dec] = x.toFixed(decimals).split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return dec ? `${grouped},${dec}` : grouped;
}

function fmtValue(indicator: string, v: number | null | undefined): string {
  if (v === null || v === undefined) return DASH;
  const def = INDICATOR_BY_ID[indicator];
  const suffix = def.unit === 'percent' ? ' %' : def.unit === 'eur' ? ' €' : '';
  return fmtNum(v, def.decimals) + suffix;
}

export type Lookup = (indicator: string, area: string, period: string) => number | null | undefined;

export interface RenderedRow {
  label: string;
  v: string;
  a: string;
  m: string;
}

/** Render one municipality's card from the database. */
export function renderCard(area: string, get: Lookup): { title: string; rows: RenderedRow[] }[] {
  return CARD_SPEC.map((g) => ({
    title: g.title,
    rows: g.rows.map((r) => {
      switch (r.kind) {
        case 'count':
          return {
            label: r.label,
            v: fmtValue(r.indicator, get(r.indicator, area, r.period)),
            a: fmtValue(r.indicator, get(r.indicator, r.regionArea, r.period)),
            m: fmtValue(r.indicator, get(r.indicator, AREA_COUNTRY, r.period)),
          };
        case 'share_of_hva':
          return { label: r.label, v: fmtValue(r.indicator, get(r.indicator, area, r.period)), a: '100,0 %', m: DASH };
        case 'count_share': {
          const c = get(r.indicator, area, r.period);
          const s = get(r.shareIndicator!, area, r.period);
          return {
            label: r.label,
            v: c == null || s == null ? DASH : `${fmtValue(r.indicator, c)} (${fmtValue(r.shareIndicator!, s)})`,
            a: fmtValue(r.shareIndicator!, get(r.shareIndicator!, r.regionArea, r.period)),
            m: fmtValue(r.shareIndicator!, get(r.shareIndicator!, AREA_COUNTRY, r.period)),
          };
        }
        case 'value':
          return {
            label: r.label,
            v: fmtValue(r.indicator, get(r.indicator, area, r.period)),
            a: fmtValue(r.indicator, get(r.indicator, r.regionArea, r.period)),
            m: fmtValue(r.indicator, get(r.indicator, AREA_COUNTRY, r.period)),
          };
      }
    }),
  }));
}

// ---------- parsing (design baseline → observations) ----------

function parseNum(s: string): number | null {
  if (s.trim() === DASH) return null;
  const m = s.match(/-?[\d\s ]+(?:,\d+)?/);
  return m ? parseFloat(m[0].replace(/[\s ]/g, '').replace(',', '.')) : null;
}

/** Convert one card from the design into observations (municipality, region and country columns). */
export function parseCard(area: string, groups: { rows: RenderedRow[] }[]): Observation[] {
  const out: Observation[] = [];
  const put = (indicator: string, a: string, period: string, raw: string) => {
    const value = parseNum(raw);
    out.push({ indicator, area: a, period, value, status: value === null ? 'suppressed' : 'ok' });
  };
  CARD_SPEC.forEach((g, gi) =>
    g.rows.forEach((r, ri) => {
      const row = groups[gi].rows[ri];
      if (row.label !== r.label) throw new Error(`Card layout mismatch: "${row.label}" vs "${r.label}"`);
      if (r.kind === 'count_share') {
        const m = row.v.match(/^(.*)\((.*)\)\s*$/);
        put(r.indicator, area, r.period, m ? m[1] : row.v);
        put(r.shareIndicator!, area, r.period, m ? m[2] : DASH);
        put(r.shareIndicator!, r.regionArea, r.period, row.a);
        put(r.shareIndicator!, AREA_COUNTRY, r.period, row.m);
      } else if (r.kind === 'share_of_hva') {
        put(r.indicator, area, r.period, row.v);
      } else {
        put(r.indicator, area, r.period, row.v);
        put(r.indicator, r.regionArea, r.period, row.a);
        put(r.indicator, AREA_COUNTRY, r.period, row.m);
      }
    }),
  );
  return out;
}
