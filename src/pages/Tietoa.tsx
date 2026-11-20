import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PageHeader, SectionTitle } from '../components/ui';
import { VIEWS } from '../content/help';

const WHY = [
  'Palveluverkon suunnittelu edellyttää samanaikaista tietoa väestön määrästä ja ikärakenteesta, hyvinvoinnista ja siitä, kuinka kaukana palvelut ovat.',
  'Tiedot ovat hajallaan eri lähteissä: Tilastokeskuksella, THL:llä ja karttapalveluissa. Työkalu tuo ne yhteen samalle aluejaolle ja samaan ajankohtaan.',
  'Alue ikääntyy koko maata nopeammin ja väestö keskittyy Seinäjoelle. Muutoksen suunta ja nopeus vaihtelevat kunnittain, mikä tekee kuntatason tarkastelusta tarpeellista.',
];

const USES = [
  { title: 'Palveluverkon suunnittelu', text: 'Saavutettavuus ajoaikoina ja skenaariot, joissa toimipiste suljetaan tai kevennetään.' },
  { title: 'Palvelutarpeen ennakointi', text: 'Ikääntyneiden ja lasten määrän kehitys kunnittain vuoteen 2045.' },
  { title: 'Kuntakohtainen tilannekuva', text: 'Kunnan tai kuntaryhmän luvut rinnakkain alueen ja koko maan kanssa.' },
  { title: 'Valmistelu ja viestintä', text: 'Taustatiedot esityksiin, kuntakeskusteluihin ja päätösvalmisteluun.' },
];

const GUIDE = [
  { title: 'Valitse näkymä', text: 'Yläpalkista vaihdat näkymää. Jokaisella näkymällä on oma linkkinsä, jonka voit kopioida ja jakaa.' },
  { title: 'Avaa näkymän ohje', text: 'Otsikon alla oleva Ohje-painike kertoo, miten juuri sitä näkymää käytetään ja mitä lukujen tulkinnassa kannattaa huomata.' },
  { title: 'Valitse ja vertaa', text: 'Klikkaa kuntia ja palvelupisteitä kartalla tai valitse ne pudotusvalikoista. Valinnat päivittävät luvut ja kaaviot heti.' },
  { title: 'Tarkastele tulevaisuutta', text: 'Väestöennusteessa valitse alue ja vuosi liukusäätimellä tai toista koko jakso 2024–2045.' },
  { title: 'Tarkista lähde', text: 'Jokaisen näkymän alalaidassa kerrotaan lähteet, tilastovuosi ja rajoitukset. Tarkista luvut alkuperäislähteestä ennen virallista käyttöä.' },
];

const LIMITS = [
  'Luvut on koottu 11/2026. Väestö on 31.12.2025 tilanteen mukainen, työ-, koulutus- ja tulotiedot vuodelta 2024.',
  'Väestöennuste on trendilaskelma: se kuvaa kehitystä, jos syntyvyys, kuolevuus ja muuttoliike jatkuvat ennallaan, eikä se huomioi päätösten vaikutuksia.',
  'Ajoajat ovat reititysohjelman arvioita ilman ruuhkia, eivät mitattuja matka-aikoja.',
  'Kartat ovat kaavamaisia: sijainnit ovat oikeat, mutta rajat on yksinkertaistettu.',
  'Osa luvuista koskee Etelä-Pohjanmaan maakuntaa (17 kuntaa, ilman Isokyröä). Tämä kerrotaan kyseisten lukujen kohdalla.',
];

export function Tietoa() {
  const location = useLocation();
  const section = (location.state as { section?: string } | null)?.section;
  useEffect(() => {
    if (section) document.getElementById(section)?.scrollIntoView({ block: 'start' });
  }, [section]);

  return (
    <div className="page page--stack about">
      <PageHeader
        as="header"
        eyebrow="Etelä-Pohjanmaan hyvinvointialue · Skenaariotyökalu"
        title="Tietoa työkalusta"
        lead="Skenaariotyökalu kokoaa hyvinvointialueen 18 kunnan väestö-, hyvinvointi- ja palveluverkkotiedot yhteen. Tältä sivulta löydät työkalun tarkoituksen, sisällön ja lyhyen käyttöohjeen."
      />

      <div className="about__two">
        <section className="section ruled">
          <SectionTitle title="Miksi työkalu on olemassa" />
          <ul className="about__list">
            {WHY.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>
        <section className="section ruled">
          <SectionTitle title="Mihin sitä voi käyttää" />
          <dl className="about__uses">
            {USES.map((u) => (
              <div key={u.title}>
                <dt>{u.title}</dt>
                <dd>{u.text}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <section className="section ruled" aria-labelledby="sisalto">
        <div className="section__intro">
          <h2 id="sisalto" className="h2 h2--lg">
            Sisältö ja toiminnot
          </h2>
          <p>Työkalussa on kahdeksan näkymää. Palveluverkon muutokset on skenaariotyökalu palvelupisteiden sulkemisen tai keventämisen arviointiin, ja Hoidon haku kertoo lähimmän hoitopaikan hoitotarpeittain.</p>
        </div>
        <div className="about__views">
          {VIEWS.map((v) => (
            <article key={v.id} className="card about__view">
              <h3 className="about__view-title">{v.title}</h3>
              <p className="about__view-purpose">{v.purpose}</p>
              <ul className="about__features">
                {v.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <Link to={v.path} className="about__open">
                Avaa näkymä <span aria-hidden="true">→</span>
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="section ruled" aria-labelledby="kayttoohje" style={{ scrollMarginTop: 80 }} id="kayttoohje">
        <div className="section__intro">
          <h2 className="h2 h2--lg">Käyttöohje</h2>
          <p>Viisi vaihetta. Tarkemmat ohjeet löytyvät kunkin näkymän Ohje-painikkeesta.</p>
        </div>
        <ol className="about__guide">
          {GUIDE.map((g) => (
            <li key={g.title}>
              <strong>{g.title}</strong>
              <span>{g.text}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="section ruled">
        <SectionTitle title="Tiedot ja rajoitukset" />
        <ul className="about__list">
          {LIMITS.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        <p className="small-print">
          Lähteet: Tilastokeskus (StatFin), THL (Sotkanet), OSRM ja OpenStreetMap. Palvelupisteet koottu julkisista lähteistä; ajantasaiset
          tiedot osoitteesta <a href="https://www.hyvaep.fi">hyvaep.fi</a>.
        </p>
      </section>
    </div>
  );
}
