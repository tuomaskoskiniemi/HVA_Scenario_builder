import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { RegionMap, mapPos } from '../components/RegionMap';
import { Button, CategorySwatch, PageHeader, SectionTitle } from '../components/ui';
import { VIEW_BY_ID } from '../content/help';
import kuntakortit from '../data/kuntakortit.json';
import { MUNICIPALITIES } from '../data/municipalities';
import { CATEGORIES, CATEGORY_BY_ID, DRIVE_ORIGINS, SERVICE_POINTS } from '../data/servicePoints';
import { fmt, parseFi } from '../lib/format';
import { SERVICE_LEVELS, allowedStatuses, runScenario, type PointStatus, type ServiceLevel } from '../lib/scenario';
import { LABELS } from './Palvelupisteet';

const STATUS_TEXT: Record<PointStatus, string> = { open: 'Nykyinen', light: 'Kevennetty sote-pisteeksi', closed: 'Suljettu' };
const STATUS_SHORT: Record<PointStatus, string> = { open: 'nykyinen', light: 'kevennetty', closed: 'suljettu' };

/** Points outside a municipality centre: their closure does not show in centre-to-point drive times. */
const VILLAGE_POINTS = new Set(['t-jalasjarvi', 'p-jurva', 'p-lehtimaki', 'p-alaharma', 'p-yliharma', 'p-kortesjarvi']);

/** Change classes for the map (minutes added). */
const CHANGE_FILL = ['#E4E8E0', '#F6E3CF', '#EDB27C', '#C25A1F'];
const changeClass = (delta: number) => (delta <= 0 ? 0 : delta <= 10 ? 1 : delta <= 20 ? 2 : 3);

const CARDS = kuntakortit.data as Record<string, { rows: { label: string; v: string }[] }[]>;
const POP = Object.fromEntries(MUNICIPALITIES.map((m) => [m.name, m.pop]));
const POP65 = Object.fromEntries(
  MUNICIPALITIES.map((m) => [m.name, Math.round((m.pop * parseFi(CARDS[m.name][0].rows.find((r) => r.label === '65 vuotta täyttäneet')!.v)) / 100)]),
);
const LABEL_BY_NAME = Object.fromEntries(LABELS.map(([t, x, y]) => [t, [x, y] as const]));

const minText = (m: number) => (Number.isFinite(m) ? `${m} min` : 'ei palvelua');

export function Muutokset() {
  const [statuses, setStatuses] = useState<Record<string, PointStatus>>({});
  const [level, setLevel] = useState<ServiceLevel | null>(null);
  const [elderly, setElderly] = useState(false);
  const [selId, setSelId] = useState<string | null>(null);

  const origins = useMemo(() => DRIVE_ORIGINS.map((o) => ({ name: o.name, weight: (elderly ? POP65 : POP)[o.name] })), [elderly]);
  const active = level !== null;
  const s = useMemo(() => runScenario(SERVICE_POINTS, origins, level ?? 1, statuses), [origins, level, statuses]);
  const byName = Object.fromEntries(s.rows.map((r) => [r.name, r]));
  // Before a service level is chosen, the map shows each municipality's largest increase over all three levels.
  const allLevels = useMemo(() => ([3, 2, 1] as ServiceLevel[]).map((l) => runScenario(SERVICE_POINTS, origins, l, statuses)), [origins, statuses]);
  const mapDelta = (name: string) =>
    active ? byName[name].delta : Math.max(...allLevels.map((r) => r.rows.find((x) => x.name === name)!.delta));

  const setStatus = (id: string, st: PointStatus) => {
    setSelId(id);
    setStatuses((cur) => {
      const next = { ...cur };
      if (st === 'open') delete next[id];
      else next[id] = st;
      return next;
    });
  };
  const changed = SERVICE_POINTS.filter((p) => statuses[p.id]);
  const sel = SERVICE_POINTS.find((p) => p.id === selId);
  const who = elderly ? '65 vuotta täyttänyttä' : 'asukasta';
  const sorted = [...s.rows].sort((a, b) => b.delta - a.delta || b.minAfter - a.minAfter);
  const villageChanged = changed.filter((p) => VILLAGE_POINTS.has(p.id));

  return (
    <div className="page page--stack" style={{ gap: 32 }}>
      <PageHeader
        help={VIEW_BY_ID.muutokset}
        eyebrow="Etelä-Pohjanmaan hyvinvointialue · Palveluverkon skenaariot"
        title="Palveluverkon muutokset"
        titleSize={44}
        lead="Sulje palvelupiste tai kevennä se sote-pisteeksi ja vertaa, miten ajomatka lähimpään palveluun muuttuu kunnittain."
      />
      <div className="page--split" style={{ display: 'flex', gap: 48 }}>
        <div className="page__map sticky-map">
          <RegionMap
            ariaLabel="Kaavamainen kartta: kunnat väritetty sen mukaan, kuinka paljon matka valitun tason palveluun pitenee"
            northArrow={{ x: 730, y: 820 }}
            fill={(m) => CHANGE_FILL[changeClass(mapDelta(m.name))]}
            svgChildren={
              <>
                <g fontSize={12} fontWeight={600} textAnchor="middle" letterSpacing="0.04em">
                  {MUNICIPALITIES.map((m) => {
                    const [x, y] = LABEL_BY_NAME[m.name.toUpperCase()];
                    const delta = mapDelta(m.name);
                    const strong = changeClass(delta) === 3;
                    return (
                      <g key={m.key}>
                        <text x={x} y={y} fill={strong ? '#FFFFFF' : '#3A4843'}>
                          {m.name.toUpperCase()}
                        </text>
                        {delta > 0 && (
                          <text x={x} y={y + 16} fontSize={13} fontWeight={700} letterSpacing="0" fill={strong ? '#FFFFFF' : '#7A3510'}>
                            {Number.isFinite(delta) ? `+${delta} min` : 'ei palvelua'}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </g>
                <g transform="translate(40,40)" fontSize={13} fill="var(--ink)">
                  <text fontWeight={600}>{active ? 'Ajomatka pitenee' : 'Ajomatka pitenee (suurin muutos)'}</text>
                  {['ei muutosta', '1–10 min', '11–20 min', 'yli 20 min'].map((t, i) => (
                    <g key={t}>
                      <rect x={0} y={14 + i * 24} width={18} height={14} rx={3} fill={CHANGE_FILL[i]} stroke="#C9D1CC" />
                      <text x={26} y={25 + i * 24}>
                        {t}
                      </text>
                    </g>
                  ))}
                </g>
              </>
            }
          >
            {SERVICE_POINTS.map((p) => {
              const st = statuses[p.id] ?? 'open';
              const cat = CATEGORY_BY_ID[st === 'light' ? 'piste' : p.cat];
              const isSel = p.id === selId;
              const ring = isSel ? '0 0 0 3px var(--bg), 0 0 0 6px var(--ink)' : '0 1px 2px rgba(0,0,0,0.25)';
              return (
                <button
                  key={p.id}
                  type="button"
                  className="map-hit"
                  aria-label={`${p.name}: ${STATUS_SHORT[st]}`}
                  aria-pressed={isSel}
                  title={`${p.name} (${STATUS_SHORT[st]})`}
                  onClick={() => setSelId(p.id)}
                  style={{ ...mapPos(p.x, p.y), width: 28, height: 28 }}
                >
                  {st === 'closed' ? (
                    <span aria-hidden="true" style={{ display: 'block', width: 14, height: 14, borderRadius: '50%', border: '2px dashed #5F6B66', background: 'var(--bg)', boxShadow: ring }} />
                  ) : (
                    <CategorySwatch cat={cat} maxSize={99} ring={ring} />
                  )}
                </button>
              );
            })}
          </RegionMap>
        </div>

        <div className="page__aside" style={{ gap: 22, paddingTop: 8 }}>
          <fieldset className="seg">
            <legend className="label">Tarkasteltava palvelu</legend>
            {SERVICE_LEVELS.map((l) => (
              <label key={l.level} className={level === l.level ? 'seg__opt on' : 'seg__opt'}>
                <input type="radio" name="level" value={l.level} checked={level === l.level} onChange={() => setLevel(l.level)} />
                <span className="seg__name">{l.name}</span>
                <span className="seg__detail">{l.detail}</span>
              </label>
            ))}
          </fieldset>

          <fieldset className="seg seg--row">
            <legend className="label">Asukkaat</legend>
            {[
              [false, 'Kaikki asukkaat'],
              [true, '65 vuotta täyttäneet'],
            ].map(([v, t]) => (
              <label key={String(v)} className={elderly === v ? 'seg__opt on' : 'seg__opt'}>
                <input type="radio" name="who" checked={elderly === v} onChange={() => setElderly(v as boolean)} />
                <span className="seg__name">{t as string}</span>
              </label>
            ))}
          </fieldset>

          {!active && (
            <p className="prompt ruled">Valitse tarkasteltava palvelu, niin näet tunnusluvut ja kuntakohtaisen taulukon. Siihen asti kartta näyttää jokaiselle kunnalle suurimman ajomatkan pitenemisen, jonka muutokset aiheuttavat millä tahansa palvelutasolla.</p>
          )}
          {active && (
          <div className="ruled kpis" aria-live="polite">
            <Kpi label="Keskimääräinen ajoaika" before={`${fmt(s.avgBefore, 1)} min`} after={`${fmt(s.avgAfter, 1)} min`} worse={s.avgAfter > s.avgBefore} />
            <Kpi label={`Yli 30 min päässä`} before={fmt(s.over30Before)} after={fmt(s.over30After)} unit={who} worse={s.over30After > s.over30Before} />
            <Kpi label={`Yli 60 min päässä`} before={fmt(s.over60Before)} after={fmt(s.over60After)} unit={who} worse={s.over60After > s.over60Before} />
            <Kpi label="Kuntia, joissa matka pitenee" before="0" after={String(s.worse)} unit="/ 18" worse={s.worse > 0} />
          </div>
          )}
          {active && s.noServiceAfter > 0 && (
            <p className="warn">Tällä tasolla ei jää yhtään palvelupistettä {fmt(s.noServiceAfter)} asukkaalle.</p>
          )}

          {sel && (
            <div className="card" style={{ gap: 10, padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <CategorySwatch cat={CATEGORY_BY_ID[sel.cat]} />
                <span className="label" style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {CATEGORY_BY_ID[sel.cat].name} · {sel.kunta}
                </span>
              </div>
              <h2 className="h2 h2--sm">{sel.name}</h2>
              <StatusPicker id={sel.id} cat={sel.cat} value={statuses[sel.id] ?? 'open'} onChange={setStatus} />
              {VILLAGE_POINTS.has(sel.id) && (
                <p className="small-print">Piste on kyläkeskuksessa. Sen muutoksen vaikutus kylän asukkaisiin ei näy, koska ajoajat on laskettu kuntakeskuksista.</p>
              )}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p className="label" style={{ margin: 0 }}>
              Skenaarion muutokset ({changed.length})
            </p>
            {changed.length === 0 ? (
              <p className="small-print">Ei muutoksia. Valitse piste kartalta tai alla olevasta luettelosta.</p>
            ) : (
              <ul className="changes">
                {changed.map((p) => (
                  <li key={p.id}>
                    <button type="button" className="linkish" onClick={() => setSelId(p.id)}>
                      {p.name}
                    </button>
                    <span>{STATUS_SHORT[statuses[p.id]]}</span>
                  </li>
                ))}
              </ul>
            )}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Button onClick={() => { setStatuses({}); setSelId(null); }}>Palauta nykytila</Button>
            </div>
          </div>
          <section className="section ruled" style={{ gap: 16 }} aria-label="Palvelupisteiden tila">
            <SectionTitle title="Palvelupisteiden tila" intro="Muuta pisteen tilaa: muutos näkyy heti vieressä olevalla kartalla. Keskussairaala on mukana laskennassa, mutta sen tilaa ei voi muuttaa." />
            <div className="points-grid">
              {CATEGORIES.filter((c) => c.id !== 'sairaala').map((c) => (
                <div key={c.id} className="points-group">
                  <h3 className="label" style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                    <CategorySwatch cat={c} /> {c.plural}
                  </h3>
                  {SERVICE_POINTS.filter((p) => p.cat === c.id).map((p) => (
                    <div key={p.id} className={statuses[p.id] ? 'point-row changed' : 'point-row'}>
                      <button type="button" className="linkish" onClick={() => setSelId(p.id)}>
                        {p.name}
                      </button>
                      <StatusPicker id={p.id} cat={p.cat} value={statuses[p.id] ?? 'open'} onChange={setStatus} compact />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {villageChanged.length > 0 && (
        <p className="warn">
          {villageChanged.map((p) => p.name).join(', ')}: kyläkeskuksen pisteen muutos ei näy luvuissa, koska ajoajat on laskettu vain kuntakeskuksista.
        </p>
      )}

      <section className="section ruled" style={{ gap: 16 }}>
        <SectionTitle
          title="Vaikutus kunnittain"
          intro={
            active
              ? `Lähin piste, joka tarjoaa valitun palvelun (${SERVICE_LEVELS.find((l) => l.level === level)!.name.toLowerCase()}), nyt ja muutosten jälkeen. Eniten pitenevät matkat ensin.`
              : 'Valitse tarkasteltava palvelu, niin taulukko näyttää jokaisen kunnan lähimmän pisteen ja ajoajan nyt ja muutosten jälkeen.'
          }
        />
        {active && (
        <div className="table-scroll">
          <table className="kt">
            <caption style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>Ajoaika lähimpään palvelupisteeseen kunnittain, nyt ja skenaariossa</caption>
            <thead>
              <tr>
                <th scope="col">Kunta</th>
                <th scope="col">{elderly ? '65 v. täyttäneet' : 'Asukkaita'}</th>
                <th scope="col" className="left">Lähin nyt</th>
                <th scope="col">Nyt</th>
                <th scope="col" className="left">Muutosten jälkeen</th>
                <th scope="col">Jälkeen</th>
                <th scope="col">Muutos</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => (
                <tr key={r.name}>
                  <th scope="row" style={{ fontWeight: r.delta > 0 ? 600 : 400, fontSize: 14, color: 'inherit', border: 0, borderBottom: '1px solid var(--rule)', padding: 9 }}>
                    {r.name}
                  </th>
                  <td>{fmt(r.weight)}</td>
                  <td className="note">{r.before?.point.name ?? '–'}</td>
                  <td>{minText(r.minBefore)}</td>
                  <td className="note">{r.after?.point.name ?? '–'}</td>
                  <td>{minText(r.minAfter)}</td>
                  <td className={r.delta > 0 ? 'bold' : 'na'}>{r.delta > 0 ? (Number.isFinite(r.delta) ? `+${r.delta} min` : 'ei palvelua') : '±0'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </section>


      <div className="small-print" style={{ display: 'flex', flexDirection: 'column', gap: 6, lineHeight: 1.5 }}>
        <p style={{ margin: 0 }}>
          <b style={{ color: 'var(--ink)', fontWeight: 600 }}>Näin luvut lasketaan.</b> Jokaiselle kunnalle haetaan lähin piste, joka tarjoaa valitun palvelun, ja sen ajoaika kuntakeskuksesta henkilöautolla (OSRM, ilman ruuhkia). Kevennetty piste palvelee vain lähipalvelutasolla. Kunnan kaikkien asukkaiden oletetaan lähtevän kuntakeskuksesta, joten kylien ja haja-asutuksen matkat eivät näy. Keskiarvo ja yli 30 tai 60 minuutin päässä asuvat on painotettu kunnan asukasluvulla (31.12.2025) tai 65 vuotta täyttäneiden määrällä.
        </p>
        <p style={{ margin: 0 }}>
          Tarkastelu on suuntaa antava apu valmisteluun, ei päätöksen peruste sellaisenaan: se ei huomioi joukkoliikennettä, palveluiden kapasiteettia, digipalveluita eikä liikkuvia palveluita. Ajoajat näkyvät pistekohtaisesti myös <Link to="/ajomatkat">Ajomatkat-näkymässä</Link>.
        </p>
      </div>
    </div>
  );
}

function Kpi({ label, before, after, unit, worse }: { label: string; before: string; after: string; unit?: string; worse: boolean }) {
  return (
    <div className="kpi">
      <span className="kpi__label">{label}</span>
      <span className="kpi__value">
        <span className="kpi__before">{before}</span>
        <span aria-hidden="true"> → </span>
        <span className="visually-hidden"> muutosten jälkeen </span>
        <span className={worse ? 'kpi__after worse' : 'kpi__after'}>{after}</span>
      </span>
      {unit && <span className="kpi__unit">{unit}</span>}
    </div>
  );
}

function StatusPicker({ id, cat, value, onChange, compact }: { id: string; cat: (typeof SERVICE_POINTS)[number]['cat']; value: PointStatus; onChange: (id: string, s: PointStatus) => void; compact?: boolean }) {
  const opts = allowedStatuses(cat);
  return (
    <div className={compact ? 'status-pick compact' : 'status-pick'} role="group" aria-label="Pisteen tila skenaariossa">
      {opts.map((o) => (
        <button key={o} type="button" aria-pressed={value === o} className={value === o ? `on ${o}` : ''} onClick={() => onChange(id, o)}>
          {compact ? STATUS_SHORT[o][0].toUpperCase() + STATUS_SHORT[o].slice(1) : STATUS_TEXT[o]}
        </button>
      ))}
    </div>
  );
}
