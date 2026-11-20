/**
 * OpenStreetMap-based services: Nominatim (geocoding) and OSRM (routing).
 *
 * Both public servers have usage policies. Nominatim: max 1 request/s, identifying
 * User-Agent, cache results (done: coordinates are stored and only re-fetched with --force).
 * OSRM demo server: light, non-commercial use; set OSRM_URL to your own instance for production.
 */
import { config } from '../config';
import { requestJson, type RequestContext } from '../http';

export interface GeocodeHit {
  lat: number;
  lon: number;
  displayName: string;
  osmType: string;
  category: string;
  type: string;
}

export async function geocode(ctx: RequestContext, q: string): Promise<GeocodeHit | null> {
  const params = new URLSearchParams({ q, format: 'jsonv2', limit: '1', countrycodes: 'fi', 'accept-language': 'fi' });
  if (config.nominatimEmail) params.set('email', config.nominatimEmail);
  const hits = await requestJson<{ lat: string; lon: string; display_name: string; osm_type: string; category: string; type: string }[]>(
    ctx,
    `${config.nominatimUrl}/search?${params}`,
  );
  const h = hits[0];
  return h ? { lat: parseFloat(h.lat), lon: parseFloat(h.lon), displayName: h.display_name, osmType: h.osm_type, category: h.category, type: h.type } : null;
}

export interface Matrix {
  /** seconds, [source][destination] */
  durations: (number | null)[][];
  /** metres, [source][destination] */
  distances: (number | null)[][];
}

/** Driving durations and distances from every source to every destination (one request). */
export async function drivingMatrix(ctx: RequestContext, sources: { lat: number; lon: number }[], destinations: { lat: number; lon: number }[]): Promise<Matrix> {
  const coords = [...sources, ...destinations].map((p) => `${p.lon.toFixed(6)},${p.lat.toFixed(6)}`).join(';');
  const src = sources.map((_, i) => i).join(';');
  const dst = destinations.map((_, i) => sources.length + i).join(';');
  const url = `${config.osrmUrl}/table/v1/driving/${coords}?sources=${src}&destinations=${dst}&annotations=duration,distance`;
  const res = await requestJson<Matrix & { code: string; message?: string }>(ctx, url);
  if (res.code !== 'Ok') throw new Error(`OSRM: ${res.code} ${res.message ?? ''}`);
  return { durations: res.durations, distances: res.distances };
}
