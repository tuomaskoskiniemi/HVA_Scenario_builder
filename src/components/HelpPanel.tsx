import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import type { ViewInfo } from '../content/help';

/** "Ohje" disclosure: explains how to use the current view. */
export function HelpPanel({ view }: { view: ViewInfo }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div className="help">
      <button type="button" className="help__toggle" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen(!open)}>
        <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <circle cx="10" cy="10" r="8.2" />
          <path d="M7.7 7.6a2.4 2.4 0 1 1 3.4 2.2c-.7.3-1.1.9-1.1 1.6v.4" />
          <circle cx="10" cy="14.4" r=".4" fill="currentColor" />
        </svg>
        {open ? 'Sulje ohje' : 'Ohje: näin käytät näkymää'}
      </button>
      <div id={panelId} className="help__panel" hidden={!open}>
        <p className="help__purpose">{view.purpose}</p>
        <ol className="help__steps">
          {view.steps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
        {view.note && <p className="help__note">{view.note}</p>}
        <Link to="/tietoa" className="help__more">
          Kaikki näkymät ja käyttöohje →
        </Link>
      </div>
    </div>
  );
}
