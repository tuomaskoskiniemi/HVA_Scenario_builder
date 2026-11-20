/** Käyttöohjeet ja esittelytekstit. Näkymäkohtaiset ohjeet näkyvät kunkin näkymän Ohje-painikkeen takana. */

export type ViewId = 'kunnat' | 'palvelupisteet' | 'vaesto' | 'kuntakortit' | 'ennuste' | 'ajomatkat' | 'muutokset' | 'hoito';

export interface ViewInfo {
  id: ViewId;
  path: string;
  title: string;
  /** Mitä näkymä kertoo, yksi lause esittelysivulle. */
  purpose: string;
  /** Mitä näkymässä voi tehdä. */
  features: string[];
  /** Ohje-paneelin vaiheet. */
  steps: string[];
  /** Mitä tulkinnassa kannattaa huomata. */
  note?: string;
}

export const VIEWS: ViewInfo[] = [
  {
    id: 'kunnat',
    path: '/',
    title: 'Kunnat',
    purpose: 'Yleiskuva hyvinvointialueen 18 kunnasta ja niiden asukasluvuista.',
    features: ['Kaavamainen kartta, jossa kunnat on numeroitu asukasluvun mukaan', 'Kuntaluettelo asukaslukuineen (31.12.2025)'],
    steps: [
      'Kartan numero kertoo kunnan sijan asukasluvun mukaan: 1 on suurin, 18 pienin.',
      'Oikean reunan luettelossa on sama järjestys ja tarkat asukasluvut.',
      'Valitse yläpalkista muu näkymä, kun haluat tarkastella palveluita, väestöä tai ennustetta.',
    ],
    note: 'Kartta on kaavamainen: kuntien sijainnit ovat oikeat, mutta rajat on yksinkertaistettu.',
  },
  {
    id: 'palvelupisteet',
    path: '/palvelupisteet',
    title: 'Palvelupisteet',
    purpose: 'Alueen sairaala, sote-keskukset, terveysasemat ja sote-pisteet kartalla.',
    features: ['Palvelutyyppien suodatus', 'Pisteen tiedot klikkaamalla: kunta, osoite ja kuvaus sekä kunnan väestö- ja hyvinvointitiedot', 'Kuntien nimien näyttö tai piilotus'],
    steps: [
      'Valitse palvelutyyppipainikkeista, mitkä pisteet näkyvät kartalla. Painike toimii päälle–pois-kytkimenä.',
      'Klikkaa karttapistettä, niin sen tiedot avautuvat oikealle. Samassa paneelissa näkyvät pisteen kunnan väestö- ja hyvinvointitiedot alueen lukuihin verrattuna.',
      'Piilota kuntien nimet, jos haluat nähdä pisteet selkeämmin.',
      'Tyhjennä valinta palauttaa näkymän alkutilaan.',
    ],
    note: 'Toimipisteverkko muuttuu. Tarkista ajantasaiset palvelut ja aukioloajat osoitteesta hyvaep.fi.',
  },
  {
    id: 'vaesto',
    path: '/vaesto',
    title: 'Väestö ja hyvinvointi',
    purpose: 'Koko alueen tunnusluvut ja kuntakohtaiset taulukot väestöstä, toimeentulosta ja terveydestä.',
    features: [
      'Tunnuslukukortit: väkiluku, ikääntyneiden osuus, työttömyys, koulutus, sairastavuus',
      'Alueen ja koko maan vertailu teemoittain',
      'Kolme kuntataulukkoa: väestö ja työ, toimeentulo, terveys ja sosiaalinen hyvinvointi',
    ],
    steps: [
      'Aloita sivun yläosan tunnusluvuista: ne kertovat alueen tilanteen koko maahan verrattuna.',
      'Teemakohtaiset palkit vertaavat Etelä-Pohjanmaata (vihreä) koko maahan (harmaa).',
      'Taulukoissa kunnat ovat väkiluvun mukaisessa järjestyksessä. Lihavoitu luku on sarakkeen huomionarvoisin.',
      'Kapealla näytöllä taulukkoa voi vierittää sivusuunnassa.',
    ],
    note: 'Viiva (–) tarkoittaa, ettei lukua julkaista tietosuojan vuoksi tai sitä ei ole haettu. Osa luvuista koskee maakuntaa (17 kuntaa, ilman Isokyröä); taulukon alaviite kertoo, mitkä.',
  },
  {
    id: 'kuntakortit',
    path: '/kuntakortit',
    title: 'Kuntakortit',
    purpose: 'Yhden tai useamman kunnan tunnusluvut rinnakkain alueen ja koko maan kanssa.',
    features: ['Kuntien valinta kartalta', 'Useiden kuntien yhdistetyt luvut', 'Vertailu alueeseen ja koko maahan'],
    steps: [
      'Klikkaa kunnan nimeä kartalla. Kortti avautuu oikealle.',
      'Klikkaa muita kuntia lisätäksesi ne valintaan. Uusi klikkaus poistaa kunnan valinnasta.',
      'Kun valittuna on useita kuntia, lukumäärät lasketaan yhteen ja osuudet painotetaan väestöllä.',
      'Tyhjennä valinta aloittaa alusta.',
    ],
    note: '≈ tarkoittaa likiarvoa ja * sitä, että luku on laskettu vain kunnista, joilta se on julkaistu.',
  },
  {
    id: 'ennuste',
    path: '/ennuste',
    title: 'Väestöennuste',
    purpose: 'Skenaario-osa: miltä väestö ja sen ikärakenne näyttävät vuosina 2024–2045, jos nykyinen kehitys jatkuu.',
    features: [
      'Alueen valinta: koko hyvinvointialue, yksittäinen kunta tai koko maa',
      'Vuoden valinta liukusäätimellä tai kaaviosta, sekä automaattinen toisto',
      'Ikäryhmien muutos valittuna vuonna verrattuna vuoteen 2024',
      'Kuntien vertailu väkiluvun muutoksen mukaan',
    ],
    steps: [
      'Valitse alue pudotusvalikosta.',
      'Siirrä vuosi-liukusäädintä tai klikkaa vuotta viivakaaviossa. Kaikki luvut päivittyvät valitulle vuodelle.',
      'Toista 2024–2045 näyttää kehityksen vuosi kerrallaan. Pysäytä keskeyttää toiston.',
      'Klikkaa kuntaa alimmassa vertailussa, niin siitä tulee valittu alue.',
    ],
    note: 'Ennuste on Tilastokeskuksen trendilaskelma: se olettaa syntyvyyden, kuolevuuden ja muuttoliikkeen jatkuvan viime vuosien kaltaisina, eikä se huomioi päätösten vaikutuksia.',
  },
  {
    id: 'ajomatkat',
    path: '/ajomatkat',
    title: 'Ajomatkat',
    purpose: 'Arvioitu ajoaika ja matka kunkin kunnan keskustasta valittuun palvelupisteeseen.',
    features: ['Palvelupisteen valinta', 'Kunnat väritettynä ajoajan mukaan (alle 30, 30–60, yli 60 min)', 'Pisin ajoaika, mediaani ja yli tunnin päässä olevat kunnat'],
    steps: [
      'Valitse palvelupiste pudotusvalikosta. Pisteet on ryhmitelty tyypin mukaan.',
      'Kartan värit ja luvut näyttävät ajoajan kunnan keskustaajamasta valittuun pisteeseen.',
      'Oikean reunan kaavio järjestää kunnat lyhimmästä pisimpään ajoaikaan.',
    ],
    note: 'Ajoajat ovat OSRM-reitittimen arvioita henkilöautolle ilman ruuhkia. Todellinen aika vaihtelee kelin ja liikenteen mukaan.',
  },
  {
    id: 'muutokset',
    path: '/muutokset',
    title: 'Palveluverkon muutokset',
    purpose: 'Skenaario-osa: miten matkat lähimpään palveluun muuttuvat, jos palvelupiste suljetaan tai kevennetään sote-pisteeksi.',
    features: [
      'Pisteen sulkeminen tai keventäminen kartalta tai luettelosta',
      'Kolme palvelutasoa: sote-keskustaso, lääkärin vastaanotto, mikä tahansa lähipalvelu',
      'Vaikutus asukasmäärällä painotettuna, myös vain 65 vuotta täyttäneille',
      'Kuntakohtainen vertailu: lähin piste ja ajoaika nyt ja muutosten jälkeen',
    ],
    steps: [
      'Valitse ensin tarkasteltava palvelu: esimerkiksi lääkärin vastaanotto, jos arvioit terveysaseman keventämistä. Näkymä avautuu ilman valintaa.',
      'Klikkaa pistettä kartalla tai luettelossa ja valitse sen tila: nykyinen, kevennetty tai suljettu. Muutoksia voi tehdä useita.',
      'Kartta värittyy heti sen mukaan, kuinka paljon matka pitenee. Ennen palvelun valintaa se näyttää suurimman pitenemisen millä tahansa palvelutasolla; valitun palvelun kanssa tunnusluvut näyttävät tilanteen nyt → muutosten jälkeen.',
      'Kunnittainen taulukko kertoo, mihin pisteeseen kunnan asukkaiden lähin palvelu siirtyy.',
      'Näkymä avautuu nykytilassa ilman muutoksia. Palauta nykytila poistaa kaikki tekemäsi muutokset.',
    ],
    note: 'Ajoajat lasketaan kuntakeskuksista, joten kyläkeskusten pisteiden (esim. Jalasjärvi, Jurva, Lehtimäki) muutokset eivät näy luvuissa. Tulos on suuntaa antava: se ei huomioi joukkoliikennettä, kapasiteettia eikä digi- tai liikkuvia palveluita.',
  },
  {
    id: 'hoito',
    path: '/hoito',
    title: 'Hoidon haku',
    purpose: 'Missä on lähin paikka, josta saa tiettyä hoitoa, ja kuinka kauan sinne ajaa.',
    features: [
      '20 esimerkkiä tavallisista hoitotarpeista neljässä ryhmässä, haku nimellä tai esimerkeillä',
      'Lähin hoitopaikka, ajoaika ja matka valitusta kunnasta sekä seuraavaksi lähimmät',
      'Kartta ja taulukko: lähin hoitopaikka jokaisesta kunnasta',
    ],
    steps: [
      'Valitse lähtökunta pudotusvalikosta.',
      'Valitse hoitotarve listasta tai kirjoita hakuun sana, esimerkiksi “verikokeet” tai “päivystys”.',
      'Vastauskortti näyttää lähimmän hoitopaikan, ajoajan ja matkan sekä kolme seuraavaksi lähintä vaihtoehtoa.',
      'Kartta ja taulukko näyttävät saman hoidon lähimmän paikan jokaisesta kunnasta. Klikkaa kunnan nimeä taulukossa, niin siitä tulee lähtökunta.',
    ],
    note: 'Hoitotarpeet on kytketty palvelupisteen tyyppiin, ei pisteen tarkkaan palveluvalikoimaan, ja lista on esimerkki. Tarkista palvelut ja aukioloajat osoitteesta hyvaep.fi.',
  },
];

export const VIEW_BY_ID = Object.fromEntries(VIEWS.map((v) => [v.id, v])) as Record<ViewId, ViewInfo>;
