import * as SIAGlobal from "../super";

interface SIANamespace extends SIAGlobal {}

declare global {
  interface Window {
    /** Shared S.I.A namespace. */
    sia: SIANamespace;
  }

  var sia: SIANamespace; // for IIFE build
}

export {};
