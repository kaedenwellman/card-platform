"use client";

import { useState, useTransition } from "react";
import { setHiddenFromSearch } from "@/lib/actions";

// "Hide from Google": a checkbox that saves as soon as it changes.
export function SearchToggle({ initial }: { initial: boolean }) {
  const [hidden, setHidden] = useState(initial);
  const [saving, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const change = (next: boolean) => {
    setHidden(next);
    setError(null);
    start(async () => {
      try {
        await setHiddenFromSearch(next);
      } catch {
        setHidden(!next);
        setError("Couldn't save that. Try again.");
      }
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={hidden}
          onChange={(e) => change(e.target.checked)}
          className="mt-1 h-4 w-4 accent-[var(--color-ink)]"
        />
        <span>
          Hide my site from Google and other search engines
          <span className="mt-1 block text-sm text-muted">
            Your site stays public: anyone with your link or QR code can still open it. It just won&apos;t show up in search
            results. Changes can take a few days to show in search.
          </span>
        </span>
      </label>
      <p aria-live="polite" className="min-h-5 text-sm text-muted">
        {saving ? "Saving…" : error ? <span className="text-red-700">{error}</span> : null}
      </p>
    </div>
  );
}
