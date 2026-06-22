import { useEffect, useRef } from "react";
import { state, heuristicChatTime as heuChatTime, rawChatTime } from "../model";
import { TimeTravelConsole, useReactor } from "@adapters/react";
import { keyEventAllowed } from "@utils/keys";
import { setValueWithCursor } from "@modules/timeTravel/heuristics";
import { effect } from "@src/ts/adapters/vanilla";

export function ChatPage() {
  const s = useReactor(state),
    heuRef = useRef<HTMLTextAreaElement>(null),
    rawRef = useRef<HTMLTextAreaElement>(null),
    composingRef = useRef(false),
    keySettings = { overrides: ["ctrl+z", "meta+z"], shortcuts: { undo: "ctrl+z", redo: ["ctrl+y", "ctrl+shift+z", "meta+shift+z"] }, blocks: [] },
    handleHeuKeyDown = (e: KeyboardEvent, action = keyEventAllowed(e as any, keySettings)) => (action === "undo" ? heuChatTime.undo() : action === "redo" && heuChatTime.redo()),
    handleRawKeyDown = (e: KeyboardEvent, action = keyEventAllowed(e as any, keySettings)) => (action === "undo" ? rawChatTime.undo() : action === "redo" && rawChatTime.redo());
  useEffect(() => {
    return effect(() => {
      const [text, start, end, dir] = s.heuristicChat;
      setValueWithCursor(heuRef.current, text, start, end, dir);
    });
  }, []);
  useEffect(() => {
    return effect(() => {
      const [text, start, end, dir] = s.rawChat;
      setValueWithCursor(rawRef.current, text, start, end, dir);
    });
  }, []);

  return (
    <section className="chat-stage">
      <div className="chat-shell">
        <div className="chat-header">
          <p className="eyebrow">Gemini-style prompt lab</p>
          <h1>Let the reactor capture the conversation.</h1>
          <p className="chat-note">
            Heuristics here means we bundle fast typing into fewer timeline entries. The setup is <strong>TimeTravelConfig.beforeEntry: createTextBundler()</strong>, and it keeps rapid input readable when you rewind or redo.
          </p>
        </div>
        <div className="composer-card">
          <div className="chat-input-grid">
            <div className="chat-input-panel">
              <div className="composer-topline">
                <span className="composer-badge">Heuristic input</span>
                <span className="composer-meta">Smart input with heuristics applied</span>
              </div>
              <textarea ref={heuRef} className="composer-input" defaultValue={s.heuristicChat[0]} onInput={({ target }, t = target as HTMLTextAreaElement) => !composingRef.current && (s.heuristicChat = [t.value, t.selectionStart, t.selectionEnd, t.selectionDirection])} onKeyDown={(e) => handleHeuKeyDown(e as any)} onCompositionStart={() => (composingRef.current = true)} onCompositionEnd={({ target }, t = target as HTMLTextAreaElement) => ((composingRef.current = false), (s.heuristicChat = [t.value, t.selectionStart, t.selectionEnd, t.selectionDirection]))} placeholder="Tracked input (heuristics applied) — try typing fast and press Ctrl+Z" rows={5} />
            </div>
            <div className="chat-input-panel">
              <div className="composer-topline">
                <span className="composer-badge">Raw input</span>
                <span className="composer-meta">Plain input without heuristics applied</span>
              </div>
              <textarea ref={rawRef} className="composer-input" defaultValue={s.rawChat[0]} onInput={({ target }, t = target as HTMLTextAreaElement) => !composingRef.current && (s.rawChat = [t.value, t.selectionStart, t.selectionEnd, t.selectionDirection])} onKeyDown={(e) => handleRawKeyDown(e as any)} onCompositionStart={() => (composingRef.current = true)} onCompositionEnd={({ target }, t = target as HTMLTextAreaElement) => ((composingRef.current = false), (s.rawChat = [t.value, t.selectionStart, t.selectionEnd, t.selectionDirection]))} placeholder="Raw input (no bundling) — try typing fast and press Ctrl+Z" rows={5} />
            </div>
          </div>
        </div>
        <div className="chat-console-grid">
          <div className="chat-console-slot">
            <TimeTravelConsole time={heuChatTime} title="Heuristic Tape" color={"var(--accent-2)"} startOpen={false} />
          </div>
          <div className="chat-console-slot">
            <TimeTravelConsole time={rawChatTime} title="Raw Tape" color={"var(--accent)"} startOpen={false} />
          </div>
        </div>
      </div>
    </section>
  );
}
