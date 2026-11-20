import ajomatkat from './ajomatkat.json';

export type CategoryId = 'sairaala' | 'sote' | 'ta' | 'piste';

export interface Category {
  id: CategoryId;
  name: string;
  /** Plural, used for grouping in selects. */
  plural: string;
  fill: string;
  border: string;
  radius: string;
  size: number;
}

export const CATEGORIES: Category[] = [
  { id: 'sairaala', name: 'Sairaala', plural: 'Sairaala', fill: '#B42318', border: '2px solid #FFFFFF', radius: '4px', size: 20 },
  { id: 'sote', name: 'Sote-keskus', plural: 'Sote-keskukset', fill: '#1D4E89', border: '2px solid #FFFFFF', radius: '50%', size: 18 },
  { id: 'ta', name: 'Terveysasema', plural: 'Terveysasemat', fill: '#D9772B', border: '2px solid #FFFFFF', radius: '50%', size: 15 },
  { id: 'piste', name: 'Sote-piste', plural: 'Sote-pisteet', fill: '#FFFFFF', border: '2.5px solid #1C2925', radius: '50%', size: 12 },
];

export const CATEGORY_BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c])) as Record<CategoryId, Category>;

/** Draw order: smaller markers underneath. */
export const CATEGORY_Z: Record<CategoryId, number> = { piste: 0, ta: 1, sote: 2, sairaala: 3 };

export type LocationMethod = 'laitos' | 'osoite' | 'taajama';

export interface ServicePoint {
  id: string;
  cat: CategoryId;
  name: string;
  kunta: string;
  addr?: string;
  note: string;
  x: number;
  y: number;
  method: LocationMethod;
  /** Driving time in seconds from each municipality centre, in `DRIVE_ORIGINS` order. */
  dur: number[];
  /** Driving distance in metres, same order. */
  dist: number[];
}

type RawPoint = Omit<ServicePoint, 'cat' | 'method' | 'addr'> & { cat: string; method: string; addr?: string | null };

/** Generated from the project database by `npm run data -- export`. */
export const SERVICE_POINTS: ServicePoint[] = (ajomatkat.points as RawPoint[]).map((p) => ({
  ...p,
  cat: p.cat as CategoryId,
  method: p.method as LocationMethod,
  addr: p.addr ?? undefined,
}));

/** Origins of the drive-time matrix (municipality keys + names). */
export const DRIVE_ORIGINS: { key: string; name: string }[] = ajomatkat.kunnat;
