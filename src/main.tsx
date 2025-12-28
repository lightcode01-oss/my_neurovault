
  import { createRoot } from 'react-dom/client';
  import App from './App';
  import './index.css';
  import setupGlobalErrorHandlers from './setupGlobalErrorHandlers';
  import ErrorBoundary from './components/ErrorBoundary';

  // Setup global handlers early to capture runtime errors
  setupGlobalErrorHandlers();

  // Wrap render in try/catch to capture missing module / 404-like errors in dev
  try {
    const rootEl = document.getElementById('root');
    if (!rootEl) {
      // eslint-disable-next-line no-console
      console.error('Root element #root not found in document.');
    } else {
      // Debug info: show resolved base and current path (helpful when diagnosing 404s)
      // eslint-disable-next-line no-console
      console.log('Vite BASE_URL:', import.meta.env.BASE_URL, 'window.location.pathname:', window.location.pathname);

      createRoot(rootEl).render(
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      );
    }
  } catch (err) {
    // Helpful diagnostic when import/render fails (often due to wrong base/build)
    // eslint-disable-next-line no-console
    console.error('Error mounting React app:', err);
    // If the error looks like a module load or 404, provide actionable hint
    try {
      const message = (err as Error).message || String(err);
      if (/failed to fetch|404|Module not found|Failed to fetch/i.test(message)) {
        // eslint-disable-next-line no-console
        console.error('Asset 404 or module load failed. Check `vite.config.ts` base (VITE_BASE) and ensure you built with the correct base.');
        // Friendly hint UI: for production, consider showing a static message with link to raw index.html
        if (import.meta.env.PROD) {
          const el = document.getElementById('root');
          if (el) el.innerHTML = `<div style="font-family: sans-serif; padding:1rem;"><h2>App failed to load</h2><p>Assets returned 404. Please check the configured <code>base</code> in <code>vite.config.ts</code> and rebuild with the correct path (e.g. <code>VITE_BASE='/neurovault/'</code>).</p><p>Raw index: <a href="${import.meta.env.BASE_URL}index.html">index.html</a></p></div>`;
        }
      }
    } catch (_) {
      // swallow
    }
    throw err;
  }
  