/**
 * THL Sotkanet REST API client.
 * Docs: https://sotkanet.fi/sotkanet/fi/ohjeet (REST API 1.1)
 */
import { config } from '../config';
import { requestJson, type RequestContext } from '../http';

export interface SotkanetRegion {
  id: number;
  code: string;
  category: string; // 'KUNTA', 'MAAKUNTA', 'HYVINVOINTIALUE', 'MAA', ...
  title: { fi: string; sv?: string; en?: string };
}

export interface SotkanetDatum {
  indicator: number;
  region: number;
  year: number;
  gender: string;
  value?: number; // missing when not published
  absValue?: number;
}

export function regions(ctx: RequestContext) {
  return requestJson<SotkanetRegion[]>(ctx, `${config.sotkanetUrl}/regions`);
}

/** Values for one indicator, all regions, given years, both genders combined. */
export function indicatorData(ctx: RequestContext, indicator: number, years: number[]) {
  const qs = [`indicator=${indicator}`, ...years.map((y) => `years=${y}`), 'genders=total'].join('&');
  return requestJson<SotkanetDatum[]>(ctx, `${config.sotkanetUrl}/json?${qs}`);
}

/** Resolve Sotkanet region ids for our areas. Returns { sotkanetId: ourCode }. */
export function resolveRegions(
  all: SotkanetRegion[],
  wanted: { municipalities: { code: string; name: string }[]; hvaName: string; country: string },
): Map<number, string> {
  const out = new Map<number, string>();
  const missing: string[] = [];
  const cat = (c: string) => all.filter((r) => r.category.toUpperCase() === c);

  for (const m of wanted.municipalities) {
    const digits = m.code.replace(/^KU/, '');
    const r = cat('KUNTA').find((x) => x.code === digits || x.code === String(parseInt(digits, 10)) || x.title.fi === m.name);
    if (r) out.set(r.id, m.code);
    else missing.push(m.name);
  }
  const hva = cat('HYVINVOINTIALUE').find((x) => x.title.fi.toLowerCase().includes(wanted.hvaName.toLowerCase()));
  if (hva) out.set(hva.id, 'HVA');
  else missing.push(`hyvinvointialue ${wanted.hvaName}`);
  const country = cat('MAA')[0];
  if (country) out.set(country.id, wanted.country);
  else missing.push('koko maa');

  if (missing.length) {
    const cats = [...new Set(all.map((r) => r.category))].join(', ');
    throw new Error(`Sotkanet regions not found: ${missing.join(', ')} (categories available: ${cats})`);
  }
  return out;
}
