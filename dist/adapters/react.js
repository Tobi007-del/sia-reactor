import {
  Autotracker,
  TimeTravelOverlay,
  withTracker
} from "../chunk-MWC3R7QL.js";
import {
  getReactor
} from "../chunk-3UHI7CNE.js";
import "../chunk-5A44QFT6.js";
import "../chunk-P37ADJMM.js";
import {
  CTX,
  NIL,
  NOOP,
  getAny
} from "../chunk-EZ4VRGYI.js";

// src/ts/adapters/react/hooks/useReactor.ts
import { useRef, useCallback, useSyncExternalStore, useMemo } from "react";

// src/ts/adapters/react/utils.ts
import { useLayoutEffect, useEffect } from "react";
var useISOLayoutEffect = "undefined" !== typeof window ? useLayoutEffect : useEffect;

// src/ts/adapters/react/hooks/useReactor.ts
function useReactor(target, options = NIL, build) {
  const versionRef = useRef(0), tgtRef = useRef(), rtrRef = useRef(), rtr = tgtRef.current !== target || !rtrRef.current ? (tgtRef.current = target, rtrRef.current = getReactor(target, true, build)) : rtrRef.current, atrkrRef = useRef(), prevTrkr = CTX.autotracker, atrkr = CTX.autotracker = atrkrRef.current ||= new Autotracker(), optsRef = useRef(options), notifyRef = useRef(NOOP);
  optsRef.current = options;
  atrkr.unblock(rtr), queueMicrotask(() => CTX.autotracker === atrkr && (CTX.autotracker = prevTrkr));
  const subscribe = useCallback((notify) => atrkr.callback(notifyRef.current = () => (versionRef.current++, notify())), [atrkr]);
  const getSnapshot = useCallback(() => versionRef.current, []);
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return useISOLayoutEffect(() => (CTX.autotracker = prevTrkr, atrkr.callback(notifyRef.current, optsRef.current)), [atrkr]), rtr.core;
}
function useAnyReactor(options = NIL) {
  const versionRef = useRef(0), atrkrRef = useRef(), prevTrkr = CTX.autotracker, atrkr = CTX.autotracker = atrkrRef.current ||= new Autotracker(), optsRef = useRef(options), notifyRef = useRef(NOOP);
  optsRef.current = options;
  atrkr.unblock(), queueMicrotask(() => CTX.autotracker === atrkr && (CTX.autotracker = prevTrkr));
  const subscribe = useCallback((notify) => atrkr.callback(notifyRef.current = () => (versionRef.current++, notify())), [atrkr]);
  const getSnapshot = useCallback(() => versionRef.current, []);
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  useISOLayoutEffect(() => (CTX.autotracker = prevTrkr, atrkr.callback(notifyRef.current, optsRef.current)), [atrkr]);
}
function useReactorSnapshot(target, options, build = { referenceTracking: true, smartCloning: true }) {
  const tgtRef = useRef(), rtrRef = useRef(), rtr = tgtRef.current !== target || !rtrRef.current ? (tgtRef.current = target, rtrRef.current = getReactor(target, true, build)) : rtrRef.current, atrkrRef = useRef(), atrkrRtrRef = useRef(), atrkr = atrkrRtrRef.current !== rtr || !atrkrRef.current ? (atrkrRtrRef.current = rtr, atrkrRef.current = new Autotracker(rtr)) : atrkrRef.current, notifyRef = useRef(NOOP), optsRef = useRef(options);
  rtr.config.referenceTracking = rtr.config.smartCloning = true;
  optsRef.current = options;
  const subscribe = useCallback((notify) => (atrkr.callback(notifyRef.current = notify, optsRef.current), () => atrkr.cleanup()), [atrkr]);
  const getSnapshot = () => rtr.snapshot();
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const proxy = useMemo(() => atrkr.tracked(snapshot), [atrkr, snapshot]);
  return useISOLayoutEffect(() => atrkr.callback(notifyRef.current, optsRef.current), [atrkr, proxy]), proxy;
}

// src/ts/adapters/react/hooks/useSelector.ts
import { useSyncExternalStore as useSyncExternalStore2, useRef as useRef2, useCallback as useCallback2 } from "react";
function useSelector(target, sel, eq = Object.is, options = NIL, build) {
  const rtrRef = useRef2(), tgtRef = useRef2(), rtr = tgtRef.current !== target || !rtrRef.current ? (tgtRef.current = target, rtrRef.current = getReactor(target, true, build)) : rtrRef.current, atrkrRef = useRef2(), atrkr = atrkrRef.current ||= new Autotracker(), notifyRef = useRef2(NOOP), sliceRef = useRef2(), selRef = useRef2(sel), eqRef = useRef2(eq), optsRef = useRef2(options);
  selRef.current = sel, eqRef.current = eq, optsRef.current = options;
  const subscribe = useCallback2((notify) => atrkr.callback(notifyRef.current = notify, optsRef.current), [atrkr]);
  const getSnapshot = useCallback2(() => {
    const next = withTracker(atrkr, () => selRef.current(rtr.core), rtr);
    return eqRef.current(sliceRef.current, next) ? sliceRef.current : sliceRef.current = next;
  }, [atrkr, rtr]);
  const slice = useSyncExternalStore2(subscribe, getSnapshot, getSnapshot);
  return useISOLayoutEffect(() => atrkr.callback(notifyRef.current, optsRef.current), [atrkr, slice]), slice;
}
function useAnySelector(sel, eq = Object.is, options = NIL) {
  const atrkrRef = useRef2(), atrkr = atrkrRef.current ||= new Autotracker(), notifyRef = useRef2(NOOP), sliceRef = useRef2(), selRef = useRef2(sel), eqRef = useRef2(eq), optsRef = useRef2(options);
  selRef.current = sel, eqRef.current = eq, optsRef.current = options;
  const subscribe = useCallback2((notify) => atrkr.callback(notifyRef.current = notify, optsRef.current), [atrkr]);
  const getSnapshot = useCallback2(() => {
    const next = withTracker(atrkr, () => selRef.current());
    return eqRef.current(sliceRef.current, next) ? sliceRef.current : sliceRef.current = next;
  }, [atrkr]);
  const slice = useSyncExternalStore2(subscribe, getSnapshot, getSnapshot);
  return useISOLayoutEffect(() => atrkr.callback(notifyRef.current, optsRef.current), [atrkr, slice]), slice;
}
function useSelectorSnapshot(target, sel, eq = Object.is, options, build = { referenceTracking: true, smartCloning: true }) {
  const tgtRef = useRef2(), rtrRef = useRef2(), rtr = tgtRef.current !== target || !rtrRef.current ? (tgtRef.current = target, rtrRef.current = getReactor(target, true, build)) : rtrRef.current, atrkrRef = useRef2(), atrkrRtrRef = useRef2(), atrkr = atrkrRtrRef.current !== rtr || !atrkrRef.current ? (atrkrRtrRef.current = rtr, atrkrRef.current = new Autotracker(rtr)) : atrkrRef.current, notifyRef = useRef2(NOOP), sliceRef = useRef2(), selRef = useRef2(sel), eqRef = useRef2(eq), optsRef = useRef2(options);
  rtr.config.referenceTracking = rtr.config.smartCloning = true;
  optsRef.current = options, selRef.current = sel, eqRef.current = eq;
  const subscribe = useCallback2((notify) => (atrkr.callback(notifyRef.current = notify, optsRef.current), () => atrkr.cleanup()), [atrkr]);
  const getSnapshot = useCallback2(() => {
    const next = selRef.current(atrkr.tracked(rtr.snapshot()));
    return eqRef.current(sliceRef.current, next) ? sliceRef.current : sliceRef.current = next;
  }, [atrkr]);
  const slice = useSyncExternalStore2(subscribe, getSnapshot, getSnapshot);
  return useISOLayoutEffect(() => atrkr.callback(notifyRef.current, optsRef.current), [atrkr, slice]), slice;
}

// src/ts/adapters/react/hooks/usePath.ts
import { useRef as useRef3, useSyncExternalStore as useSyncExternalStore3, useCallback as useCallback3 } from "react";
function usePath(target, path, options = NIL, build) {
  const versionRef = useRef3(0), tgtRef = useRef3(), rtrRef = useRef3(), rtr = tgtRef.current !== target || !rtrRef.current ? (tgtRef.current = target, rtrRef.current = getReactor(target, true, build)) : rtrRef.current, optsRef = useRef3(options);
  optsRef.current = options;
  const subscribe = useCallback3((notify) => rtr[optsRef.current.sync ? "watch" : "on"](path, () => (versionRef.current++, notify()), optsRef.current), [rtr, path]);
  const getSnapshot = useCallback3(() => versionRef.current, []);
  useSyncExternalStore3(subscribe, getSnapshot, getSnapshot);
  return getAny(rtr.core, path);
}

// src/ts/adapters/react/TimeTravelOverlay.tsx
import { useRef as useRef4 } from "react";
function TimeTravelOverlay2(props) {
  const vRef = useRef4(null), { time, title, color, devOnly, startOpen, container } = props;
  useISOLayoutEffect(() => {
    vRef.current = new TimeTravelOverlay(time, props);
    return () => void (vRef.current?.destroy(), vRef.current = null);
  }, [time]);
  useISOLayoutEffect(() => void (vRef.current && (title !== void 0 && (vRef.current.config.title = title), vRef.current.config.color = color, vRef.current.config.devOnly = devOnly, vRef.current.config.container = container, vRef.current.state.open = startOpen)), [title, color, devOnly, container, startOpen]);
  return null;
}
export {
  TimeTravelOverlay2 as TimeTravelOverlay,
  useAnyReactor,
  useAnySelector,
  useISOLayoutEffect,
  usePath,
  useReactor,
  useReactorSnapshot,
  useSelector,
  useSelectorSnapshot
};
