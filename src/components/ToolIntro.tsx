import { Link } from 'react-router-dom';

/** Short description of the tool, shown at the top of the start view. */
export function ToolIntro() {
  return (
    <section className="intro" aria-labelledby="intro-title">
      <div className="intro__inner">
        <div className="intro__text">
          <p className="eyebrow">Skenaariotyökalu</p>
          <h2 id="intro-title" className="intro__title">
            Tietopohja hyvinvointialueen palveluiden suunnitteluun
          </h2>
          <p className="intro__lead">
            Työkalu kokoaa Etelä-Pohjanmaan hyvinvointialueen 18 kunnan väestö-, hyvinvointi- ja palveluverkkotiedot yhteen
            näkymään. Sillä voi verrata kuntia, tarkastella väestön kehitystä vuoteen 2045 ja arvioida, kuinka kaukana palvelut
            ovat asukkaista. Se on tarkoitettu palveluverkon suunnittelun, valmistelun ja keskustelun tueksi.
          </p>
        </div>
        <div className="intro__actions">
          <Link to="/tietoa" className="btn btn--solid intro__btn">
            Tutustu työkaluun
          </Link>
          <Link to="/tietoa" state={{ section: 'kayttoohje' }} className="btn intro__btn">
            Käyttöohje
          </Link>
        </div>
      </div>
    </section>
  );
}
