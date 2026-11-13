import { useEffect, useRef } from "react";
import { state, heuristicChatTemporal as heuChatTemporal, rawChatTemporal } from "../model";
import { TemporalConsole, useReactor } from "@adapters/react";
import { keyEventAllowed, KEYS_BLOCKS } from "@utils/keys";
import { setValueWithCursor } from "@modules/temporal/heuristics";
import { effect } from "@src/ts/adapters/vanilla";

export function ChatPage() {
  const s = useReactor(state),
    heuRef = useRef<HTMLTextAreaElement>(null),
    rawRef = useRef<HTMLTextAreaElement>(null),
    composingRef = useRef(false),
    keySettings = { shortcuts: { undo: ["ctrl+z", "cmd+z"], redo: ["ctrl+y", "ctrl+shift+z", "cmd+shift+z"] }, blocks: KEYS_BLOCKS },
    handleHeuKeyDown = (e: KeyboardEvent, action = keyEventAllowed(e as any, keySettings)) => action && heuChatTemporal[action](),
    handleRawKeyDown = (e: KeyboardEvent, action = keyEventAllowed(e as any, keySettings)) => action && rawChatTemporal[action]();
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
            Heuristics here means we bundle fast typing into fewer timeline entries. The setup is <strong>TemporalConfig.beforeEntry: createTextBundler()</strong>, and it keeps rapid input readable when you rewind or redo.
          </p>
        </div>
        <div className="composer-card">
          <div className="chat-input-grid">
            <div className="chat-input-panel">
              <div className="composer-topline">
                <span className="composer-badge">Heuristic input</span>
                <span className="composer-meta">Smart input with heuristics applied</span>
              </div>
              <textarea ref={heuRef} className="composer-input" defaultValue={s.heuristicChat[0]} onInput={({ target }, t = target as HTMLTextAreaElement) => !composingRef.current && (s.heuristicChat = [t.value, t.selectionStart, t.selectionEnd, t.selectionDirection])} onKeyDown={(e) => handleHeuKeyDown(e as any)} onCompositionStart={() => (composingRef.current = true)} onCompositionEnd={({ target }, t = target as HTMLTextAreaElement) => ((composingRef.current = false), (s.heuristicChat = [t.value, t.selectionStart, t.selectionEnd, t.selectionDirection]))} placeholder="Tracked input (heuristics applied): try typing fast and press Ctrl+Z" rows={5} />
            </div>
            <div className="chat-input-panel">
              <div className="composer-topline">
                <span className="composer-badge">Raw input</span>
                <span className="composer-meta">Plain input without heuristics applied</span>
              </div>
              <textarea ref={rawRef} className="composer-input" defaultValue={s.rawChat[0]} onInput={({ target }, t = target as HTMLTextAreaElement) => !composingRef.current && (s.rawChat = [t.value, t.selectionStart, t.selectionEnd, t.selectionDirection])} onKeyDown={(e) => handleRawKeyDown(e as any)} onCompositionStart={() => (composingRef.current = true)} onCompositionEnd={({ target }, t = target as HTMLTextAreaElement) => ((composingRef.current = false), (s.rawChat = [t.value, t.selectionStart, t.selectionEnd, t.selectionDirection]))} placeholder="Raw input (no bundling): try typing fast and press Ctrl+Z" rows={5} />
            </div>
          </div>
        </div>
        <div className="chat-console-grid">
          <div className="chat-console-slot">
            <TemporalConsole module={heuChatTemporal} title="Heuristic Tape" color={"var(--accent-2)"} startOpen={false} />
          </div>
          <div className="chat-console-slot">
            <TemporalConsole module={rawChatTemporal} title="Raw Tape" color={"var(--accent)"} startOpen={false} />
          </div>
        </div>
      </div>
    </section>
  );
}
