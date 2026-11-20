import { VIEW_BY_ID } from '../content/help';
import { useState } from 'react';
import { RegionMap, mapPos } from '../components/RegionMap';
import { Button, PageHeader } from '../components/ui';
import kuntakortit from '../data/kuntakortit.json';
import { MUNICIPALITIES, REGION_POPULATION, TONE_FILLS } from '../data/municipalities';
import { fmt, parseFi } from '../lib/format';

interface Row {
  label: string;
  /** Municipality value, region, whole country (display strings). */
  v: string;
  a: string;
  m: string;
}
interface Group {
  title: string;
  rows: Row[];
}

const CARDS = kuntakortit.data as Record<string, Group[]>;

const unitOf = (s: string) => (/%\s*$/.test(s) ? ' %' : /€\s*$/.test(s) ? ' €' : '');
const decimalsOf = (s: string) => s.match(/,(\d+)/)?.[1].length ?? 0;

/**
 * Combine several municipalities into one card: counts are summed, rates are
 * population-weighted (child metrics weighted by under-18s), income shown as a range.
 */
function combine(names: string[]): Group[] {
  const val = (name: string, gi: number, ri: number) => CARDS[name][gi].rows[ri].v;
  const pop = (name: string) => parseFi(val(name, 0, 0));
  const kids = (name: string) => parseFi(val(name, 0, 2));

  return CARDS[names[0]].map((g, gi) => ({
    title: g.title,
    rows: g.rows.map((r, ri) => {
      const ok = names.map((nm) => ({ s: val(nm, gi, ri), nm })).filter((o) => o.s !== '–' && !isNaN(parseFi(o.s)));
      const star = ok.length < names.length ? '*' : '';
      let v = '–';
      if (ok.length) {
        const L = r.label;
        if (L === 'Väkiluku') {
          v = fmt(ok.reduce((a, o) => a + parseFi(o.s), 0));
        } else if (L === 'Osuus alueen väestöstä') {
          v = fmt((names.reduce((a, nm) => a + pop(nm), 0) / REGION_POPULATION) * 100, 1) + ' %';
        } else if (L === 'Alle 18-vuotiaat' || L === '0–6-vuotiaat') {
          const c = ok.reduce((a, o) => a + parseFi(o.s), 0);
          const p = ok.reduce((a, o) => a + pop(o.nm), 0);
          v = `${fmt(c)} (${fmt((c / p) * 100, 1)} %)${star}`;
        } else if (L.startsWith('Mediaanitulo')) {
          const xs = ok.map((o) => parseFi(o.s));
          v = `${fmt(Math.min(...xs))}–${fmt(Math.max(...xs))} €${star}`;
        } else {
          const w = L.startsWith('Lasten') || L.includes('0–17') ? kids : pop;
          const sw = ok.reduce((a, o) => a + w(o.nm), 0);
          const x = ok.reduce((a, o) => a + parseFi(o.s) * w(o.nm), 0) / sw;
          const exact = L === '65 vuotta täyttäneet';
          v = (exact ? '' : '≈ ') + fmt(x, decimalsOf(ok[0].s)) + unitOf(ok[0].s) + star;
        }
      }
      return { ...r, v };
    }),
  }));
}

const COLS = 'minmax(0, 1fr) 120px 72px 72px';

export function Kuntakortit() {
  const [sel, setSel] = useState<string[]>([]);
  const n = sel.length;
  const groups = n === 0 ? [] : n === 1 ? CARDS[sel[0]] : combine(sel);
  const totPop = sel.reduce((a, nm) => a + parseFi(CARDS[nm][0].rows[0].v), 0);

  const toggle = (name: string) => setSel((s) => (s.includes(name) ? s.filter((x) => x !== name) : [...s, name]));

  return (
    <div className="page page--split" style={{ gap: 40, paddingRight: 48 }}>
      <div className="page__map">
        <RegionMap
          ariaLabel="Kaavamainen kartta Etelä-Pohjanmaan hyvinvointialueen 18 kunnasta"
          fill={(m) => (sel.includes(m.name) ? 'var(--accent)' : TONE_FILLS.strong[m.tone])}
        >
          {MUNICIPALITIES.map((m) => {
            const on = sel.includes(m.name);
            return (
              <button
                key={m.key}
                type="button"
                className="map-hit"
                aria-pressed={on}
                onClick={() => toggle(m.name)}
                style={{ ...mapPos(m.x, m.y), width: 112, height: 44 }}
              >
                <span
                  style={{
                    display: 'block',
                    padding: '4px 10px',
                    borderRadius: 999,
                    fontSize: 13,
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    background: on ? 'var(--ink)' : 'var(--surface)',
                    color: on ? '#FFFFFF' : 'var(--ink)',
                    border: '1.5px solid var(--ink)',
                    boxShadow: on ? '0 0 0 3px var(--bg), 0 0 0 5px var(--ink)' : '0 1px 2px rgba(0,0,0,0.2)',
                  }}
                >
                  {m.name}
                </span>
              </button>
            );
          })}
        </RegionMap>
      </div>

      <div className="page__aside" style={{ gap: 20, paddingTop: 8 }}>
        <PageHeader
          help={VIEW_BY_ID.kuntakortit}
          eyebrow="Etelä-Pohjanmaan hyvinvointialue · 18 kuntaa"
          title="Kuntakortit"
          titleSize={38}
          leadSize="sm"
          lead="Valitse yksi tai useampi kunta kartalta. Kortti näyttää valittujen kuntien luvut yhteenlaskettuina rinnakkain alueen ja koko maan kanssa."
        />

        {n === 0 ? (
          <div className="card" style={{ padding: 24, gap: 8 }}>
            <h2 className="h2 h2--sm">Ei valittua kuntaa</h2>
            <p className="lead lead--sm">
              Klikkaa kunnan nimeä kartalla. Voit valita useita kuntia; uusi klikkaus poistaa kunnan valinnasta. Kortissa on väestö, työ ja koulutus, toimeentulo sekä terveys.
            </p>
          </div>
        ) : (
          <article className="card" style={{ padding: '22px 24px', gap: 16 }} aria-live="polite">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <h2 className="display" style={{ margin: 0, fontSize: n === 1 ? 30 : 20, lineHeight: 1.15 }}>
                  {n === 1 ? sel[0] : `${n} kuntaa: ${sel.join(', ')}`}
                </h2>
                <span style={{ fontSize: 14, color: 'var(--ink-2)' }}>
                  Väkiluku {fmt(totPop)} (31.12.2025){n > 1 && ' · yhteensä'}
                </span>
              </div>
              <Button onClick={() => setSel([])}>Tyhjennä valinta</Button>
            </div>

            <div
              style={{ display: 'grid', gridTemplateColumns: COLS, gap: 8, fontSize: 12, fontWeight: 600, color: 'var(--ink-2)', borderBottom: '1.5px solid var(--ink)', paddingBottom: 6 }}
            >
              <span>Tunnusluku</span>
              <span style={{ textAlign: 'right' }}>{n === 1 ? sel[0] : `Valitut (${n})`}</span>
              <span style={{ textAlign: 'right' }}>Alue</span>
              <span style={{ textAlign: 'right' }}>Koko maa</span>
            </div>

            {groups.map((g) => (
              <section key={g.title} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <h3 style={{ margin: 0, fontSize: 12, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--accent)' }}>{g.title}</h3>
                {g.rows.map((r) => (
                  <div
                    key={r.label}
                    className="num"
                    style={{ display: 'grid', gridTemplateColumns: COLS, gap: 8, fontSize: 13, lineHeight: 1.35, padding: '3px 0', borderBottom: '1px solid var(--rule-soft)' }}
                  >
                    <span>{r.label}</span>
                    <span style={{ textAlign: 'right', fontWeight: 600 }}>{r.v}</span>
                    <span style={{ textAlign: 'right', color: 'var(--ink-2)' }}>{r.a}</span>
                    <span style={{ textAlign: 'right', color: 'var(--ink-2)' }}>{r.m}</span>
                  </div>
                ))}
              </section>
            ))}

            {n > 1 && (
              <p className="small-print" style={{ lineHeight: 1.5 }}>
                Yhteenlaskenta: väkiluku ja ikäryhmien lukumäärät on laskettu yhteen. Muut osuudet ja indeksit ovat väestöllä painotettuja keskiarvoja (lasten luvut alle 18-vuotiaiden määrällä); ≈ = likiarvo, koska luvun perusjoukko ei ole koko väestö. Mediaanitulolle näytetään kuntien vaihteluväli. * = laskettu vain niistä kunnista, joilta luku on julkaistu.
              </p>
            )}
          </article>
        )}

        <p className="small-print push-down" style={{ lineHeight: 1.5 }}>
          Alue = 18 kunnan yhteenlaskettu luku tai hyvinvointialue. Poikkeus: työllisyys- ja työttömyysaste sekä Tilastokeskuksen tulonjakoluvut ovat Etelä-Pohjanmaan maakunnan (17 kuntaa, ilman Isokyröä) lukuja. Viiva (–) = ei julkaista tietosuojan vuoksi. Lähteet: Tilastokeskus StatFin (11re, 115x, 12bq, 14ww) ja THL Sotkanet, haettu 19.11.2026. Kartta on kaavamainen.
        </p>
      </div>
    </div>
  );
}
