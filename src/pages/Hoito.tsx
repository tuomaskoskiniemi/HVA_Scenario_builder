import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { RegionMap, mapPos } from '../components/RegionMap';
import { CategorySwatch, PageHeader, SectionTitle } from '../components/ui';
import { CARE_GROUPS, CARE_GROUP_BY_ID, CARE_NEEDS } from '../content/careNeeds';
import { VIEW_BY_ID } from '../content/help';
import { MUNICIPALITIES } from '../data/municipalities';
import { CATEGORY_BY_ID, DRIVE_ORIGINS, SERVICE_POINTS } from '../data/servicePoints';
import { matchesQuery, optionsFor, type Option } from '../lib/care';
import { LABELS } from './Palvelupisteet';

/** Same drive-time bands as the Ajomatkat view: under 30, 30–60, over 60 min. */
const BAND_FILL = ['#BFDCCB', '#86B8A1', '#2E7864'];
const band = (min: number) => (min < 30 ? 0 : min <= 60 ? 1 : 2);
const LABEL_BY_NAME = Object.fromEntries(LABELS.map(([t, x, y]) => [t, [x, y] as const]));
const ORIGIN_INDEX = Object.fromEntries(DRIVE_ORIGINS.map((o, i) => [o.name, i]));
const byNameFi = [...DRIVE_ORIGINS].sort((a, b) => a.name.localeCompare(b.name, 'fi'));

const minText = (min: number) => (min < 1 ? 'alle 1 min' : `${min} min`);
const kmText = (km: number) => (km < 1 ? 'alle 1 km' : `${km} km`);

export function Hoito() {
  const [needId, setNeedId] = useState('hengitystie');
  const [origin, setOrigin] = useState('Soini');
  const [query, setQuery] = useState('');

  const need = CARE_NEEDS.find((n) => n.id === needId)!;
  const group = CARE_GROUP_BY_ID[need.group];
  const options = optionsFor(SERVICE_POINTS, need, ORIGIN_INDEX[origin]);
  const best = options[0];
  const others = options.slice(1, 4);

  // Nearest option for every municipality: map and table.
  const all = useMemo(
    () => DRIVE_ORIGINS.map((o, i) => ({ name: o.name, best: optionsFor(SERVICE_POINTS, need, i)[0] })),
    [need],
  );
  const byMuni = Object.fromEntries(all.map((r) => [r.name, r.best]));
  const sortedAll = [...all].sort((a, b) => a.best.dur - b.best.dur);
  const eligible = SERVICE_POINTS.filter((p) => group.categories.includes(p.cat));
  const shown = CARE_NEEDS.filter((n) => matchesQuery(n, query));
  const originMuni = MUNICIPALITIES.find((m) => m.name === origin)!;

  return (
    <div className="page page--stack" style={{ gap: 40 }}>
      <div className="page--split" style={{ display: 'flex', gap: 48 }}>
        <div className="page__map">
          <RegionMap
            ariaLabel={`Kaavamainen kartta: ajoaika jokaisesta kunnasta lähimpään pisteeseen, jossa on hoitoa: ${need.name.toLowerCase()}`}
            northArrow={{ x: 730, y: 820 }}
            fill={(m) => BAND_FILL[band(byMuni[m.name].min)]}
            svgChildren={
              <>
                <path d={originMuni.d} fill="none" stroke="var(--ink)" strokeWidth={4} strokeLinejoin="round" />
                <g fontSize={12} fontWeight={600} textAnchor="middle" letterSpacing="0.04em">
                  {MUNICIPALITIES.map((m) => {
                    const [x, y] = LABEL_BY_NAME[m.name.toUpperCase()];
                    const o = byMuni[m.name];
                    const dark = band(o.min) === 2;
                    return (
                      <g key={m.key}>
                        <text x={x} y={y} fill={dark ? '#FFFFFF' : '#1C2925'} fontWeight={m.name === origin ? 800 : 600}>
                          {m.name.toUpperCase()}
                        </text>
                        <text x={x} y={y + 16} fontSize={12} fontWeight={500} letterSpacing="0" fill={dark ? '#E3F0E9' : '#3F4C47'}>
                          {minText(o.min)}
                        </text>
                      </g>
                    );
                  })}
                </g>
                <g transform="translate(40,40)" fontSize={13} fill="var(--ink)">
                  <text fontWeight={600}>Ajoaika lähimpään hoitopaikkaan</text>
                  {['alle 30 min', '30–60 min', 'yli 60 min'].map((t, i) => (
                    <g key={t}>
                      <rect x={0} y={14 + i * 24} width={18} height={14} rx={3} fill={BAND_FILL[i]} />
                      <text x={26} y={25 + i * 24}>
                        {t}
                      </text>
                    </g>
                  ))}
                  <rect x={0} y={86} width={18} height={14} rx={3} fill="none" stroke="var(--ink)" strokeWidth={3} />
                  <text x={26} y={97}>
                    Valittu lähtökunta
                  </text>
                </g>
              </>
            }
          >
            {eligible.map((p) => {
              const isBest = p.id === best.point.id;
              return (
                <span
                  key={p.id}
                  className="map-hit"
                  title={p.name}
                  aria-hidden="true"
                  style={{ ...mapPos(p.x, p.y), width: 28, height: 28, cursor: 'default' }}
                >
                  <CategorySwatch cat={CATEGORY_BY_ID[p.cat]} maxSize={99} ring={isBest ? '0 0 0 3px var(--bg), 0 0 0 6px var(--ink)' : '0 1px 2px rgba(0,0,0,0.25)'} />
                </span>
              );
            })}
          </RegionMap>
        </div>

        <div className="page__aside" style={{ gap: 20, paddingTop: 8 }}>
          <PageHeader
            help={VIEW_BY_ID.hoito}
            eyebrow="Etelä-Pohjanmaan hyvinvointialue · Hoidon haku"
            title="Missä on lähin hoito?"
            titleSize={40}
            leadSize="sm"
            lead="Valitse hoitotarve ja kunta, josta lähdet. Näet lähimmän palvelupisteen, ajoajan ja matkan sekä seuraavaksi lähimmät vaihtoehdot."
          />

          <div className="care-controls">
            <label className="field label" htmlFor="care-origin">
              Lähtökunta
              <select id="care-origin" className="select" value={origin} onChange={(e) => setOrigin(e.target.value)}>
                {byNameFi.map((o) => (
                  <option key={o.key} value={o.name}>
                    {o.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field label" htmlFor="care-search">
              Hae hoitotarvetta
              <input
                id="care-search"
                className="select"
                type="search"
                placeholder="esim. verikokeet, neuvola, päivystys"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{ cursor: 'text' }}
              />
            </label>
          </div>

          <div className="care-needs" role="group" aria-label="Hoitotarpeet">
            {shown.length === 0 && <p className="small-print">Ei osumia haulla “{query}”. Kokeile toista sanaa tai tyhjennä haku.</p>}
            {CARE_GROUPS.map((g) => {
              const items = shown.filter((n) => n.group === g.id);
              if (!items.length) return null;
              return (
                <div key={g.id} className="care-group">
                  <p className="care-group__name">{g.name}</p>
                  <div className="care-chips">
                    {items.map((n) => (
                      <button key={n.id} type="button" className={n.id === needId ? 'care-chip on' : 'care-chip'} aria-pressed={n.id === needId} onClick={() => setNeedId(n.id)} title={n.examples}>
                        {n.name}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <article className="answer" aria-live="polite">
            <p className="answer__q">
              {need.name} · lähtökunta {origin}
            </p>
            <div className="answer__main">
              <span className="answer__min">{minText(best.min)}</span>
              <span className="answer__km">{kmText(best.km)}</span>
            </div>
            <div className="answer__point">
              <CategorySwatch cat={CATEGORY_BY_ID[best.point.cat]} />
              <div>
                <p className="answer__name">{best.point.name}</p>
                <p className="answer__meta">
                  {CATEGORY_BY_ID[best.point.cat].name} · {best.point.kunta}
                  {best.point.addr && ` · ${best.point.addr}`}
                </p>
              </div>
            </div>
            {others.length > 0 && (
              <div className="answer__others">
                <p className="label" style={{ margin: 0 }}>
                  Seuraavaksi lähimmät
                </p>
                <ul>
                  {others.map((o) => (
                    <OptionRow key={o.point.id} o={o} />
                  ))}
                </ul>
              </div>
            )}
            <p className="small-print" style={{ lineHeight: 1.5 }}>
              {group.basis} Tarkista palvelut ja aukioloajat osoitteesta <a href="https://www.hyvaep.fi">hyvaep.fi</a>.
            </p>
          </article>
        </div>
      </div>

      <section className="section ruled" style={{ gap: 16 }}>
        <SectionTitle title={`Lähin hoitopaikka kunnittain: ${need.name.toLowerCase()}`} intro={`Ajoaika ja matka henkilöautolla kuntakeskuksesta. ${eligible.length} pistettä tarjoaa tätä hoitoa.`} />
        <div className="table-scroll">
          <table className="kt">
            <caption className="visually-hidden">Lähin hoitopaikka ja ajoaika jokaisesta kunnasta</caption>
            <thead>
              <tr>
                <th scope="col">Kunta</th>
                <th scope="col" className="left">Lähin hoitopaikka</th>
                <th scope="col">Ajoaika</th>
                <th scope="col">Matka</th>
              </tr>
            </thead>
            <tbody>
              {sortedAll.map((r) => (
                <tr key={r.name} className={r.name === origin ? 'is-origin' : undefined}>
                  <th scope="row" style={{ fontWeight: r.name === origin ? 700 : 400, fontSize: 14, color: 'inherit', border: 0, borderBottom: '1px solid var(--rule)', padding: 9 }}>
                    <button type="button" className="linkish" onClick={() => setOrigin(r.name)} aria-label={`Valitse lähtökunnaksi ${r.name}`}>
                      {r.name}
                    </button>
                  </th>
                  <td className="note">{r.best.point.name}</td>
                  <td className={band(r.best.min) === 2 ? 'bold' : undefined}>{minText(r.best.min)}</td>
                  <td>{kmText(r.best.km)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="small-print" style={{ display: 'flex', flexDirection: 'column', gap: 6, lineHeight: 1.5 }}>
        <p style={{ margin: 0 }}>
          <b style={{ color: 'var(--ink)', fontWeight: 600 }}>Hoitotarpeet ovat esimerkkejä.</b> Lista kattaa 20 tavallista perusterveydenhuollon ja päivystyksen käyntisyytä, mutta se ei perustu käyntitilastoon. Hoitotarve on kytketty palvelupisteen tyyppiin, ei pisteen tarkkaan palveluvalikoimaan: esimerkiksi kaikilla terveysasemilla ei välttämättä ole neuvolaa. Kytkentä pitää tarkistaa hyvinvointialueen kanssa.
        </p>
        <p style={{ margin: 0 }}>
          Ajoajat ovat OSRM-reitittimen arvioita henkilöautolle ilman ruuhkia kuntakeskuksesta pisteeseen; kylistä ja haja-asutuksesta matka voi olla pidempi tai lyhyempi. Pistekohtaiset ajoajat näkyvät <Link to="/ajomatkat">Ajomatkat-näkymässä</Link>, ja pisteen sulkemisen vaikutusta voi arvioida <Link to="/muutokset">Palveluverkon muutokset -näkymässä</Link>.
        </p>
      </div>
    </div>
  );
}

function OptionRow({ o }: { o: Option }) {
  return (
    <li>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <CategorySwatch cat={CATEGORY_BY_ID[o.point.cat]} maxSize={12} />
        <span>{o.point.name}</span>
      </span>
      <span className="num" style={{ whiteSpace: 'nowrap' }}>
        <b style={{ fontWeight: 600 }}>{minText(o.min)}</b> · {kmText(o.km)}
      </span>
    </li>
  );
}
