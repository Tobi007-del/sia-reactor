declare global {
  interface SIANamespace {}

  interface Window {
    /** Shared S.I.A namespace. */
    sia: SIANamespace;
  }

  var sia: SIANamespace; // for IIFE build
}

export {};
