"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

// Minimal typing for the Web Speech API (not in TypeScript's DOM lib).
type SpeechResult = { isFinal: boolean; 0: { transcript: string } };
type SpeechEvent = { resultIndex: number; results: ArrayLike<SpeechResult> };
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: SpeechEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  start(): void;
  stop(): void;
};
type RecognitionCtor = new () => Recognition;

const noop = () => () => {};

function getRecognition(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

// A textarea with a microphone button that types what you say, using the browser's built-in
// speech recognition. Where that isn't available, the phone keyboard's dictation key still works.
export function VoiceTextarea({
  value,
  onChange,
  placeholder,
  rows = 6,
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  id?: string;
}) {
  // false on the server, the real answer in the browser.
  const supported = useSyncExternalStore(noop, () => Boolean(getRecognition()), () => false);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const rec = useRef<Recognition | null>(null);
  const latest = useRef(value);
  useEffect(() => {
    latest.current = value;
  }, [value]);

  useEffect(() => () => rec.current?.stop(), []);

  const toggle = () => {
    if (listening) {
      rec.current?.stop();
      return;
    }
    const Ctor = getRecognition();
    if (!Ctor) return;
    const r = new Ctor();
    r.lang = navigator.language || "en-US";
    r.continuous = true;
    r.interimResults = true;
    r.onresult = (e) => {
      let finalText = "";
      let pending = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) finalText += res[0].transcript;
        else pending += res[0].transcript;
      }
      if (finalText) {
        const cur = latest.current;
        onChange((cur && !/\s$/.test(cur) ? cur + " " : cur) + finalText.trim());
      }
      setInterim(pending);
    };
    r.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") setError("Microphone access is blocked. Allow it in your browser settings, or type instead.");
      else if (e.error !== "no-speech" && e.error !== "aborted") setError("Voice input stopped. Tap the mic to try again.");
    };
    r.onend = () => {
      setListening(false);
      setInterim("");
    };
    setError(null);
    rec.current = r;
    r.start();
    setListening(true);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          className="w-full resize-y rounded-sm border border-line bg-transparent p-3 pb-14 text-base leading-relaxed outline-none focus:border-muted"
        />
        {supported && (
          <button
            type="button"
            onClick={toggle}
            aria-pressed={listening}
            className={`absolute bottom-3 right-3 flex items-center gap-2 rounded-sm border px-3 py-2 text-sm ${
              listening ? "border-red-400 text-red-300" : "border-line text-ink hover:border-muted"
            }`}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <rect x="9" y="3" width="6" height="11" rx="3" />
              <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
            </svg>
            {listening ? "Stop" : "Talk"}
          </button>
        )}
      </div>
      <p aria-live="polite" className="min-h-5 text-sm text-muted">
        {error ? (
          <span className="text-red-300">{error}</span>
        ) : listening ? (
          interim ? <span className="italic">{interim}</span> : "Listening…"
        ) : supported ? (
          "Type, or tap Talk and say it."
        ) : (
          "Tip: on a phone, tap the microphone on your keyboard to talk instead of type."
        )}
      </p>
    </div>
  );
}
