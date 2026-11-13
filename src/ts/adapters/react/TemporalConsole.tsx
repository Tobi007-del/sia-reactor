import { useRef } from "react";
import { TemporalModule } from "@modules/temporal";
import { type TemporalConsoleConfig, TemporalConsole as VTemporalConsole } from "../vanilla/TemporalConsole";
import { useISOLayoutEffect } from "./utils";

/** React props for controlling the vanilla Temporal overlay. */
export interface TemporalConsoleProps extends Partial<TemporalConsoleConfig> {
  /** Module instance controlled by this overlay bridge. */
  module: TemporalModule<any, any>;
}

/**
 - React bridge for mounting and controlling a vanilla TemporalConsole instance.
 - Instantiates a `TemporalConsole` for the provided module, tears it down on unmount, and syncs prop changes into reactive `config`.
 * Use this when your app is React but you want the overlay behavior with react-safe instance lifecycle management.
 * @param props Overlay bridge props.
 */
export function TemporalConsole(props: TemporalConsoleProps) {
  const vRef = useRef<VTemporalConsole | null>(null),
    { module, title, color, devOnly, startOpen, container } = props;

  useISOLayoutEffect(() => {
    vRef.current = new VTemporalConsole(module, props);
    return () => void (vRef.current?.destroy(), (vRef.current = null));
  }, [module]);
  useISOLayoutEffect(() => void (vRef.current && (title !== undefined && (vRef.current.config.title = title), (vRef.current.config.color = color!), (vRef.current.config.devOnly = devOnly!), (vRef.current.config.container = container!), (vRef.current.state.open = startOpen!))), [title, color, devOnly, container, startOpen]);

  return null;
}
