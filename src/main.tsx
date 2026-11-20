import { StrictMode, useEffect, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { App } from './App';
import './styles.css';

/**
 * Artifact build: the claude.ai viewer only passes a plain `#name` hash, so routes
 * live in memory and are mirrored to `#palvelupisteet`, `#ajomatkat`, ... for links.
 */
function HashSync({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    const name = location.pathname.replace(/^\//, '');
    if (location.hash !== '' || window.location.hash.slice(1) === name) return;
    history.replaceState(null, '', name ? `#${name}` : window.location.pathname + window.location.search);
    // A link may ask for a section (e.g. the user guide); the page scrolls there itself.
    if (!(location.state as { section?: string } | null)?.section) window.scrollTo(0, 0);
  }, [location]);
  useEffect(() => {
    const onHash = () => navigate(`/${window.location.hash.slice(1)}`);
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [navigate]);
  return <>{children}</>;
}

const isArtifact = import.meta.env.MODE === 'artifact';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isArtifact ? (
      <MemoryRouter initialEntries={[`/${window.location.hash.slice(1)}`]}>
        <HashSync>
          <App />
        </HashSync>
      </MemoryRouter>
    ) : (
      <BrowserRouter>
        <App />
      </BrowserRouter>
    )}
  </StrictMode>,
);
