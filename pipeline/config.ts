import path from 'node:path';

/** All settings can be overridden with environment variables (see .env.example). */
export const config = {
  dbPath: process.env.HYVAEP_DB ?? path.resolve('data/hyvaep.db'),
  schemaPath: process.env.HYVAEP_SCHEMA ?? path.resolve('db/schema.sql'),
  /** Where `export` writes the frontend's JSON files. */
  exportDir: process.env.HYVAEP_EXPORT_DIR ?? path.resolve('src/data'),

  /** Sent with every request. Nominatim's usage policy requires an identifying User-Agent. */
  userAgent: process.env.HYVAEP_USER_AGENT ?? 'hyvaep-dashboard-data-pipeline/0.1',
  /** Optional contact address appended to Nominatim requests (`email=`), per their policy. */
  nominatimEmail: process.env.NOMINATIM_EMAIL ?? '',

  statfinUrl: process.env.STATFIN_URL ?? 'https://pxdata.stat.fi/PxWeb/api/v1/fi/StatFin',
  sotkanetUrl: process.env.SOTKANET_URL ?? 'https://sotkanet.fi/rest/1.1',
  osrmUrl: process.env.OSRM_URL ?? 'https://router.project-osrm.org',
  nominatimUrl: process.env.NOMINATIM_URL ?? 'https://nominatim.openstreetmap.org',

  /** Minimum delay between requests to the same host (ms). Nominatim: max 1 req/s. */
  hostDelayMs: {
    'nominatim.openstreetmap.org': 1100,
    'router.project-osrm.org': 1000,
    'pxdata.stat.fi': 600, // StatFin allows ~30 requests / 10 s
    'sotkanet.fi': 300,
  } as Record<string, number>,
  defaultHostDelayMs: 250,
  retries: 3,
  timeoutMs: 60_000,
};
