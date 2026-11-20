import { VIEW_BY_ID } from '../content/help';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { RegionMap } from '../components/RegionMap';
import { PageHeader } from '../components/ui';
import { MUNICIPALITIES } from '../data/municipalities';
import { CATEGORIES, CATEGORY_BY_ID, DRIVE_ORIGINS, SERVICE_POINTS, type LocationMethod } from '../data/servicePoints';

/** Fill by drive-time band: under 30, 30–60, over 60 min. */
const BAND_FILL = ['#BFDCCB', '#86B8A1', '#2E7864'];
const band = (min: number) => (min < 30 ? 0 : min <= 60 ? 1 : 2);

const METHOD_TEXT: Record<LocationMethod, string> = {
  laitos: 'sijainti OSM-kohteesta',
  osoite: 'sijainti osoitteesta',
  taajama: 'sijainti taajaman keskipiste (likiarvo)',
};

/** Label anchors nudged so text clears the selected-point marker. */
const LABEL_POS: Record<string, [number, number]> = {
  ilmajoki: [250, 465], isojoki: [175, 800], kauhajoki: [250, 668], kurikka: [304, 610],
  seinajoki: [388, 500], teuva: [112, 574], vimpeli: [622, 250], ahtari: [672, 566],
};

export function Ajomatkat() {
  const [selId, setSelId] = useState('skssairaala');
  const p = SERVICE_POINTS.find((x) => x.id === selId) ?? SERVICE_POINTS[0];

  const list = DRIVE_ORIGINS.map((k, i) => {
    const min = Math.round(p.dur[i] / 60);
    return { key: k.key, name: k.name, min, km: Math.round(p.dist[i] / 1000), d: p.dur[i], band: band(min) };
  });
  const byKey = Object.fromEntries(list.map((r) => [r.key, r]));
  const sorted = [...list].sort((a, b) => a.d - b.d);
  const scale = Math.max(110, Math.ceil(sorted[sorted.length - 1].min / 10) * 10);
  const median = Math.round((sorted[8].d + sorted[9].d) / 2 / 60);
  const longest = sorted[sorted.length - 1];
  const over60 = list.filter((r) => r.min > 60).length;
  const t30 = (30 / scale) * 100;
  const t60 = (60 / scale) * 100;
  const isHospital = p.cat === 'sairaala';

  return (
    <div className="page page--split">
      <div className="page__map" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <PageHeader
          help={VIEW_BY_ID.ajomatkat}
          eyebrow="Etelä-Pohjanmaan hyvinvointialue · Saavutettavuus"
          title="Ajomatka palvelupisteeseen"
          titleSize={40}
          leadSize="sm"
          lead="Valitse palvelupiste. Kartta ja kaavio näyttävät tiematkan ja arvioidun ajoajan henkilöautolla jokaisen kunnan keskustaajamasta valittuun toimipisteeseen."
        />
        <div style={{ maxWidth: 748 }}>
          <RegionMap
            ariaLabel="Kaavamainen kartta: kunnat väritetty ajoajan mukaan valittuun palvelupisteeseen"
            northArrow={{ x: 730, y: 820 }}
            fill={(m) => BAND_FILL[byKey[m.key].band]}
            svgChildren={
              <>
                <g fontSize={13} textAnchor="middle">
                  {MUNICIPALITIES.map((m) => {
                    const r = byKey[m.key];
                    const dark = r.band === 2;
                    const [x, y] = LABEL_POS[m.key] ?? [m.x, m.y];
                    return (
                      <g key={m.key} transform={`translate(${x},${y})`}>
                        <text fontWeight={600} fill={dark ? '#FFFFFF' : 'var(--ink)'}>
                          {m.name}
                        </text>
                        <text y={17} fontSize={12} fill={dark ? '#E3F0E9' : 'var(--ink-2)'}>
                          {r.min} min
                        </text>
                      </g>
                    );
                  })}
                </g>
                <g transform={`translate(${p.x},${p.y})`}>
                  <circle r={18} fill="none" stroke="var(--ink)" strokeWidth={2} opacity={0.5} />
                  <rect x={-11} y={-11} width={22} height={22} rx={isHospital ? 4 : 11} fill={isHospital ? CATEGORY_BY_ID.sairaala.fill : 'var(--ink)'} stroke="#FFFFFF" strokeWidth={2.5} />
                </g>
                <g transform="translate(40,40)" fontSize={13} fill="var(--ink)">
                  <text fontWeight={600}>Ajoaika valittuun pisteeseen</text>
                  {['alle 30 min', '30–60 min', 'yli 60 min'].map((t, i) => (
                    <g key={t}>
                      <rect x={0} y={14 + i * 24} width={18} height={14} rx={3} fill={BAND_FILL[i]} />
                      <text x={26} y={25 + i * 24}>
                        {t}
                      </text>
                    </g>
                  ))}
                  <circle cx={9} cy={95} r={8} fill="var(--ink)" stroke="#FFFFFF" strokeWidth={2} />
                  <text x={26} y={99}>
                    Valittu palvelupiste
                  </text>
                </g>
              </>
            }
          />
        </div>
      </div>

      <div className="page__aside" style={{ gap: 18, paddingTop: 8 }}>
        <div className="field" style={{ gap: 8 }}>
          <label htmlFor="ajo-piste" className="label">
            Palvelupiste
          </label>
          <select id="ajo-piste" className="select" value={p.id} onChange={(e) => setSelId(e.target.value)}>
            {CATEGORIES.map((c) => (
              <optgroup key={c.id} label={c.plural}>
                {SERVICE_POINTS.filter((x) => x.cat === c.id).map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <p className="small-print" style={{ lineHeight: 1.45 }}>
            {CATEGORY_BY_ID[p.cat].name} · {p.kunta} · {METHOD_TEXT[p.method]}
          </p>
          <Link to="/muutokset" className="help__more">
            Arvioi pisteen sulkemista tai keventämistä →
          </Link>
        </div>

        <div className="ruled" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14 }}>
          <Kpi value={`${longest.min} min`} text={`Pisin: ${longest.name}, ${longest.km} km`} />
          <Kpi value={`${median} min`} text="Mediaani 18 kunnasta" />
          <Kpi value={`${over60} / 18`} text="kuntaa yli 60 min päässä" />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p className="label" style={{ margin: 0 }}>
            Kunnat ajoajan mukaan · min ja km kuntakeskuksesta
          </p>
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div aria-hidden="true" style={{ position: 'absolute', left: 102, right: 134, top: 0, bottom: 0, pointerEvents: 'none' }}>
              <span style={{ position: 'absolute', left: `${t30}%`, top: 0, bottom: 0, borderLeft: '1px dashed #9AA49F' }} />
              <span style={{ position: 'absolute', left: `${t60}%`, top: 0, bottom: 0, borderLeft: '1px dashed #9AA49F' }} />
            </div>
            {sorted.map((r) => (
              <div key={r.key} style={{ display: 'grid', gridTemplateColumns: '92px minmax(0,1fr) 124px', alignItems: 'center', gap: 10, height: 26, fontSize: 14 }}>
                <span style={{ fontWeight: 500 }}>{r.name}</span>
                <span style={{ display: 'block', height: 14, background: 'var(--track)', borderRadius: '0 3px 3px 0' }}>
                  <span style={{ display: 'block', height: 14, width: `${(r.min / scale) * 100}%`, background: BAND_FILL[r.band], borderRadius: '0 3px 3px 0' }} />
                </span>
                <span className="num" style={{ textAlign: 'right' }}>
                  <b style={{ fontWeight: 600 }}>{r.min} min</b> <span style={{ color: 'var(--ink-3)' }}>· {r.km} km</span>
                </span>
              </div>
            ))}
          </div>
          <div aria-hidden="true" style={{ display: 'grid', gridTemplateColumns: '92px minmax(0,1fr) 124px', gap: 10, fontSize: 11, color: 'var(--ink-3)' }}>
            <span />
            <span style={{ position: 'relative', height: 14 }}>
              <span style={{ position: 'absolute', left: `${t30}%`, transform: 'translateX(-50%)' }}>30</span>
              <span style={{ position: 'absolute', left: `${t60}%`, transform: 'translateX(-50%)' }}>60 min</span>
            </span>
            <span />
          </div>
        </div>

        <div className="small-print push-down" style={{ display: 'flex', flexDirection: 'column', gap: 8, lineHeight: 1.5 }}>
          <p style={{ margin: 0 }}>
            <b style={{ color: 'var(--ink)', fontWeight: 600 }}>Ajoajat ovat OSRM-reitittimen arvioita ilman ruuhkia, eivät Google Mapsin.</b> Todellinen ajoaika vaihtelee kelin, liikenteen ja ajotavan mukaan. Matka on laskettu suuntaan kunnasta palvelupisteeseen.
          </p>
          <p style={{ margin: 0 }}>
            Lähde: OSRM (router.project-osrm.org), tieverkko © OpenStreetMapin tekijät, ODbL. Haettu 19.11.2026. Koordinaatit Nominatimista: kuntakeskukset OSM:n kuntarajojen keskustaajamapisteinä, palvelupisteet OSM-kohteena, osoitteena tai taajaman keskipisteenä (näkyy valinnan alla). Toimipisteverkko muuttuu: tarkista palvelut osoitteesta{' '}
            <a href="https://www.hyvaep.fi">hyvaep.fi</a>.
          </p>
        </div>
      </div>
    </div>
  );
}

function Kpi({ value, text }: { value: string; text: string }) {
  return (
    <div>
      <div className="display" style={{ fontSize: 30, lineHeight: 1, color: 'var(--accent)' }}>
        {value}
      </div>
      <div style={{ fontSize: 12, lineHeight: 1.4, color: 'var(--ink-2)', marginTop: 6 }}>{text}</div>
    </div>
  );
}
