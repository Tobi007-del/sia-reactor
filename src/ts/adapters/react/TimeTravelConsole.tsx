import { useRef } from "react";
import { TimeTravelModule } from "@modules/timeTravel";
import { type TimeTravelConsoleConfig, TimeTravelConsole as VTimeTravelConsole } from "../vanilla/TimeTravelConsole";
import { useISOLayoutEffect } from "./utils";

/** React props for controlling the vanilla TimeTravel overlay. */
export interface TimeTravelConsoleProps extends Partial<TimeTravelConsoleConfig> {
  /** Module instance controlled by this overlay bridge. */
  time: TimeTravelModule<any, any>;
}

/**
 - React bridge for mounting and controlling a vanilla TimeTravelConsole instance.
 - Instantiates a `TimeTravelConsole` for the provided module, tears it down on unmount, and syncs prop changes into reactive `config`.
 * Use this when your app is React but you want the overlay behavior with react-safe instance lifecycle management.
 * @param props Overlay bridge props.
 */
export function TimeTravelConsole(props: TimeTravelConsoleProps) {
  const vRef = useRef<VTimeTravelConsole | null>(null),
    { time, title, color, devOnly, startOpen, container } = props;

  useISOLayoutEffect(() => {
    vRef.current = new VTimeTravelConsole(time, props);
    return () => void (vRef.current?.destroy(), (vRef.current = null));
  }, [time]);
  useISOLayoutEffect(() => void (vRef.current && (title !== undefined && (vRef.current.config.title = title), (vRef.current.config.color = color!), (vRef.current.config.devOnly = devOnly!), (vRef.current.config.container = container!), (vRef.current.state.open = startOpen!))), [title, color, devOnly, container, startOpen]);

  return null;
}
