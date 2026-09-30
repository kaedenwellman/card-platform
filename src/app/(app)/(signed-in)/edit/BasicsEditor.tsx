"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { updateBasics } from "@/lib/actions";
import { fieldClass } from "./EntryForm";

type Basics = { name: string; headline: string; email: string; phone: string; linkedin: string; github: string; website: string };

const FIELDS: { key: keyof Basics; label: string; type?: string; placeholder?: string }[] = [
  { key: "name", label: "Name" },
  { key: "headline", label: "Headline", placeholder: "e.g. Nursing @ Riverside University · Student Nurses Association" },
  { key: "email", label: "Email", type: "email" },
  { key: "phone", label: "Phone (optional)", type: "tel" },
  { key: "linkedin", label: "LinkedIn (optional)", placeholder: "linkedin.com/in/you" },
  { key: "github", label: "GitHub (optional)", placeholder: "github.com/you" },
  { key: "website", label: "Website (optional)", placeholder: "yoursite.com" },
];

// The name, headline, and contact info at the top of the site.
export function BasicsEditor({ initial }: { initial: Basics }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [v, setV] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await updateBasics(v).catch(() => ({ ok: false as const, error: "Couldn't save. Try again." }));
    setBusy(false);
    if (!res.ok) return setError(res.error);
    setEditing(false);
    router.refresh();
  }

  if (!editing) {
    return (
      <div className="flex flex-col gap-1 text-sm">
        <p>{initial.headline || <span className="text-muted">No headline</span>}</p>
        <p className="text-muted">{[initial.email, initial.phone].filter(Boolean).join(" · ") || "No contact info"}</p>
        {(initial.linkedin || initial.github || initial.website) && (
          <p className="break-all text-muted">{[initial.linkedin, initial.github, initial.website].filter(Boolean).join(" · ")}</p>
        )}
        <button type="button" onClick={() => setEditing(true)} className="mt-2 self-start text-sm text-muted underline underline-offset-4 hover:text-ink">
          Edit
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid max-w-2xl gap-4 sm:grid-cols-2">
      {FIELDS.map((f) => (
        <label key={f.key} className={`flex flex-col gap-1.5 ${f.key === "headline" ? "sm:col-span-2" : ""}`}>
          <span className="text-sm">{f.label}</span>
          <input
            className={fieldClass}
            type={f.type ?? "text"}
            value={v[f.key]}
            placeholder={f.placeholder}
            onChange={(e) => setV((cur) => ({ ...cur, [f.key]: e.target.value }))}
          />
        </label>
      ))}
      <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
        <button type="submit" disabled={busy} className="rounded-sm bg-gold px-6 py-3 font-bold text-black [font-stretch:110%] hover:bg-ink disabled:opacity-60">
          {busy ? "Saving…" : "Save"}
        </button>
        <button type="button" onClick={() => { setV(initial); setEditing(false); }} className="rounded-sm border border-line px-6 py-3 hover:border-muted">
          Cancel
        </button>
        {error && <span className="text-sm text-red-300">{error}</span>}
      </div>
    </form>
  );
}
