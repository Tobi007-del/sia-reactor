import { TimeTravelConfig } from "./types";

export const TIME_TRAVEL_MODULE_BUILD: Partial<TimeTravelConfig<any>> = {
  limit: 1000000000,
  maxPlaybackDelay: 2000,
  mirrorReads: true,
  mirrorWrites: true,
};
