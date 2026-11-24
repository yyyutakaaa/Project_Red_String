import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/tokens.css';
import { App } from './App.tsx';
import { applySettingsToDocument, useSettings } from './store/settings.ts';
import { initDesktopDocument } from './desktop/bridge.ts';
import { initTelemetry } from './lib/telemetry.ts';

// Theme, type size and motion go on <html> before the first paint, so the start-up screen is
// already in the right colours.
initDesktopDocument();
applySettingsToDocument(useSettings.getState());
initTelemetry();

// After a deploy, an open tab may ask for screen chunks that no longer exist. Reload once to pick up the
// new build; the timestamp guard stops a reload loop when the chunk is missing for some other reason, and
// the route error screen takes over instead.
const PRELOAD_RELOAD_KEY = 'prs:preload-reload-at';
const PRELOAD_RELOAD_WINDOW_MS = 10_000;

window.addEventListener('vite:preloadError', (event) => {
  try {
    const last = Number(window.sessionStorage.getItem(PRELOAD_RELOAD_KEY) ?? 0);
    if (Date.now() - last < PRELOAD_RELOAD_WINDOW_MS) return;
    window.sessionStorage.setItem(PRELOAD_RELOAD_KEY, String(Date.now()));
  } catch {
    // No session storage means no loop guard: let the error screen offer the reload instead.
    return;
  }
  event.preventDefault();
  window.location.reload();
});

const el = document.getElementById('root');
if (!el) throw new Error('Missing #root element');

createRoot(el).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
