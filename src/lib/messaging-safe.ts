// src/lib/messaging-safe.ts
// Wrapper helpers to safely register message listeners for browser extensions
// Works with both Chrome (callback-based) and Firefox (promise-friendly) runtime APIs.
// TODO: If using a bundler to target extension background scripts, ensure this file is included.

type SendResponse = (response?: any) => void;

interface MessageHandler {
  (message: any, sender: any, sendResponse: SendResponse): boolean | void | Promise<any>;
}

const DEFAULT_TIMEOUT = 5000; // ms

function isChromeRuntime(runtime: any) {
  return !!(runtime && runtime.sendMessage && runtime.onMessage && runtime.onMessage.addListener);
}

export function addSafeOnMessageListener(handler: MessageHandler, options?: { timeoutMs?: number }) {
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT;
  const runtime = (typeof window !== 'undefined' && (window as any).chrome && (window as any).chrome.runtime) || (typeof globalThis !== 'undefined' && (globalThis as any).browser && (globalThis as any).browser.runtime) || (typeof global !== 'undefined' && (global as any).browser && (global as any).browser.runtime);

  if (!runtime) {
    // Not running in extension context — create a shim for testing
    // eslint-disable-next-line no-console
    console.warn('addSafeOnMessageListener: runtime API not found; using test shim.');
    // No-op shim: return a function to remove listener
    return () => {};
  }

  // Chrome-style API: callback with sendResponse and boolean return true to indicate async
  const wrapped = (message: any, sender: any, sendResponse: SendResponse) => {
    let settled = false;
    try {
      const ret = handler(message, sender, sendResponse);
      // If handler returns a Promise, handle it and ensure sendResponse is called
      if (ret && typeof (ret as Promise<any>).then === 'function') {
        // indicate that we'll respond asynchronously by returning true (Chrome)
        (ret as Promise<any>)
          .then((val) => {
            settled = true;
            try {
              sendResponse({ ok: true, value: val });
            } catch (err) {
              // eslint-disable-next-line no-console
              console.error('sendResponse failed after promise resolved:', err);
            }
          })
          .catch((err) => {
            settled = true;
            try {
              sendResponse({ ok: false, error: String(err) });
            } catch (err2) {
              // eslint-disable-next-line no-console
              console.error('sendResponse failed after promise rejection:', err2);
            }
          });

        // Fallback timeout in case the channel closes before we can respond
        setTimeout(() => {
          if (!settled) {
            // eslint-disable-next-line no-console
            console.error(`Message handler timed out after ${timeoutMs}ms. The message channel may have closed — avoid returning true without sending a response.`);
          }
        }, timeoutMs + 50);

        return true; // Tell Chrome we'll respond asynchronously
      }

      // Handler returned synchronously — if it returned true (rare), assume it handled sendResponse itself
      return (ret as any) === true;
    } catch (err) {
      // If handler throws synchronously, send a failure response
      try {
        sendResponse({ ok: false, error: String(err) });
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('sendResponse failed when reporting handler error:', e);
      }
      return false;
    }
  };

  // Register listener
  if (runtime.onMessage && runtime.onMessage.addListener) {
    runtime.onMessage.addListener(wrapped);
  } else if (runtime.addListener) {
    // fallback
    runtime.addListener(wrapped);
  } else {
    // eslint-disable-next-line no-console
    console.warn('addSafeOnMessageListener: runtime.onMessage API not found; listener not registered');
  }

  // Return a remover function
  return () => {
    try {
      if (runtime.onMessage && runtime.onMessage.removeListener) runtime.onMessage.removeListener(wrapped);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('Failed to remove listener', err);
    }
  };
}

// Example usage (commented):
/*
import { addSafeOnMessageListener } from './messaging-safe';

addSafeOnMessageListener(async (message, sender, sendResponse) => {
  if (message?.type === 'DO_THING') {
    const result = await Promise.resolve('ok');
    sendResponse({ ok: true, result });
    return true; // not required — wrapper handles Promise responses
  }
});
*/

export default addSafeOnMessageListener;
