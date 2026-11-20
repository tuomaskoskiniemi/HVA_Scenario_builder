/**
 * The 18 municipalities of the wellbeing services county, with the schematic
 * map geometry (800 × 920 viewBox) shared by every map view.
 */

/** Base fill tone (0 = lightest … 3 = darkest), keeps neighbours distinguishable. */
export type Tone = 0 | 1 | 2 | 3;

export interface Municipality {
  key: string;
  name: string;
  /** Population 31.12.2025 (Tilastokeskus 11re). */
  pop: number;
  /** Rank by population, 1 = largest. */
  rank: number;
  tone: Tone;
  /** SVG path in the 800 × 920 map viewBox. */
  d: string;
  /** Marker / label anchor on the map. */
  x: number;
  y: number;
}

export const MUNICIPALITIES: Municipality[] = [
  { key: 'ahtari', name: 'Ähtäri', pop: 5121, rank: 9, tone: 1, x: 670, y: 562, d: 'M761,504L756,550L720,644L649,654L601,672L601,496L611,483Z' },
  { key: 'soini', name: 'Soini', pop: 1772, rank: 16, tone: 2, x: 690, y: 410, d: 'M699,304L743,342L767,446L760,504L611,483L602,439L682,313Z' },
  { key: 'alajarvi', name: 'Alajärvi', pop: 8982, rank: 8, tone: 1, x: 583, y: 349, d: 'M682,313L602,439L495,353L492,316L559,288Z' },
  { key: 'lappajarvi', name: 'Lappajärvi', pop: 2704, rank: 13, tone: 0, x: 530, y: 224, d: 'M602,151L559,288L492,316L486,309L459,206Z' },
  { key: 'vimpeli', name: 'Vimpeli', pop: 2554, rank: 14, tone: 3, x: 624, y: 236, d: 'M606,147L636,186L672,280L699,304L682,313L559,288L602,151Z' },
  { key: 'evijarvi', name: 'Evijärvi', pop: 2267, rank: 15, tone: 2, x: 495, y: 125, d: 'M382,142L410,124L458,72L529,56L589,124L606,147L602,151L459,206Z' },
  { key: 'kauhava', name: 'Kauhava', pop: 14909, rank: 3, tone: 1, x: 390, y: 236, d: 'M287,240L292,238L339,171L382,142L459,206L486,309L322,313Z' },
  { key: 'lapua', name: 'Lapua', pop: 13927, rank: 4, tone: 2, x: 410, y: 343, d: 'M432,427L316,377L322,313L486,309L492,316L495,353Z' },
  { key: 'kuortane', name: 'Kuortane', pop: 3306, rank: 12, tone: 0, x: 518, y: 444, d: 'M611,483L601,496L436,526L432,427L495,353L602,439Z' },
  { key: 'alavus', name: 'Alavus', pop: 10634, rank: 7, tone: 3, x: 501, y: 594, d: 'M601,672L577,680L505,654L434,706L398,719L398,577L436,526L601,496Z' },
  { key: 'isokyro', name: 'Isokyrö', pop: 4261, rank: 11, tone: 0, x: 236, y: 335, d: 'M156,462L173,405L161,316L208,264L287,240L322,313L316,377L296,400Z' },
  { key: 'ilmajoki', name: 'Ilmajoki', pop: 12405, rank: 6, tone: 3, x: 262, y: 475, d: 'M154,469L156,462L296,400L377,560L170,492Z' },
  { key: 'kurikka', name: 'Kurikka', pop: 19441, rank: 2, tone: 2, x: 304, y: 594, d: 'M170,492L377,560L398,577L398,719L373,729L187,576Z' },
  { key: 'kauhajoki', name: 'Kauhajoki', pop: 12429, rank: 5, tone: 1, x: 240, y: 672, d: 'M187,576L373,729L363,732L303,732L286,758L169,723L141,664Z' },
  { key: 'teuva', name: 'Teuva', pop: 4574, rank: 10, tone: 0, x: 116, y: 574, d: 'M56,648L54,628L89,540L149,488L154,469L170,492L187,576L141,664Z' },
  { key: 'karijoki', name: 'Karijoki', pop: 1134, rank: 18, tone: 2, x: 107, y: 702, d: 'M66,732L56,648L141,664L169,723L78,788Z' },
  { key: 'isojoki', name: 'Isojoki', pop: 1771, rank: 17, tone: 0, x: 175, y: 796, d: 'M169,723L286,758L268,784L220,862L149,888L89,836L78,788Z' },
  { key: 'seinajoki', name: 'Seinäjoki', pop: 67283, rank: 1, tone: 3, x: 372, y: 462, d: 'M296,400L316,377L432,427L436,526L398,577L377,560Z' },
];

export const REGION_OUTLINE =
  'M66,732L56,648L54,628L89,540L149,488L156,462L173,405L161,316L208,264L287,240L292,238L339,171L382,142L410,124L458,72L529,56L589,124L606,147L636,186L672,280L699,304L743,342L767,446L760,504L756,550L720,644L649,654L601,672L577,680L505,654L434,706L398,719L373,729L363,732L303,732L286,758L268,784L220,862L149,888L89,836L78,788Z';

/** Map fill palettes by tone. `strong` for overview maps, `soft` under markers. */
export const TONE_FILLS: Record<'strong' | 'soft', [string, string, string, string]> = {
  strong: ['#E2E9DC', '#CFE2D6', '#B7D4C6', '#A3C7B5'],
  soft: ['#E5EBE0', '#D6E5DB', '#C3DACD', '#B3D0C0'],
};

export const REGION_POPULATION = 189474;

export const byRank = [...MUNICIPALITIES].sort((a, b) => a.rank - b.rank);
export const byName = [...MUNICIPALITIES].sort((a, b) => a.name.localeCompare(b.name, 'fi'));
