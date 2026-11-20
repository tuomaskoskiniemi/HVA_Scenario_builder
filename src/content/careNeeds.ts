/**
 * Example list of 20 common health-care needs and which kinds of service point offer them.
 *
 * ASSUMPTION: the data has each point's type, not its exact service catalogue. The mapping
 * below follows the type descriptions in the data (sote-piste: nurse visits, lab samples,
 * prescriptions; terveysasema: doctor and nurse visits; sote-keskus: also social services;
 * keskussairaala: specialist care and the region's 24/7 joint emergency unit).
 * It must be checked against hyvaep.fi before the results are used for decisions.
 */
import type { CategoryId } from '../data/servicePoints';

export interface CareNeed {
  id: string;
  name: string;
  /** Plain-language examples of what the need covers; also used by the search. */
  examples: string;
  group: CareGroupId;
}

export type CareGroupId = 'lahi' | 'laakari' | 'sote' | 'sairaala';

export interface CareGroup {
  id: CareGroupId;
  name: string;
  /** Which point types offer the needs in this group. */
  categories: CategoryId[];
  basis: string;
}

export const CARE_GROUPS: CareGroup[] = [
  {
    id: 'lahi',
    name: 'Hoitajan vastaanotto ja lähipalvelut',
    categories: ['piste', 'ta', 'sote'],
    basis: 'Sote-pisteet, terveysasemat ja sote-keskukset: hoitajan vastaanotto, laboratorion näytteenotto ja reseptiasiat.',
  },
  {
    id: 'laakari',
    name: 'Lääkärin vastaanotto',
    categories: ['ta', 'sote'],
    basis: 'Terveysasemat ja sote-keskukset: lääkärin ja hoitajan vastaanotto.',
  },
  {
    id: 'sote',
    name: 'Sote-keskuksen palvelut',
    categories: ['sote'],
    basis: 'Sote-keskukset: vastaanottojen lisäksi sosiaalipalvelut sekä mielenterveys- ja päihdepalvelut.',
  },
  {
    id: 'sairaala',
    name: 'Päivystys ja erikoissairaanhoito',
    categories: ['sairaala'],
    basis: 'Seinäjoen keskussairaala: erikoissairaanhoito ja koko alueen ympärivuorokautinen yhteispäivystys.',
  },
];

export const CARE_GROUP_BY_ID = Object.fromEntries(CARE_GROUPS.map((g) => [g.id, g])) as Record<CareGroupId, CareGroup>;

export const CARE_NEEDS: CareNeed[] = [
  { id: 'laboratorio', name: 'Laboratorionäytteet', examples: 'verikokeet, virtsanäyte, INR-seuranta', group: 'lahi' },
  { id: 'resepti', name: 'Reseptin uusiminen', examples: 'pitkäaikaislääkkeet, reseptiasiat', group: 'lahi' },
  { id: 'rokotus', name: 'Rokotukset', examples: 'influenssa- ja koronarokotus, matkailijan rokotukset', group: 'lahi' },
  { id: 'verenpaine', name: 'Verenpaineen seuranta', examples: 'verenpaineen mittaus, kontrollikäynti', group: 'lahi' },
  { id: 'haava', name: 'Haavanhoito', examples: 'haavan puhdistus, ompeleiden poisto, sidosten vaihto', group: 'lahi' },
  { id: 'hengitystie', name: 'Hengitystieinfektio', examples: 'pitkittynyt yskä, kuume, kurkkukipu, poskiontelotulehdus', group: 'laakari' },
  { id: 'selka', name: 'Selkä- ja niskakivut', examples: 'tuki- ja liikuntaelinvaivat, nivelkivut', group: 'laakari' },
  { id: 'virtsatie', name: 'Virtsatieinfektio', examples: 'virtsatietulehdus, kirvely', group: 'laakari' },
  { id: 'iho', name: 'Ihottumat ja iho-ongelmat', examples: 'ihottuma, luomen tarkastus, akne', group: 'laakari' },
  { id: 'korva', name: 'Korvatulehdus', examples: 'lapsen korvakipu, välikorvantulehdus', group: 'laakari' },
  { id: 'diabetes', name: 'Diabeteksen hoito', examples: 'diabeteksen seuranta- ja hoitokäynnit', group: 'laakari' },
  { id: 'astma', name: 'Astma ja keuhkoahtaumatauti', examples: 'astman ja COPD:n seuranta, inhalaatiohoito', group: 'laakari' },
  { id: 'neuvola', name: 'Äitiys- ja lastenneuvola', examples: 'raskauden seuranta, lapsen määräaikaistarkastukset', group: 'laakari' },
  { id: 'akillinen', name: 'Äkillinen sairastuminen virka-aikana', examples: 'kiireellinen hoito arkipäivisin, tapaturmat', group: 'laakari' },
  { id: 'mielenterveys', name: 'Masennus ja ahdistus', examples: 'mielenterveyden vastaanotto, terapiaohjaus', group: 'sote' },
  { id: 'paihde', name: 'Päihdeongelmat', examples: 'päihdepalvelut, alkoholi, riippuvuudet', group: 'sote' },
  { id: 'muisti', name: 'Muistihuolet', examples: 'muistihäiriöiden arvio ja muistihoitaja', group: 'sote' },
  { id: 'ikaihmiset', name: 'Ikäihmisten palveluohjaus', examples: 'kotihoito, omaishoito, palvelutarpeen arvio', group: 'sote' },
  { id: 'paivystys', name: 'Päivystys iltaisin, öisin ja viikonloppuisin', examples: 'yhteispäivystys, kiireellinen hoito virka-ajan ulkopuolella', group: 'sairaala' },
  { id: 'erikois', name: 'Erikoislääkärin vastaanotto', examples: 'lähete erikoissairaanhoitoon, poliklinikat, kuvantaminen', group: 'sairaala' },
];
