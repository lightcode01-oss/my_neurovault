declare module '@sentry/react' {
  export function init(opts?: any): void;
  export function replayIntegration(...args: any[]): any;
  export function captureException(err: any, ctx?: any): void;
  export function captureMessage(msg: any, level?: any): void;
  export function setUser(user: any): void;
  const Sentry: any;
  export default Sentry;
}
