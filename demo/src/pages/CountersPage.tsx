import { useEffect, useRef } from "react";
import { useAnyReactor, useAnySelector, usePath, useReactor, useSelector } from "@adapters/react";
import { effect } from "@adapters/vanilla";
import { decrementCount, incrementCount, resetCount, state, counterTime } from "../model";
import { TimeTravelConsole } from "@adapters/react";

function CounterCard({ label, count, renders }: { label: string; count: number; renders: number }) {
  return (
    <section className="counter-surface">
      <div className="title">{label}</div>
      <div className="count">{count}</div>
      <div className="row">
        <button onClick={decrementCount}>-1</button>
        <button onClick={incrementCount}>+1</button>
      </div>
      <div className="muted">renders: {renders}</div>
    </section>
  );
}

function ReactorCounter() {
  const s = useReactor(state),
    renders = useRef(0);
  return <CounterCard label="useReactor" count={s.count} renders={++renders.current} />;
}

function AnyReactorCounter() {
  useAnyReactor();
  const renders = useRef(0);
  return <CounterCard label="useAnyReactor" count={state.count} renders={++renders.current} />;
}

function ReactorSnapshotCounter() {
  const s = useReactor(state),
    renders = useRef(0);
  return <CounterCard label="useReactor" count={s.count} renders={++renders.current} />;
}

function SelectorCounter() {
  const count = useSelector(state, (s) => s.count),
    renders = useRef(0);
  return <CounterCard label="useSelector" count={count} renders={++renders.current} />;
}

function AnySelectorCounter() {
  const count = useAnySelector(() => state.count),
    renders = useRef(0);
  return <CounterCard label="useAnySelector" count={count} renders={++renders.current} />;
}

function SelectorSnapshotCounter() {
  const count = useSelector(state, (s) => s.count),
    renders = useRef(0);
  return <CounterCard label="useSelector" count={count} renders={++renders.current} />;
}

function PathCounter() {
  const count = usePath(state, "count"),
    renders = useRef(0);
  return <CounterCard label="usePath" count={count} renders={++renders.current} />;
}

function VanillaEffectPanel() {
  const valRef = useRef<HTMLDivElement | null>(null),
    runsRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    let runs = 0;
    return effect(() => {
      if (valRef.current) valRef.current.textContent = String(state.count);
      if (runsRef.current) runsRef.current.textContent = String(++runs);
    });
  }, []);

  return (
    <section className="panel">
      <h2>Vanilla JS Effect</h2>
      <div className="counter-surface">
        <div className="title">effect(() =&gt; ...)</div>
        <div className="count" ref={valRef}>
          {state.count}
        </div>
        <div className="muted">
          effect runs: <span ref={runsRef}>0</span>
        </div>
      </div>
    </section>
  );
}

export function CountersPage() {
  return (
    <section className="legacy-counters">
      <div className="wrap">
        <h1>SIA Reactor: Same Counter Through 5 Hooks</h1>
        <p className="meta">All cards bind to the same state.count. Interact with any card or global controls.</p>
        <div className="toolbar">
          <button onClick={decrementCount}>Global -1</button>
          <button onClick={incrementCount}>Global +1</button>
          <button onClick={resetCount}>Reset</button>
        </div>
        <div className="layout counters-grid">
          <section className="panel">
            <h2>React Hook Counters</h2>
            <div className="grid">
              <ReactorCounter />
              <AnyReactorCounter />
              <ReactorSnapshotCounter />
              <SelectorCounter />
              <AnySelectorCounter />
              <SelectorSnapshotCounter />
              <PathCounter />
            </div>
          </section>
          <VanillaEffectPanel />
        </div>
      </div>
      <TimeTravelConsole time={counterTime} title={"Counters Tape"} color={"var(--accent-2)"} startOpen={false} />
    </section>
  );
}
