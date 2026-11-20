import { Link } from 'react-router-dom';
import kuntakortit from '../data/kuntakortit.json';

interface Row {
  label: string;
  v: string;
  a: string;
  m: string;
}
const CARDS = kuntakortit.data as Record<string, { title: string; rows: Row[] }[]>;

/** Key population and wellbeing figures shown for a municipality, by their row label in the municipality card data. */
const PICK: { label: string; short: string }[] = [
  { label: 'Väkiluku', short: 'Väkiluku 31.12.2025' },
  { label: 'Alle 18-vuotiaat', short: 'Alle 18-vuotiaat' },
  { label: '65 vuotta täyttäneet', short: '65 vuotta täyttäneet' },
  { label: 'Työttömyysaste, 18–64 v.', short: 'Työttömyysaste 2024' },
  { label: 'Mediaanitulo, € / kulutusyksikkö', short: 'Mediaanitulo 2024' },
  { label: 'Pienituloisuusaste', short: 'Pienituloisuusaste 2024' },
  { label: 'Sairastavuusindeksi', short: 'Sairastavuusindeksi' },
  { label: 'Työkyvyttömyysindeksi', short: 'Työkyvyttömyysindeksi' },
];

/** Compact population and wellbeing summary of one municipality, compared with the region. */
export function MunicipalitySummary({ name }: { name: string }) {
  const groups = CARDS[name];
  if (!groups) return null;
  const rows = groups.flatMap((g) => g.rows);
  const pick = PICK.map((p) => ({ ...p, row: rows.find((r) => r.label === p.label) })).filter((p) => p.row);

  return (
    <section className="muni-summary" aria-label={`${name}: väestö ja hyvinvointi`}>
      <div className="muni-summary__head">
        <h3>{name}: väestö ja hyvinvointi</h3>
        <Link to="/kuntakortit" className="help__more">
          Koko kuntakortti →
        </Link>
      </div>
      <table className="muni-summary__table">
        <thead>
          <tr>
            <th scope="col">Tunnusluku</th>
            <th scope="col">{name}</th>
            <th scope="col">Alue</th>
          </tr>
        </thead>
        <tbody>
          {pick.map((p) => (
            <tr key={p.label}>
              <th scope="row">{p.short}</th>
              <td>{p.row!.v}</td>
              <td>{p.row!.a}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="small-print" style={{ lineHeight: 1.45 }}>
        Alue = 18 kunnan hyvinvointialue; työttömyys ja tulot Etelä-Pohjanmaan maakunta. Indeksit: koko maa = 100. Lähteet: Tilastokeskus ja THL Sotkanet.
      </p>
    </section>
  );
}
