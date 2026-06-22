import { TimeTravelConfig } from "./types";
import { NOOP } from "@core/consts";

export const TIME_TRAVEL_MODULE_BUILD: Partial<TimeTravelConfig<any>> = {
  limit: 1000000000,
  playbackRate: 1,
  maxPlaybackDelay: 2000,
  mirrorReads: true,
  mirrorWrites: true,
  onApply: NOOP,
};
