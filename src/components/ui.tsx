import type { CSSProperties, ReactNode } from 'react';
import type { ViewInfo } from '../content/help';
import type { Category } from '../data/servicePoints';
import { HelpPanel } from './HelpPanel';

export function PageHeader({
  eyebrow,
  title,
  lead,
  titleSize = 44,
  leadSize = 'md',
  as: Tag = 'div',
  help,
}: {
  eyebrow: string;
  title: string;
  lead?: ReactNode;
  titleSize?: number;
  leadSize?: 'md' | 'sm';
  as?: 'div' | 'header';
  /** Adds the view's "Ohje" panel under the lead. */
  help?: ViewInfo;
}) {
  return (
    <Tag className="page-header">
      <p className="eyebrow">{eyebrow}</p>
      <h1 style={{ fontSize: titleSize }}>{title}</h1>
      {lead && <p className={leadSize === 'sm' ? 'lead lead--sm' : 'lead'}>{lead}</p>}
      {help && <HelpPanel view={help} />}
    </Tag>
  );
}

export function StatTile({ label, value, sub, valueSize }: { label: string; value: ReactNode; sub?: ReactNode; valueSize?: number }) {
  return (
    <div className="card">
      <span className="label">{label}</span>
      <span className="tile__value" style={valueSize ? { fontSize: valueSize } : undefined}>
        {value}
      </span>
      {sub && <span className="tile__sub">{sub}</span>}
    </div>
  );
}

export function SectionTitle({ title, intro, size = 'md' }: { title: string; intro?: ReactNode; size?: 'sm' | 'md' | 'lg' }) {
  const cls = size === 'lg' ? 'h2 h2--lg' : size === 'sm' ? 'h2 h2--sm' : 'h2';
  return (
    <div className="section__intro">
      <h2 className={cls}>{title}</h2>
      {intro && <p>{intro}</p>}
    </div>
  );
}

export function Button({
  children,
  onClick,
  pressed,
  variant = 'outline',
  strong,
  style,
}: {
  children: ReactNode;
  onClick: () => void;
  pressed?: boolean;
  variant?: 'outline' | 'solid';
  strong?: boolean;
  style?: CSSProperties;
}) {
  const cls = ['btn', variant === 'solid' && 'btn--solid', strong && 'btn--strong'].filter(Boolean).join(' ');
  return (
    <button type="button" className={cls} onClick={onClick} aria-pressed={pressed} style={style}>
      {children}
    </button>
  );
}

/** Region vs. whole-country comparison bar (two rows). */
export function CompareBars({ caption, rows }: { caption: string; rows: { label: string; value: string; pct: number; primary?: boolean }[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
      <span className="label">{caption}</span>
      {rows.map((r) => (
        <div key={r.label} className="bar-row" style={{ gridTemplateColumns: '110px minmax(0, 1fr) 48px' }}>
          <span>{r.label}</span>
          <span className="bar" style={{ width: `${r.pct}%`, background: r.primary ? 'var(--accent)' : 'var(--compare)' }} />
          <span style={{ textAlign: 'right', fontWeight: r.primary ? 600 : undefined }}>{r.value}</span>
        </div>
      ))}
    </div>
  );
}

/** Service-point category marker (square for hospital, circles otherwise). */
export function CategorySwatch({ cat, maxSize = 16, ring }: { cat: Category; maxSize?: number; ring?: string }) {
  const size = Math.min(cat.size, maxSize);
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'block',
        flex: 'none',
        width: size,
        height: size,
        background: cat.fill,
        border: cat.border,
        borderRadius: cat.radius,
        boxShadow: ring,
      }}
    />
  );
}
