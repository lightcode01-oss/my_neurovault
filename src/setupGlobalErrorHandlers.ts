// src/setupGlobalErrorHandlers.ts
// Register global handlers for errors and unhandled promise rejections.
// Import this module early in the app (e.g. from src/main.tsx) to surface runtime issues.

export function setupGlobalErrorHandlers() {
  window.addEventListener('error', (ev) => {
    // eslint-disable-next-line no-console
    console.error('Global error caught:', ev.error || ev.message || ev);
    // Helpful hint for common misconfiguration
    if (String(ev.message).includes('Failed to load')) {
      // eslint-disable-next-line no-console
      console.error('Asset 404 detected. Check vite config `base` (VITE_BASE) and ensure you rebuilt the app with correct base.');
    }
  });

  window.addEventListener('unhandledrejection', (ev) => {
    // eslint-disable-next-line no-console
    console.error('Unhandled promise rejection:', ev.reason);
    // If rejection looks like message-channel closed, provide hint
    try {
      const r = String(ev.reason);
      if (r.includes('The message port closed')) {
        // eslint-disable-next-line no-console
        console.error('Message channel closed before response. Use messaging-safe.addSafeOnMessageListener to ensure sendResponse is called or returned promise is handled.');
      }
    } catch (_){ /* noop */ }
  });
}

export default setupGlobalErrorHandlers;
