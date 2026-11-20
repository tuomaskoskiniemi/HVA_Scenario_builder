import { VIEW_BY_ID } from '../content/help';
import { RegionMap } from '../components/RegionMap';
import { PageHeader } from '../components/ui';
import { MUNICIPALITIES, TONE_FILLS, byRank } from '../data/municipalities';
import { fmt } from '../lib/format';

const ACCENT = '#1F6F5C';

/** Overview: the 18 municipalities, numbered by population. */
export function Kunnat() {
  // Two-column list read top-to-bottom: 1–9 left, 10–18 right.
  const half = Math.ceil(byRank.length / 2);
  const ordered = byRank.slice(0, half).flatMap((m, i) => [m, byRank[half + i]].filter(Boolean));

  return (
    <div className="page page--split">
      <div className="page__map">
        <RegionMap
          ariaLabel="Kaavamainen kartta Etelä-Pohjanmaan hyvinvointialueen 18 kunnasta"
          fill={(m) => (m.rank === 1 ? ACCENT : TONE_FILLS.strong[m.tone])}
          svgChildren={
            <g fontSize={13} fontWeight={500} fill="var(--ink)" textAnchor="middle">
              {MUNICIPALITIES.map((m) => {
                const hub = m.rank === 1;
                return (
                  <g key={m.key} transform={`translate(${m.x},${m.y})`}>
                    <circle r={11} fill={hub ? '#FFFFFF' : 'var(--ink)'} />
                    <text y={4.5} fontSize={11} fontWeight={600} fill={hub ? 'var(--ink)' : '#FFFFFF'}>
                      {m.rank}
                    </text>
                    <text y={28} fill={hub ? '#FFFFFF' : undefined} fontWeight={hub ? 600 : undefined}>
                      {m.name}
                    </text>
                  </g>
                );
              })}
            </g>
          }
        />
      </div>

      <div className="page__aside" style={{ gap: 28, paddingTop: 24 }}>
        <PageHeader
          help={VIEW_BY_ID.kunnat}
          eyebrow="Hyvinvointialue · Hyvaep"
          title="Etelä-Pohjanmaan hyvinvointialue"
          lead="Sosiaali-, terveys- ja pelastuspalvelut 18 kunnan alueella. Hallinnollinen keskus on Seinäjoki."
        />

        <div className="ruled" style={{ display: 'flex', gap: 12, alignItems: 'baseline', paddingTop: 16 }}>
          <span className="display" style={{ fontSize: 64, lineHeight: 1, color: 'var(--accent)' }}>
            18
          </span>
          <span style={{ fontSize: 16, fontWeight: 500 }}>kuntaa</span>
        </div>

        <ol
          style={{
            margin: 0,
            padding: 0,
            listStyle: 'none',
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            columnGap: 24,
            rowGap: 10,
            fontSize: 16,
          }}
        >
          {ordered.map((m) => {
            const hub = m.rank === 1;
            return (
              <li key={m.key} style={{ display: 'flex', gap: 10, alignItems: 'center', fontWeight: hub ? 600 : undefined, color: hub ? 'var(--accent)' : undefined }}>
                <span
                  aria-hidden="true"
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    background: hub ? 'var(--accent)' : 'var(--ink)',
                    color: '#FFFFFF',
                    fontSize: 12,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flex: 'none',
                  }}
                >
                  {m.rank}
                </span>
                {m.name}
                <span className="num" style={{ marginLeft: 'auto', fontSize: 14, color: hub ? undefined : 'var(--ink-3)' }}>
                  {fmt(m.pop)}
                </span>
              </li>
            );
          })}
        </ol>

        <div className="push-down" style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, lineHeight: 1.5, color: 'var(--ink-3)' }}>
          <p style={{ margin: 0 }}>Kunnat on numeroitu asukasluvun mukaan suurimmasta (1) pienimpään (18). Asukasluvut 31.12.2025, Tilastokeskus (StatFin 11re).</p>
          <p style={{ margin: 0 }}>Kaavamainen kartta: kuntien sijainnit ovat todellisia, mutta rajat on yksinkertaistettu eivätkä ole mittatarkkoja.</p>
        </div>
      </div>
    </div>
  );
}
