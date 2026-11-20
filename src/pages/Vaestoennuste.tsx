import { VIEW_BY_ID } from '../content/help';
import { useEffect, useRef, useState } from 'react';
import { Button, PageHeader, SectionTitle, StatTile } from '../components/ui';
import ennuste from '../data/vaestoennuste.json';
import { fmt, signed1, signedInt } from '../lib/format';

/** Per year: [total, 0–6, 7–17, 18–64, 65–74, 75–84, 85+, 0–14, 15–64]. */
type YearRow = number[];
const DATA = ennuste.data as Record<string, YearRow[]>;
const AREAS = ennuste.areas;
const MUNIS = AREAS.map((a) => a.id).filter((id) => id !== 'HVA' && id !== 'KOKO MAA');

const FIRST = 2024;
const LAST = 2045;
const YEARS = Array.from({ length: LAST - FIRST + 1 }, (_, i) => FIRST + i);

const AGE_GROUPS: [string, number][] = [
  ['0–6 v.', 1],
  ['7–17 v.', 2],
  ['18–64 v.', 3],
  ['65–74 v.', 4],
  ['75–84 v.', 5],
  ['85+ v.', 6],
];

const pct = (part: number, whole: number) => (100 * part) / whole;
const dependency = (r: YearRow) => (100 * (r[7] + r[4] + r[5] + r[6])) / r[8];

// Line chart geometry (SVG units)
const CH = { w: 600, h: 300, left: 56, right: 588, top: 16, bottom: 266 };
const X = (i: number) => CH.left + i * ((CH.right - CH.left) / (YEARS.length - 1));

export function Vaestoennuste() {
  const [area, setArea] = useState('HVA');
  const [year, setYear] = useState(2035);
  const [playing, setPlaying] = useState(false);
  const yearRef = useRef(year);
  yearRef.current = year;

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => {
      if (yearRef.current >= LAST) {
        setPlaying(false);
        return;
      }
      setYear((y) => y + 1);
    }, 700);
    return () => clearInterval(t);
  }, [playing]);

  const togglePlay = () => {
    if (playing) return setPlaying(false);
    if (year >= LAST) setYear(FIRST);
    setPlaying(true);
  };

  const yi = year - FIRST;
  const d = DATA[area];
  const cur = d[yi];
  const base = d[0];
  const areaName = AREAS.find((a) => a.id === area)!.name;
  const old = (r: YearRow) => r[4] + r[5] + r[6];

  const tiles = [
    { label: `Väkiluku ${year}`, value: fmt(cur[0]), sub: `${signedInt(cur[0] - base[0])} (${signed1(pct(cur[0] - base[0], base[0]))} %) vs. 2024` },
    { label: 'Alle 18-vuotiaat', value: fmt(cur[1] + cur[2]), sub: `${fmt(pct(cur[1] + cur[2], cur[0]), 1)} % väestöstä · 2024: ${fmt(base[1] + base[2])}` },
    { label: '65 vuotta täyttäneet', value: `${fmt(pct(old(cur), cur[0]), 1)} %`, sub: `${fmt(old(cur))} henkeä · 2024: ${fmt(pct(old(base), base[0]), 1)} %` },
    { label: '85 vuotta täyttäneet', value: fmt(cur[6]), sub: `${signed1(pct(cur[6] - base[6], base[6]))} % vs. 2024` },
    { label: 'Väestöllinen huoltosuhde', value: fmt(dependency(cur), 1), sub: `2024: ${fmt(dependency(base), 1)}` },
  ];

  // Line chart
  const totals = d.map((r) => r[0]);
  let lo = Math.min(...totals);
  let hi = Math.max(...totals);
  const pad = Math.max((hi - lo) * 0.15, hi * 0.01);
  lo -= pad;
  hi += pad;
  const Y = (v: number) => CH.bottom - ((v - lo) / (hi - lo)) * (CH.bottom - CH.top);
  const linePath = totals.map((v, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join('');
  const yTicks = [0, 1, 2, 3].map((k) => lo + ((hi - lo) * (k + 0.5)) / 4);
  const selX = X(yi);
  const selY = Y(totals[yi]);
  const labelLeft = yi > 15;

  // Age bars
  const ageMax = Math.max(...AGE_GROUPS.flatMap(([, i]) => [base[i], cur[i]]));

  // Municipality ranking
  const ranking = MUNIS.map((m) => ({ m, p: pct(DATA[m][yi][0] - DATA[m][0][0], DATA[m][0][0]) })).sort((a, b) => b.p - a.p);
  const rankMax = Math.max(1, ...ranking.map((r) => Math.abs(r.p)));

  return (
    <div className="page page--stack">
      <PageHeader
          help={VIEW_BY_ID.ennuste}
        as="header"
        eyebrow="Etelä-Pohjanmaan hyvinvointialue · Skenaariotyökalu"
        title="Väestöennuste 2024–2045"
        lead="Valitse alue ja siirrä liukusäädintä. Luvut, kaaviot ja kuntavertailu päivittyvät valitun vuoden ennusteeseen."
      />

      <section aria-label="Valinnat" className="card" style={{ padding: '18px 22px', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 24 }}>
        <label className="field label">
          Alue
          <select className="select" value={area} onChange={(e) => setArea(e.target.value)} style={{ minHeight: 44, minWidth: 260 }}>
            {AREAS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field label" style={{ flex: '1 1 420px' }}>
          <span>
            Vuosi:{' '}
            <span className="display" style={{ fontSize: 28, color: 'var(--ink)', lineHeight: 1 }}>
              {year}
            </span>
          </span>
          <input
            type="range"
            min={FIRST}
            max={LAST}
            step={1}
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value, 10))}
            aria-label="Ennustevuosi"
            style={{ width: '100%', height: 32, margin: 0, accentColor: 'var(--chart)' }}
          />
          <span style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 500, color: 'var(--ink-3)' }}>
            {[2024, 2030, 2035, 2040, 2045].map((y) => (
              <span key={y}>{y}</span>
            ))}
          </span>
        </label>
        <Button onClick={togglePlay} pressed={playing} variant={playing ? 'solid' : 'outline'} strong>
          {playing ? 'Pysäytä' : 'Toista 2024–2045'}
        </Button>
      </section>

      <section aria-label="Tunnusluvut" className="tile-grid">
        {tiles.map((t) => (
          <StatTile key={t.label} {...t} valueSize={34} />
        ))}
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 480px), 1fr))', gap: 28 }}>
        <section className="section ruled" style={{ gap: 12 }}>
          <SectionTitle size="sm" title={`Väkiluku, ${areaName}`} />
          <p className="muted" style={{ margin: 0, fontSize: 13 }}>
            Klikkaa vuotta kaaviossa valitaksesi sen.
          </p>
          <svg
            role="img"
            aria-label={`Väkiluvun ennuste 2024–2045, ${areaName}. Vuonna ${year}: ${fmt(totals[yi])}`}
            viewBox={`0 0 ${CH.w} ${CH.h}`}
            style={{ display: 'block', width: '100%', maxWidth: CH.w, height: 'auto', overflow: 'visible' }}
          >
            {yTicks.map((v) => (
              <g key={v}>
                <line x1={CH.left} x2={CH.right} y1={Y(v)} y2={Y(v)} stroke="#DDE3DF" strokeWidth={1} />
                <text x={48} y={Y(v) + 4} textAnchor="end" fontSize={12} fill="var(--ink-3)">
                  {fmt(v)}
                </text>
              </g>
            ))}
            {[2024, 2030, 2035, 2040, 2045].map((y) => (
              <text key={y} x={X(y - FIRST)} y={290} textAnchor="middle" fontSize={12} fill="var(--ink-3)">
                {y}
              </text>
            ))}
            <line x1={selX} x2={selX} y1={CH.top} y2={CH.bottom} stroke="var(--ink)" strokeWidth={1} strokeDasharray="3 3" />
            <path d={linePath} fill="none" stroke="var(--chart)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            <circle cx={selX} cy={selY} r={6} fill="var(--chart)" stroke="#FFFFFF" strokeWidth={2} />
            <text x={selX + (labelLeft ? -10 : 10)} y={selY - 12} textAnchor={labelLeft ? 'end' : 'start'} fontSize={13} fontWeight={600} fill="var(--ink)">
              {fmt(totals[yi])}
            </text>
            {YEARS.map((y, i) => (
              <rect key={y} x={X(i) - 12.7} y={CH.top} width={25.3} height={CH.bottom - CH.top} fill="transparent" onClick={() => setYear(y)} style={{ cursor: 'pointer' }}>
                <title>{`${y}: ${fmt(totals[i])}`}</title>
              </rect>
            ))}
          </svg>
        </section>

        <section className="section ruled" style={{ gap: 12 }}>
          <SectionTitle size="sm" title={`Ikärakenne ${year} vs. 2024`} />
          <div style={{ display: 'flex', gap: 18, fontSize: 13, color: 'var(--ink-2)' }}>
            <Legend color="var(--chart-base)" label="2024" />
            <Legend color="var(--chart)" label={String(year)} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {AGE_GROUPS.map(([label, i]) => {
              const b = base[i];
              const c = cur[i];
              return (
                <div key={label} className="bar-row" style={{ gridTemplateColumns: '88px minmax(0, 1fr) 132px', fontSize: 13 }}>
                  <span style={{ fontWeight: 600 }}>{label}</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span title={`2024: ${fmt(b)}`} style={{ display: 'block', height: 12, borderRadius: '0 4px 4px 0', background: 'var(--chart-base)', width: `${(100 * b) / ageMax}%` }} />
                    <span title={`${year}: ${fmt(c)}`} style={{ display: 'block', height: 12, borderRadius: '0 4px 4px 0', background: 'var(--chart)', width: `${(100 * c) / ageMax}%` }} />
                  </div>
                  <span className="num" style={{ textAlign: 'right' }}>
                    {fmt(c)} <span style={{ color: 'var(--ink-3)' }}>({signed1(pct(c - b, b))} %)</span>
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <section className="section ruled" style={{ gap: 12 }}>
        <SectionTitle size="sm" title={`Väkiluvun muutos 2024–${year} kunnittain`} />
        <p className="muted" style={{ margin: 0, fontSize: 13 }}>
          Palkki oikealle = kasvu, vasemmalle = väheneminen. Klikkaa kuntaa valitaksesi sen alueeksi.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 460px), 1fr))', columnGap: 40, rowGap: 2, gridAutoFlow: 'row' }}>
          {ranking.map((r) => {
            const on = r.m === area;
            return (
              <button
                key={r.m}
                type="button"
                onClick={() => setArea(r.m)}
                aria-pressed={on}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '96px minmax(0, 1fr) minmax(0, 1fr) 110px',
                  alignItems: 'center',
                  minHeight: 32,
                  padding: '0 8px',
                  border: 0,
                  borderRadius: 8,
                  background: on ? 'var(--chart-sel-bg)' : 'transparent',
                  color: 'var(--ink)',
                  fontSize: 13,
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontWeight: on ? 700 : 500 }}>{r.m}</span>
                <span style={{ display: 'flex', justifyContent: 'flex-end', borderRight: '1px solid var(--ink)', height: 18, alignItems: 'center' }}>
                  <span style={{ display: 'block', height: 12, borderRadius: '4px 0 0 4px', background: 'var(--chart)', width: `${r.p < 0 ? (100 * -r.p) / rankMax : 0}%` }} />
                </span>
                <span style={{ display: 'flex', height: 18, alignItems: 'center' }}>
                  <span style={{ display: 'block', height: 12, borderRadius: '0 4px 4px 0', background: 'var(--chart)', width: `${r.p > 0 ? (100 * r.p) / rankMax : 0}%` }} />
                </span>
                <span className="num" style={{ textAlign: 'right' }}>
                  {signed1(r.p)} %
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <p className="small-print">
        Lähde: Tilastokeskus, Väestöennuste 2024, StatFin-taulukko 14wx (väestö iän ja sukupuolen mukaan alueittain, 2024–2045), haettu 19.11.2026. Väestöennuste on trendilaskelma, joka kuvaa kehitystä, jos syntyvyys, kuolevuus ja muuttoliike jatkuvat viime vuosien kaltaisina; se ei ota huomioon päätösten vaikutuksia. Ennuste on laadittu vuoden 2023 lopun väestöstä, joten myös vuoden 2024 luku on ennuste. Vertailun vuoksi: ennusteen vuoden 2025 väkiluku 18 kunnalle on 189 225, toteutunut 189 474. Väestöllinen huoltosuhde = alle 15- ja 65 vuotta täyttäneet sataa 15–64-vuotiasta kohden. Hyvinvointialueen luvut ovat 18 kunnan summia.
      </p>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 12, height: 12, borderRadius: 3, background: color, display: 'block' }} />
      {label}
    </span>
  );
}
