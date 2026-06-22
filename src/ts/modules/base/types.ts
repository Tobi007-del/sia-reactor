import { Reactor } from "@defs/reactor";
import { Paths } from "@defs/obj";
import { BaseReactorModule } from ".";

export type ReactorModuleId = string | number;

export type ModulePaths<P extends string = string> = P[] | Partial<Record<string, P[]>>;

export interface ReactorModulePathConfig<T extends object, P extends Paths<T> = Paths<T>> {
  /** Whether the module is disabled and history cleared */
  disabled: boolean;
  /** Whitelist paths only, no need for "*"; instead don't pass anything.
   * - `P[]`: one shared path list for all attached reactors.
   * - `Record<string, P[]>`: per-reactor path lists keyed by module reactor id. If you don't pass ids in `.attach()`, use index keys following attachment order (`"0"`, `"1"`, ...). */
  whitelist: ModulePaths<P>;
  /** Exclude filter for save-trigger paths. Checked only during save events to avoid structural snapshot bugs but deletes paths safely before hydration where applicable. */
  blacklist: ModulePaths<P>;
  /** Whether to process events synchronously using `.watch()` instead of the default `.on()`. Usecases include input value updates among others. */
  synchronous: boolean;
  /** - `false`: use live proxied roots (fastest, adapter must handle proxies). (Default).
   * - `true`,`"auto"`: use `Reactor.snapshot()`, `true` force-enables `Reactor.config.referenceTracking`+`Reactor.config.smartCloning` for better performance. */
  snapshot: boolean | "auto";
  /** Whether to mirror read paths from "intent" to "state" for accuracy and physical truth. @default  `true`. */
  mirrorReads: boolean;
  /** Whether to mirror write paths from "state" to "intent" during operations. @default  `true`. */
  mirrorWrites: boolean;
}

export interface ReactorModuleConstructor<P extends BaseReactorModule = BaseReactorModule, T extends object = any> {
  new (rtr: Reactor<T>, config: any): P;
  moduleName: string;
}
