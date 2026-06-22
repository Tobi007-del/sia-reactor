import { PersistConfig } from "./types";
import { NOOP } from "@core/consts";

export const PERSIST_MODULE_BUILD: Partial<PersistConfig<any>> = {
  disabled: false,
  key: "REACTOR_STORE",
  throttle: 2500,
  snapshot: false,
  mirrorReads: true,
  mirrorWrites: true,
  onSave: NOOP,
  strict: true,
};
