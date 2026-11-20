import { VIEW_BY_ID } from '../content/help';
import { DataTable, type TableData } from '../components/DataTable';
import { CompareBars, PageHeader, SectionTitle, StatTile } from '../components/ui';
import { byRank } from '../data/municipalities';
import tablesJson from '../data/vaestotiedot-tables.json';
import { fmt } from '../lib/format';

const [popTable, incomeTable, healthTable] = tablesJson as TableData[];

const TILES = [
  { label: 'Väkiluku', value: '189 474', sub: '18 kunnan väkiluku yhteensä, 31.12.2025' },
  { label: '65 vuotta täyttäneet', value: '27,7 %', sub: 'koko maa 23,8 % · 2025' },
  { label: 'Työttömyysaste', value: '8,2 %', sub: '7 093 työtöntä · elokuu 2026' },
  { label: 'Korkea-asteen tutkinto', value: '27,5 %', sub: 'koko maa 34,1 % · 15 v. täyttäneet, 2024' },
  { label: 'Sairastavuusindeksi', value: '106,3', sub: 'koko maa 100 · ikävakioitu' },
];

const THEMES = [
  {
    title: 'Ikärakenne',
    caption: '65 vuotta täyttäneiden osuus, 2025',
    region: ['27,7 %', 100],
    country: ['23,8 %', 85.9],
    points: [
      '65 vuotta täyttäneitä on 52 541 (18 kuntaa, 31.12.2025).',
      'Väestöllinen huoltosuhde on 74,3: sataa työikäistä kohden on 74 lasta tai eläkeikäistä (2025).',
      'Työikäisiä on suhteessa vähemmän kuin koko maassa.',
    ],
  },
  {
    title: 'Työllisyys',
    caption: 'Työllisyysaste, työvoimatutkimus 2023',
    region: ['75,9 %', 100],
    country: ['73,6 %', 97.0],
    points: [
      'Elokuun 2026 lopussa työttömiä työnhakijoita oli 7 093, eli 950 vähemmän kuin heinäkuussa.',
      'Työttömyysaste oli kesäkuussa 8,9 % ja elokuussa 8,2 % (työnvälitystilasto).',
      'Kesällä 2026 työttömyys kasvoi kaikissa ikäryhmissä.',
    ],
  },
  {
    title: 'Koulutus',
    caption: 'Korkea-asteen tutkinto, 25–34-vuotiaat, 2024',
    region: ['30,7 %', 78.7],
    country: ['39 %', 100],
    points: [
      'Korkea-asteen tutkinnon suorittaneiden osuus on maakuntien toiseksi matalin, mutta se nousi 23,8 %:sta 27,5 %:iin vuosina 2014–2024.',
      'Kuntien välillä on suuret erot: Seinäjoella osuus on 34,7 % ja Karijoella 14,6 %.',
      'Eroa selittää etenkin nuorten aikuisten poismuutto.',
    ],
  },
  {
    title: 'Hyvinvointi ja terveys',
    caption: 'THL:n ikävakioitu sairastavuusindeksi',
    region: ['106,3', 100],
    country: ['100', 94.1],
    points: [
      'Alueen diabetesindeksi on maan korkein, ja se on yhä nousussa.',
      'Elintapasairaudet, kuten tyypin 2 diabetes ja lihavuus, ovat selvästi yleisempiä kuin muualla maassa.',
      'Monen sairausryhmän tilanne on parantunut vuodesta 2019, mutta työkyvyttömyysindeksi on kehittynyt huolestuttavasti.',
    ],
  },
] as const;

export function Vaestotiedot() {
  const maxPop = byRank[0].pop;

  return (
    <div className="page page--stack" style={{ gap: 40, padding: 56 }}>
      <PageHeader
          help={VIEW_BY_ID.vaesto}
        as="header"
        eyebrow="Etelä-Pohjanmaan hyvinvointialue · 18 kuntaa"
        title="Väestö ja hyvinvointi – yhteenveto"
        titleSize={48}
        lead="Alue ikääntyy koko maata nopeammin ja väestö keskittyy Seinäjoelle. Työllisyys on maan keskitasoa parempi, mutta koulutustaso on matalampi ja sairastavuus yleisempää kuin Suomessa keskimäärin."
      />

      <section aria-label="Tunnusluvut" className="tile-grid">
        {TILES.map((t) => (
          <StatTile key={t.label} {...t} />
        ))}
      </section>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 40, alignItems: 'flex-start' }}>
        <section className="section" style={{ flex: '1 1 480px', maxWidth: 560, gap: 16 }}>
          <div className="ruled">
            <SectionTitle
              title="Väkiluku kunnittain"
              intro="Seinäjoella asuu noin 35 % alueen väestöstä. Kymmenen vuoden aikana väestö on kasvanut vain Seinäjoella ja Ilmajoella."
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, fontSize: 14 }}>
            {byRank.map((m) => {
              const hub = m.rank === 1;
              return (
                <div key={m.key} className="bar-row" style={{ gridTemplateColumns: '96px minmax(0, 1fr) 64px', gap: 12 }}>
                  <span style={{ fontWeight: hub ? 600 : undefined }}>{m.name}</span>
                  <span className="bar" style={{ height: 18, width: `${(m.pop / maxPop) * 100}%`, background: hub ? 'var(--accent)' : undefined }} />
                  <span className="num" style={{ textAlign: 'right', fontWeight: hub ? 600 : undefined }}>
                    {fmt(m.pop)}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="small-print" style={{ lineHeight: 1.5 }}>
            Luvut 31.12.2025. Lähde: Tilastokeskus, StatFin-taulukko 11re.
          </p>
        </section>

        <div style={{ flex: '1 1 520px', minWidth: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px 28px' }}>
          {THEMES.map((t) => (
            <section key={t.title} className="section ruled">
              <h2 className="h2">{t.title}</h2>
              <CompareBars
                caption={t.caption}
                rows={[
                  { label: 'Etelä-Pohjanmaa', value: t.region[0], pct: t.region[1], primary: true },
                  { label: 'Koko maa', value: t.country[0], pct: t.country[1] },
                ]}
              />
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 15, lineHeight: 1.5, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {t.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>

      <section className="section ruled" style={{ gap: 16 }}>
        <SectionTitle
          size="lg"
          title="Kuntakohtainen taulukko"
          intro="Kunnat väkiluvun mukaan järjestettyinä. Väestö- ja ikäluvut ovat Tilastokeskuksen virallisia lukuja 31.12.2025, työllisyys- ja työttömyysaste sekä korkea-aste vuodelta 2024. Viiva (–) tarkoittaa, että lukua ei ole haettu."
        />
        <DataTable data={popTable} caption="Väestö, työllisyys ja koulutus kunnittain" />
        <p className="small-print">
          Väkiluku, osuus alueen väestöstä, alle 18-vuotiaat (0–17 v.), 0–6-vuotiaat ja 65 vuotta täyttäneiden osuus: Tilastokeskus, StatFin-taulukko 11re (Väestö iän ja sukupuolen mukaan alueittain), tilanne 31.12.2025, haettu 19.11.2026. Osuus alueen väestöstä on laskettu 18 kunnan yhteenlasketusta väkiluvusta. Työllisyysaste ja työttömyysaste 2024 (18–64-vuotiaat): Tilastokeskus, työssäkäyntitilasto, StatFin-taulukko 115x, haettu 19.11.2026. Korkea-aste 2024: Tilastokeskus, väestön koulutusrakenne, StatFin-taulukko 12bq, koulutusasteet 5–8 osuutena 15 vuotta täyttäneistä, haettu 19.11.2026. Syyskuun 2026 luku on työnvälitystilaston osuus työvoimasta, joten sarakkeet eivät ole keskenään vertailukelpoisia.
        </p>
      </section>

      <section className="section ruled" style={{ gap: 16 }}>
        <SectionTitle
          size="lg"
          title="Hyvinvoinnin tunnusluvut kunnittain"
          intro="Toimeentulo ja pienituloisuus vuonna 2024, kunnat väkiluvun mukaan järjestettyinä. Viiva (–) tarkoittaa, että Tilastokeskus ei julkaise lukua tietosuojan vuoksi."
        />
        <DataTable data={incomeTable} caption="Toimeentulo ja pienituloisuus kunnittain" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          <StatTile
            label="Vastasyntyneen elinajanodote 2023–2025, Etelä-Pohjanmaa"
            value="81,5 vuotta"
            valueSize={32}
            sub="miehet 79,2 · naiset 83,9 · koko maa 82,0 (miehet 79,5, naiset 84,6)"
          />
          <div className="card">
            <span className="label">Kuntatason terveysindikaattorit</span>
            <span style={{ fontSize: 14, lineHeight: 1.5 }}>
              THL:n sairastavuus-, diabetes-, mielenterveys- ja työkyvyttömyysindeksit sekä muut terveyden tunnusluvut kunnittain ovat alla olevassa taulukossa (THL, Sotkanet).
            </span>
          </div>
        </div>
        <p className="small-print">
          Lähteet: Tilastokeskus, tulonjakotilasto, StatFin-taulukko 14ww (asuntoväestö, tilanne 2024), ja kuolleet, StatFin-taulukko 12an (elinajanodote maakunnittain, 2023–2025). Haettu 19.11.2026. Pienituloisuusraja on 60 % koko maan käytettävissä olevien rahatulojen mediaanista kulutusyksikköä kohden. Pitkittyneesti pienituloinen on ollut pienituloinen kuluvana vuonna ja vähintään kahtena kolmesta edellisestä vuodesta. Perusturvan varassa olevien osuus on laskettu jakamalla kokonaan perusturvan varassa olevien asuntokuntien henkilöt asuntoväestöllä.
        </p>
      </section>

      <section className="section ruled" style={{ gap: 16 }}>
        <SectionTitle
          size="lg"
          title="Terveyden ja sosiaalisen hyvinvoinnin tunnusluvut kunnittain"
          intro="THL:n ikävakioidut indeksit (koko maa = 100) sekä Kelan ja THL:n tilastoihin perustuvat osuudet. Lihavoitu luku on kuntien korkein. Viiva (–) tarkoittaa, että lukua ei julkaista tietosuojan vuoksi."
        />
        <DataTable data={healthTable} caption="Terveyden ja sosiaalisen hyvinvoinnin tunnusluvut kunnittain" />
        <p className="small-print">
          Lähde: THL, Sotkanet (indikaattorit 5641, 5661, 5651, 5663, 306, 2345, 5, 191), haettu 19.11.2026. Indeksit: THL:n sairastavuusindeksi ja sen osaindeksit, ikävakioitu, koko maa = 100. Työkyvyttömyyseläke: työkyvyttömyyseläkettä saavat 25–64-vuotiaat, % vastaavan ikäisestä väestöstä. Sairauspäiväraha: mielenterveysperusteisesti sairauspäivärahaa saaneet 25–64-vuotiaat / 1 000 vastaavan ikäistä. Toimeentulotuki: toimeentulotukea saaneet 25–64-vuotiaat, % vastaavan ikäisestä väestöstä. Yhteenvetorivi on Etelä-Pohjanmaan hyvinvointialue (18 kuntaa).
        </p>
      </section>

      <footer className="small-print" style={{ borderTop: '1px solid var(--rule-strong)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <p style={{ margin: 0 }}>
          <strong style={{ color: 'var(--ink)' }}>Lähteet:</strong> Tilastokeskus (väkiluvut, koulutusrakenne), Etelä-Pohjanmaan liitto (ikärakenne, huoltosuhde, työvoimatutkimus, koulutus), KEHA-keskus / Etelä-Pohjanmaan elinvoimakeskus (työnvälitystilasto), Etelä-Pohjanmaan hyvinvointikertomus 2025 (THL:n indeksit).
        </p>
        <p style={{ margin: 0 }}>
          Maakuntatason luvut koskevat Etelä-Pohjanmaan maakuntaa (17 kuntaa). Hyvinvointialueeseen kuuluu lisäksi Isokyrö, joka on Pohjanmaan maakunnan kunta. Luvut on koottu hakutuloksista 11/2026, ja ne kannattaa tarkistaa alkuperäislähteistä ennen virallista käyttöä.
        </p>
      </footer>
    </div>
  );
}
