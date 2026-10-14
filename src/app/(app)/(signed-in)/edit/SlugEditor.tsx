"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateSlug } from "@/lib/actions";
import { fieldClass } from "./EntryForm";

// Picks the /{slug} part of the site's address.
export function SlugEditor({ initial, host, isLive }: { initial: string; host: string; isLive: boolean }) {
  const router = useRouter();
  const [slug, setSlug] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [saving, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const clean = (v: string) => v.toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 40);
  const changed = slug !== saved;

  const save = () =>
    start(async () => {
      setError(null);
      const res = await updateSlug(slug);
      if (!res.ok) return setError(res.error);
      setSlug(res.slug);
      setSaved(res.slug);
      router.refresh();
    });

  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm text-muted">
        <span className="sr-only">Web address</span>
        <span className="flex items-stretch">
          <span className="flex items-center rounded-l-sm border border-r-0 border-line px-3 text-sm text-muted">{host}/</span>
          <input
            className={`${fieldClass} min-w-0 flex-1 rounded-l-none`}
            value={slug}
            onChange={(e) => {
              setSlug(clean(e.target.value));
              setError(null);
            }}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            inputMode="url"
          />
        </span>
      </label>
      {isLive && changed && (
        <p className="text-sm text-muted">
          Your printed cards keep working. Links you&apos;ve shared with the old address ({host}/{saved}) will stop
          working.
        </p>
      )}
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={save}
          disabled={!changed || saving}
          className="rounded-sm bg-gold px-5 py-2 text-sm font-bold text-black hover:bg-ink disabled:opacity-40"
        >
          {saving ? "Saving…" : "Save address"}
        </button>
        {error && <span className="text-sm text-red-300">{error}</span>}
      </div>
    </div>
  );
}
