import { useEffect } from "react";
import { reactive } from "@core/mixins";
import { IndexedDBAdapter, PersistModule, TemporalModule } from "@src/ts/modules";
import { createTextBundler } from "@modules/temporal/heuristics/text";

export type DemoPageId = "chat" | "counters";
export type DemoMessage = {
  id: number;
  role: "user" | "assistant";
  text: string;
};
export type Chat = [string, number, number, SelectionDirection];

export const demoPages: Array<{ id: DemoPageId; label: string; title: string; description: string }> = [
  {
    id: "chat",
    label: "Chatbox",
    title: "Gemini-style prompt",
    description: "Centered prompt box with live reactor state and time-travel controls.",
  },
  {
    id: "counters",
    label: "Counters",
    title: "Counter lab",
    description: "The original counter demo lives here so it stays intact and easy to find.",
  },
];

export const hubTemporal = new TemporalModule({ blacklist: ["heuristicChat", "rawChat", "count"] }).untrack();
export const heuristicChatTemporal = new TemporalModule({ whitelist: ["heuristicChat"], beforeEntry: createTextBundler({ toString: (v) => v[0] }) }).untrack();
export const rawChatTemporal = new TemporalModule({ whitelist: ["rawChat"] }).untrack();
export const counterTemporal = new TemporalModule({ whitelist: ["count"] }).untrack();

export const persist = new PersistModule({ key: "SIA_DEMO", adapter: new IndexedDBAdapter({ durability: "relaxed" }), snapshot: true, throttle: 150 }).attach(hubTemporal.state, "hubTemporal.state").attach(heuristicChatTemporal.state, "heuristicChatTemporal.state").attach(rawChatTemporal.state, "rawChatTemporal.state").attach(counterTemporal.state, "counterTemporal.state");

export const state = reactive({
  page: getInitialPage(),
  count: 0,
  heuristicChat: ["", 0, 0, "none"] as Chat,
  rawChat: ["", 0, 0, "none"] as Chat,
});

state.use(persist, "app").use(hubTemporal).use(heuristicChatTemporal).use(rawChatTemporal).use(counterTemporal), persist.state.once("hydrated", () => [hubTemporal, heuristicChatTemporal, rawChatTemporal, counterTemporal].forEach((mdle) => mdle.track()));

if (typeof window !== "undefined") ((window as any).state = state), ((window as any).persist = persist), ((window as any).hubTemporal = hubTemporal), ((window as any).heuristicChatTemporal = heuristicChatTemporal), ((window as any).rawChatTemporal = rawChatTemporal), ((window as any).counterTemporal = counterTemporal);

export function incrementCount() {
  state.count += 1;
}
export function decrementCount() {
  state.count -= 1;
}
export function resetCount() {
  state.count = 0;
}

export function getInitialPage(): DemoPageId {
  const hash = location.hash.replace(/^#\/?/, "") as DemoPageId;
  return demoPages.some((page) => page.id === hash) ? hash : "counters";
}
export function routeTo(page: DemoPageId) {
  location.hash = `#/${(state.page = page)}`;
}

export function useRouteSync() {
  const syncHash = () => {
    const next = `#/${state.page}`;
    location.hash !== next && history.replaceState(null, "", `${location.pathname}${location.search}${next}`);
  };

  useEffect(() => {
    const syncState = () => {
      const next = getInitialPage();
      if (state.page !== next) state.page = next;
    };
    syncState(), syncHash(), window.addEventListener("hashchange", syncState);
    return () => window.removeEventListener("hashchange", syncState);
  }, []);

  useEffect(syncHash, [state.page]);
}
