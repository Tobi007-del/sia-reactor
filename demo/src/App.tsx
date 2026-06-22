import { useEffect, useRef } from "react";
import { TimeTravelConsole, useReactor } from "@adapters/react";
import { createEl } from "@utils/dom";
import "@styles/time-travel-console.css";
import { AppNav } from "./components/AppNav";
import { hubTime, state, useRouteSync } from "./model";
import { ChatPage } from "./pages/ChatPage";
import { CountersPage } from "./pages/CountersPage";

export function App() {
  useRouteSync();
  const s = useReactor(state),
    topbarRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const topbar = topbarRef.current;
    if (!topbar) return;
    const sentinel = createEl("div", { ariaHidden: "true" }, undefined, { position: "absolute", top: "0", left: "0", width: "1px", height: "1px" });
    topbar.parentElement?.insertBefore(sentinel, topbar);
    const observer = new IntersectionObserver(([entry]) => topbar?.classList.toggle("is-stuck", !entry.isIntersecting), { threshold: 1 });
    observer.observe(sentinel);
    return () => (observer.disconnect(), sentinel.remove());
  }, []);

  return (
    <div className="demo-app">
      <TimeTravelConsole time={hubTime} title="Hub Tape" color={"var(--accent)"} startOpen={false} />
      <header ref={topbarRef} className="topbar">
        <div>
          <p className="eyebrow">SIA Reactor demo workspace</p>
          <h1>{s.page === "chat" ? "Gemini-style prompt" : "Counter lab"}</h1>
        </div>
        <AppNav currentPage={s.page} />
      </header>
      <main className="content">{s.page === "chat" ? <ChatPage /> : <CountersPage />}</main>
    </div>
  );
}
