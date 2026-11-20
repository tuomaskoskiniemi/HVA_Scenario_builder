import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { ToolIntro } from './components/ToolIntro';
import { Ajomatkat } from './pages/Ajomatkat';
import { Kunnat } from './pages/Kunnat';
import { Hoito } from './pages/Hoito';
import { Kuntakortit } from './pages/Kuntakortit';
import { Muutokset } from './pages/Muutokset';
import { Palvelupisteet } from './pages/Palvelupisteet';
import { Tietoa } from './pages/Tietoa';
import { Vaestoennuste } from './pages/Vaestoennuste';
import { Vaestotiedot } from './pages/Vaestotiedot';

const ROUTES = [
  { path: '/', label: 'Kunnat', element: <Kunnat /> },
  { path: '/palvelupisteet', label: 'Palvelupisteet', element: <Palvelupisteet /> },
  { path: '/vaesto', label: 'Väestö ja hyvinvointi', element: <Vaestotiedot /> },
  { path: '/kuntakortit', label: 'Kuntakortit', element: <Kuntakortit /> },
  { path: '/ennuste', label: 'Väestöennuste', element: <Vaestoennuste /> },
  { path: '/ajomatkat', label: 'Ajomatkat', element: <Ajomatkat /> },
  { path: '/muutokset', label: 'Palveluverkon muutokset', element: <Muutokset /> },
  { path: '/hoito', label: 'Hoidon haku', element: <Hoito /> },
  { path: '/tietoa', label: 'Tietoa työkalusta', element: <Tietoa /> },
];

export function App() {
  const { pathname } = useLocation();
  return (
    <>
      <nav className="shell-nav" aria-label="Päävalikko">
        <div className="shell-nav__inner">
          <NavLink to="/" className="shell-nav__brand">
            Hyvaep
          </NavLink>
          <ul className="shell-nav__links">
            {ROUTES.map((r) => (
              <li key={r.path} className={r.path === '/tietoa' ? 'shell-nav__about' : undefined}>
                <NavLink to={r.path} end className="shell-nav__link">
                  {r.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </nav>
      <main>
        {pathname === '/' && <ToolIntro />}
        <Routes>
          {ROUTES.map((r) => (
            <Route key={r.path} path={r.path} element={r.element} />
          ))}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}
