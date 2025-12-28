/**
 * Sentry Error Monitoring Wrapper
 * Only initializes if SENTRY_DSN is configured
 */

type SentryType = any; // Replace with actual Sentry type if using @sentry/react

let sentry: SentryType | null = null;

/**
 * Initialize Sentry for error tracking
 * This is called automatically on app startup if SENTRY_DSN is set
 */
export async function initSentry(): Promise<void> {
  const dsn = (import.meta.env as any).SENTRY_DSN || (globalThis as any).__SENTRY_DSN__;

  if (!dsn) {
    console.log('Sentry DSN not configured, error tracking disabled');
    return;
  }

  try {
    // Lazy load Sentry only if needed
    const sentryModule = await import('@sentry/react');
    sentryModule.init({
      dsn,
      environment: import.meta.env.MODE,
      tracesSampleRate: 1.0,
      integrations: [
        sentryModule.replayIntegration(),
      ],
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
    });
    sentry = sentryModule;
    console.log('Sentry initialized');
  } catch (err) {
    console.warn('Failed to initialize Sentry:', err);
  }
}

/**
 * Capture an exception in Sentry
 */
export function captureException(error: Error, context?: Record<string, any>): void {
  if (sentry?.captureException) {
    sentry.captureException(error, { extra: context });
  }
}

/**
 * Capture a message in Sentry
 */
export function captureMessage(message: string, level: 'fatal' | 'error' | 'warning' | 'info' = 'info'): void {
  if (sentry?.captureMessage) {
    sentry.captureMessage(message, level);
  }
}

/**
 * Set user context for error tracking
 */
export function setUser(address: string, chainId?: number): void {
  if (sentry?.setUser) {
    sentry.setUser({
      id: address,
      ip_address: '{{auto}}', // Sentry will auto-detect
      extra: { chainId },
    });
  }
}
