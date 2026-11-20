import { VIEW_BY_ID } from '../content/help';
import { useMemo, useState } from 'react';
import { MunicipalitySummary } from '../components/MunicipalitySummary';
import { RegionMap, mapPos } from '../components/RegionMap';
import { Button, CategorySwatch, PageHeader } from '../components/ui';
import { TONE_FILLS } from '../data/municipalities';
import { CATEGORIES, CATEGORY_BY_ID, CATEGORY_Z, SERVICE_POINTS, type CategoryId } from '../data/servicePoints';

/** Label positions tuned so names sit clear of the service-point markers. */
export const LABELS: [string, number, number][] = [
  ['ALAJÄRVI', 583, 376], ['ALAVUS', 501, 621], ['EVIJÄRVI', 495, 104], ['ILMAJOKI', 240, 452],
  ['ISOJOKI', 200, 840], ['ISOKYRÖ', 226, 310], ['KARIJOKI', 107, 740], ['KAUHAJOKI', 262, 700],
  ['KAUHAVA', 372, 262], ['KUORTANE', 525, 480], ['KURIKKA', 300, 575], ['LAPPAJÄRVI', 514, 270],
  ['LAPUA', 420, 390], ['SEINÄJOKI', 372, 500], ['SOINI', 700, 450], ['TEUVA', 112, 560],
  ['VIMPELI', 634, 226], ['ÄHTÄRI', 684, 610],
];

export function Palvelupisteet() {
  const [hidden, setHidden] = useState<Partial<Record<CategoryId, boolean>>>({});
  const [selId, setSelId] = useState<string | null>(null);
  const [showLabels, setShowLabels] = useState(true);

  const shown = useMemo(
    () => SERVICE_POINTS.filter((p) => !hidden[p.cat]).sort((a, b) => CATEGORY_Z[a.cat] - CATEGORY_Z[b.cat]),
    [hidden],
  );
  const sel = shown.find((p) => p.id === selId);
  const selCat = sel ? CATEGORY_BY_ID[sel.cat] : undefined;

  const toggleCat = (id: CategoryId) => {
    const next = { ...hidden, [id]: !hidden[id] };
    setHidden(next);
    if (sel && next[sel.cat]) setSelId(null);
  };

  return (
    <div className="page page--split">
      <div className="page__map">
        <RegionMap
          ariaLabel="Kaavamainen kartta Etelä-Pohjanmaan hyvinvointialueesta"
          northArrow={{ x: 730, y: 820 }}
          fill={(m) => (m.rank === 1 ? '#9CC2AE' : TONE_FILLS.soft[m.tone])}
          svgChildren={
            <g
              opacity={showLabels ? 1 : 0}
              fontSize={12}
              fontWeight={600}
              fill="#3A4843"
              textAnchor="middle"
              letterSpacing="0.04em"
              style={{ transition: 'opacity 150ms' }}
            >
              {LABELS.map(([t, x, y]) => (
                <text key={t} x={x} y={y}>
                  {t}
                </text>
              ))}
            </g>
          }
        >
          {shown.map((p) => {
            const cat = CATEGORY_BY_ID[p.cat];
            const isSel = p.id === selId;
            return (
              <button
                key={p.id}
                type="button"
                className="map-hit"
                aria-label={`${p.name}, ${cat.name.toLowerCase()}`}
                aria-pressed={isSel}
                title={p.name}
                onClick={() => setSelId(p.id)}
                style={{ ...mapPos(p.x, p.y), width: 28, height: 28 }}
              >
                <CategorySwatch
                  cat={cat}
                  maxSize={99}
                  ring={isSel ? '0 0 0 3px var(--bg), 0 0 0 6px var(--ink)' : '0 1px 2px rgba(0,0,0,0.25)'}
                />
              </button>
            );
          })}
        </RegionMap>
      </div>

      <div className="page__aside">
        <PageHeader
          help={VIEW_BY_ID.palvelupisteet}
          eyebrow="Etelä-Pohjanmaan hyvinvointialue"
          title="Palvelupisteet kartalla"
          titleSize={40}
          leadSize="sm"
          lead="Valitse näytettävät palvelutyypit ja klikkaa pistettä nähdäksesi tiedot."
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p className="label" style={{ margin: 0 }}>
            Näytä kartalla · {shown.length} / {SERVICE_POINTS.length} pistettä
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
            {CATEGORIES.map((c) => {
              const on = !hidden[c.id];
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleCat(c.id)}
                  style={{
                    minHeight: 48,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-control)',
                    border: `1.5px solid ${on ? 'var(--ink)' : 'var(--chip-off)'}`,
                    background: on ? 'var(--surface)' : 'transparent',
                    color: 'var(--ink)',
                    fontSize: 14,
                    fontWeight: 500,
                    textAlign: 'left',
                    cursor: 'pointer',
                    opacity: on ? 1 : 0.6,
                  }}
                >
                  <CategorySwatch cat={c} />
                  <span style={{ flex: '1 1 auto' }}>{c.name}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-3)' }}>
                    {SERVICE_POINTS.filter((p) => p.cat === c.id).length}
                  </span>
                </button>
              );
            })}
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 44, fontSize: 14, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={showLabels}
              onChange={() => setShowLabels(!showLabels)}
              style={{ width: 18, height: 18, margin: 0, accentColor: 'var(--accent)' }}
            />
            Näytä kuntien nimet
          </label>
        </div>

        <div className="ruled" style={{ paddingTop: 18, minHeight: 210 }} aria-live="polite">
          {sel && selCat ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <CategorySwatch cat={selCat} />
                <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-2)' }}>
                  {selCat.name}
                </span>
              </div>
              <h2 className="h2" style={{ fontSize: 28, lineHeight: 1.15 }}>
                {sel.name}
              </h2>
              <p style={{ margin: 0, fontSize: 15 }}>
                {sel.kunta}
                {sel.addr && ` · ${sel.addr}`}
              </p>
              <p className="lead lead--sm">{sel.note}</p>
              <Button onClick={() => setSelId(null)} style={{ alignSelf: 'flex-start' }}>
                Tyhjennä valinta
              </Button>
              <MunicipalitySummary name={sel.kunta} />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <h2 className="h2 h2--sm">Ei valittua pistettä</h2>
              <p className="lead lead--sm">Klikkaa karttapistettä. Keskussairaala on merkitty neliöllä, muut palvelupisteet ympyröillä. Pisteen tietojen lisäksi näet sen kunnan väestö- ja hyvinvointitiedot.</p>
            </div>
          )}
        </div>

        <p className="small-print push-down" style={{ lineHeight: 1.5 }}>
          Tiedot koottu julkisista lähteistä 11/2026. Toimipisteverkko muuttuu, joten tarkista ajantasaiset tiedot ja aukioloajat osoitteesta{' '}
          <a href="https://www.hyvaep.fi">hyvaep.fi</a>. Kartta on kaavamainen, eivätkä pisteiden sijainnit ole mittatarkkoja.
        </p>
      </div>
    </div>
  );
}
