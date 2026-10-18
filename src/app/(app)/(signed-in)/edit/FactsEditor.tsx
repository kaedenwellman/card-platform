"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateFacts } from "@/lib/actions";
import { fieldClass } from "./EntryForm";

type Fact = { label: string; value: string; detail: string };
const empty = (): Fact => ({ label: "", value: "", detail: "" });

// Up to four stat boxes (e.g. Major / Computer Engineering, GPA / 3.8). Shown on the Profile layout.
export function FactsEditor({ initial }: { initial: { label: string; value: string; detail?: string }[] }) {
  const router = useRouter();
  const [facts, setFacts] = useState<Fact[]>(initial.map((f) => ({ ...f, detail: f.detail ?? "" })));
  const [saving, start] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const set = (i: number, key: keyof Fact, value: string) => {
    setFacts((fs) => fs.map((f, j) => (j === i ? { ...f, [key]: value } : f)));
    setMessage(null);
  };

  const save = () =>
    start(async () => {
      const res = await updateFacts(facts);
      setMessage(res.ok ? { ok: true, text: "Saved." } : { ok: false, text: res.error });
      if (res.ok) {
        setFacts((fs) => fs.filter((f) => f.label || f.value || f.detail));
        router.refresh();
      }
    });

  return (
    <div className="flex flex-col gap-4">
      {facts.length === 0 && <p className="text-sm text-muted">No key facts yet.</p>}
      {facts.map((f, i) => (
        <fieldset key={i} className="grid gap-2 border-b border-line pb-4 sm:grid-cols-[1fr_1fr_1.4fr_auto] sm:items-end">
          <legend className="sr-only">Fact {i + 1}</legend>
          <label className="flex flex-col gap-1 text-sm text-muted">
            Label
            <input className={fieldClass} value={f.label} maxLength={24} placeholder="GPA" onChange={(e) => set(i, "label", e.target.value)} />
          </label>
          <label className="flex flex-col gap-1 text-sm text-muted">
            Value
            <input className={fieldClass} value={f.value} maxLength={60} placeholder="3.8" onChange={(e) => set(i, "value", e.target.value)} />
          </label>
          <label className="flex flex-col gap-1 text-sm text-muted">
            Detail (optional)
            <input className={fieldClass} value={f.detail} maxLength={80} placeholder="Dean's List" onChange={(e) => set(i, "detail", e.target.value)} />
          </label>
          <button
            type="button"
            onClick={() => {
              setFacts((fs) => fs.filter((_, j) => j !== i));
              setMessage(null);
            }}
            className="justify-self-start text-sm text-muted underline underline-offset-4 hover:text-ink sm:self-end sm:pb-3"
          >
            Remove
          </button>
        </fieldset>
      ))}
      <div className="flex flex-wrap items-center gap-4">
        {facts.length < 4 && (
          <button type="button" onClick={() => setFacts((fs) => [...fs, empty()])} className="border border-line px-4 py-2 text-sm hover:border-muted">
            Add a fact
          </button>
        )}
        <button type="button" onClick={save} disabled={saving} className="bg-ink px-5 py-2 text-sm font-bold text-bg hover:bg-gold hover:text-white disabled:opacity-60">
          {saving ? "Saving…" : "Save facts"}
        </button>
        {message && <span className={`text-sm ${message.ok ? "text-muted" : "text-red-700"}`}>{message.text}</span>}
      </div>
    </div>
  );
}
