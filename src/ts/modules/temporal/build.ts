import { TemporalConfig } from "./types";

export const TEMPORAL_MODULE_BUILD: Partial<TemporalConfig<any>> = {
  limit: 1000000000,
  maxPlaybackDelay: 2000,
  mirrorReads: true,
  mirrorWrites: true,
};
