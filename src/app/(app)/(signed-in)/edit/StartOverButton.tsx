"use client";

import { useState, useTransition } from "react";
import { startOver } from "@/lib/actions";

// Deletes an unpublished draft and returns to /create. Only shown for drafts.
export function StartOverButton() {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const go = () => {
    if (!confirm("Delete this draft and start over? Your entries, photos, and design choices will be removed.")) return;
    start(async () => {
      // On success the action redirects to /create.
      const res = await startOver().catch(() => ({ ok: false as const, error: "Couldn't delete the draft. Try again." }));
      if (res && !res.ok) setError(res.error);
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-4">
      <button type="button" onClick={go} disabled={pending} className="border border-red-700/60 px-4 py-2 text-sm text-red-700 hover:border-red-700 disabled:opacity-50">
        {pending ? "Deleting…" : "Start over"}
      </button>
      {error && <span className="text-sm text-red-700">{error}</span>}
    </div>
  );
}
