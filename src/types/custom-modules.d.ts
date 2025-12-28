// Allow import paths that include pinned versions like `lib@1.2.3`
// These are resolved at runtime via the Vite alias configuration.

declare module '*@*' {
  const anyModule: any;
  export default anyModule;
}

// Fallback for absolute alias used in code
declare module '@/*' {
  const anyModule: any;
  export default anyModule;
}
