/**
 * Reference data: sources, areas and the indicator catalogue.
 * Map positions and names are shared with the frontend (src/data/municipalities.ts).
 */
import { MUNICIPALITIES } from '../src/data/municipalities';
import type { Db } from './db';
import { tx } from './db';

export const SOURCES = [
  { id: 'statfin', name: 'Tilastokeskus, StatFin', url: 'https://pxdata.stat.fi/PxWeb/pxweb/fi/StatFin/', license: 'CC BY 4.0' },
  { id: 'sotkanet', name: 'THL, Sotkanet', url: 'https://sotkanet.fi', license: 'CC BY 4.0' },
  { id: 'osrm', name: 'OSRM (router.project-osrm.org)', url: 'https://project-osrm.org', license: 'Road network © OpenStreetMap contributors, ODbL' },
  { id: 'nominatim', name: 'Nominatim / OpenStreetMap', url: 'https://nominatim.openstreetmap.org', license: '© OpenStreetMap contributors, ODbL' },
  { id: 'curated', name: 'Curated (hyvaep.fi, manual)', url: 'https://www.hyvaep.fi', license: null },
  { id: 'design', name: 'Design baseline (values collected 11/2026)', url: null, license: null },
];

/** Tilastokeskus municipality codes (kuntanumero). */
export const MUNICIPALITY_CODES: Record<string, string> = {
  alajarvi: '005', alavus: '010', evijarvi: '052', ilmajoki: '145', isojoki: '151', isokyro: '152',
  karijoki: '218', kauhajoki: '232', kauhava: '233', kuortane: '300', kurikka: '301', lappajarvi: '403',
  lapua: '408', seinajoki: '743', soini: '759', teuva: '846', vimpeli: '934', ahtari: '989',
};

export const AREA_HVA = 'HVA'; // Etelä-Pohjanmaan hyvinvointialue = sum of the 18 municipalities
export const AREA_REGION = 'MK14'; // Etelä-Pohjanmaan maakunta (17 municipalities, without Isokyrö)
export const AREA_COUNTRY = 'SSS'; // Koko maa

export const muniCode = (slug: string) => `KU${MUNICIPALITY_CODES[slug]}`;

export const MUNICIPALITY_AREAS = [...MUNICIPALITIES]
  .sort((a, b) => a.name.localeCompare(b.name, 'fi'))
  .map((m) => ({ code: muniCode(m.key), slug: m.key, name: m.name, map_x: m.x, map_y: m.y, geocode_query: `${m.name}, Suomi` }));

export const codeByName = Object.fromEntries(MUNICIPALITY_AREAS.map((a) => [a.name, a.code]));
export const muniCodes = MUNICIPALITY_AREAS.map((a) => a.code);

type Unit = 'persons' | 'percent' | 'index' | 'eur' | 'per_mille' | 'years';
export interface IndicatorDef {
  id: string;
  name: string;
  unit: Unit;
  decimals: number;
  source: string;
  ref?: string;
  /** Counts can be summed over municipalities to get the HVA value. */
  additive?: boolean;
}

/** Projection / population age groups in the order the frontend expects. */
export const PROJ_GROUPS: { id: string; from: number; to: number }[] = [
  { id: 'total', from: 0, to: 200 },
  { id: '0_6', from: 0, to: 6 },
  { id: '7_17', from: 7, to: 17 },
  { id: '18_64', from: 18, to: 64 },
  { id: '65_74', from: 65, to: 74 },
  { id: '75_84', from: 75, to: 84 },
  { id: '85plus', from: 85, to: 200 },
  { id: '0_14', from: 0, to: 14 },
  { id: '15_64', from: 15, to: 64 },
];

export const POP_GROUPS: { id: string; from: number; to: number }[] = [
  { id: 'total', from: 0, to: 200 },
  { id: '0_6', from: 0, to: 6 },
  { id: '0_17', from: 0, to: 17 },
  { id: '65plus', from: 65, to: 200 },
];

/** Sotkanet indicators used in the design (THL ids). */
export const SOTKANET_INDICATORS: { id: number; name: string; unit: Unit; decimals: number }[] = [
  { id: 5641, name: 'Sairastavuusindeksi, ikävakioitu', unit: 'index', decimals: 1 },
  { id: 5661, name: 'Diabetesindeksi, ikävakioitu', unit: 'index', decimals: 1 },
  { id: 5651, name: 'Mielenterveysindeksi, ikävakioitu', unit: 'index', decimals: 1 },
  { id: 5663, name: 'Työkyvyttömyysindeksi, ikävakioitu', unit: 'index', decimals: 1 },
  { id: 306, name: 'Työkyvyttömyyseläkettä saavat, % 25–64-vuotiaista', unit: 'percent', decimals: 1 },
  { id: 2345, name: 'Mielenterveysperusteisesti sairauspäivärahaa saaneet 25–64-vuotiaat / 1000 vastaavanikäistä', unit: 'per_mille', decimals: 1 },
  { id: 5, name: 'Toimeentulotukea saaneet 25–64-vuotiaat, % vastaavanikäisestä väestöstä', unit: 'percent', decimals: 1 },
  { id: 191, name: 'Kodin ulkopuolelle sijoitetut 0–17-vuotiaat, % vastaavanikäisestä väestöstä', unit: 'percent', decimals: 1 },
];

export const INDICATORS: IndicatorDef[] = [
  ...POP_GROUPS.map((g) => ({ id: `pop_${g.id}`, name: `Väestö ${g.id.replace('_', '–')}`, unit: 'persons' as Unit, decimals: 0, source: 'statfin', ref: '11re', additive: true })),
  { id: 'pop_0_17_share', name: 'Alle 18-vuotiaiden osuus väestöstä', unit: 'percent', decimals: 1, source: 'statfin', ref: '11re' },
  { id: 'pop_0_6_share', name: '0–6-vuotiaiden osuus väestöstä', unit: 'percent', decimals: 1, source: 'statfin', ref: '11re' },
  { id: 'pop_65plus_share', name: '65 vuotta täyttäneiden osuus väestöstä', unit: 'percent', decimals: 1, source: 'statfin', ref: '11re' },
  { id: 'pop_share_of_hva', name: 'Osuus hyvinvointialueen väestöstä', unit: 'percent', decimals: 1, source: 'statfin', ref: '11re' },
  ...PROJ_GROUPS.map((g) => ({ id: `proj_${g.id}`, name: `Väestöennuste ${g.id.replace('_', '–')}`, unit: 'persons' as Unit, decimals: 0, source: 'statfin', ref: '14wx', additive: true })),
  { id: 'emp_rate', name: 'Työllisyysaste, 18–64-vuotiaat', unit: 'percent', decimals: 1, source: 'statfin', ref: '115x' },
  { id: 'unemp_rate', name: 'Työttömyysaste, 18–64-vuotiaat', unit: 'percent', decimals: 1, source: 'statfin', ref: '115x' },
  { id: 'edu_pop_15plus', name: '15 vuotta täyttänyt väestö', unit: 'persons', decimals: 0, source: 'statfin', ref: '12bq', additive: true },
  { id: 'edu_tertiary', name: 'Korkea-asteen tutkinnon suorittaneet (asteet 5–8), 15 v. täyttäneet', unit: 'persons', decimals: 0, source: 'statfin', ref: '12bq', additive: true },
  { id: 'edu_tertiary_share', name: 'Korkea-asteen tutkinnon suorittaneiden osuus, 15 v. täyttäneet', unit: 'percent', decimals: 1, source: 'statfin', ref: '12bq' },
  { id: 'income_median', name: 'Mediaanitulo, € / kulutusyksikkö', unit: 'eur', decimals: 0, source: 'statfin', ref: '14ww' },
  { id: 'low_income_rate', name: 'Pienituloisuusaste', unit: 'percent', decimals: 1, source: 'statfin', ref: '14ww' },
  { id: 'low_income_persistent_rate', name: 'Pitkittyneesti pienituloisten osuus', unit: 'percent', decimals: 1, source: 'statfin', ref: '14ww' },
  { id: 'low_income_children_rate', name: 'Lasten pienituloisuusaste', unit: 'percent', decimals: 1, source: 'statfin', ref: '14ww' },
  { id: 'basic_security_share', name: 'Kokonaan perusturvan varassa, % asuntoväestöstä', unit: 'percent', decimals: 1, source: 'statfin', ref: '14ww' },
  ...SOTKANET_INDICATORS.map((s) => ({ id: `sotkanet_${s.id}`, name: s.name, unit: s.unit, decimals: s.decimals, source: 'sotkanet', ref: String(s.id) })),
];

export const INDICATOR_BY_ID = Object.fromEntries(INDICATORS.map((i) => [i.id, i]));

export const SERVICE_CATEGORIES = [
  { id: 'sairaala', name: 'Sairaala', plural: 'Sairaala', sort_order: 0 },
  { id: 'sote', name: 'Sote-keskus', plural: 'Sote-keskukset', sort_order: 1 },
  { id: 'ta', name: 'Terveysasema', plural: 'Terveysasemat', sort_order: 2 },
  { id: 'piste', name: 'Sote-piste', plural: 'Sote-pisteet', sort_order: 3 },
];

/** Insert / refresh all reference rows. Safe to run repeatedly. */
export function loadReference(db: Db) {
  tx(db, () => {
    const src = db.prepare(
      'INSERT INTO source (id, name, url, license) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET name = excluded.name, url = excluded.url, license = excluded.license',
    );
    for (const s of SOURCES) src.run(s.id, s.name, s.url, s.license);

    const area = db.prepare(`
      INSERT INTO area (code, kind, name, slug, map_x, map_y, geocode_query) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(code) DO UPDATE SET kind = excluded.kind, name = excluded.name, slug = excluded.slug,
        map_x = excluded.map_x, map_y = excluded.map_y, geocode_query = excluded.geocode_query`);
    area.run(AREA_HVA, 'wellbeing_county', 'Etelä-Pohjanmaan hyvinvointialue', null, null, null, null);
    area.run(AREA_REGION, 'region', 'Etelä-Pohjanmaa (maakunta)', null, null, null, null);
    area.run(AREA_COUNTRY, 'country', 'Koko maa', null, null, null, null);
    for (const m of MUNICIPALITY_AREAS) area.run(m.code, 'municipality', m.name, m.slug, m.map_x, m.map_y, m.geocode_query);

    const ind = db.prepare(`
      INSERT INTO indicator (id, name, unit, decimals, source_id, source_ref) VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET name = excluded.name, unit = excluded.unit, decimals = excluded.decimals,
        source_id = excluded.source_id, source_ref = excluded.source_ref`);
    for (const i of INDICATORS) ind.run(i.id, i.name, i.unit, i.decimals, i.source, i.ref ?? null);

    const cat = db.prepare(
      'INSERT INTO service_category (id, name, plural, sort_order) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET name = excluded.name, plural = excluded.plural, sort_order = excluded.sort_order',
    );
    for (const c of SERVICE_CATEGORIES) cat.run(c.id, c.name, c.plural, c.sort_order);
  });
}
