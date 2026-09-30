"use client";

import { useState } from "react";

// POSTs to a Stripe route (checkout or portal) and follows the URL it returns.
export function StripeButton({
  endpoint,
  children,
  primary = false,
}: {
  endpoint: "/api/stripe/checkout" | "/api/stripe/portal";
  children: React.ReactNode;
  primary?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(endpoint, { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "Something went wrong. Try again.");
      window.location.href = data.url;
    } catch (err) {
      setBusy(false);
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    }
  }

  return (
    <span className="flex flex-col gap-1 sm:items-end">
      <button
        type="button"
        onClick={go}
        disabled={busy}
        className={`self-start rounded-sm px-5 py-2.5 text-center font-bold [font-stretch:110%] disabled:opacity-60 sm:self-auto ${
          primary ? "bg-gold text-black hover:bg-ink" : "border border-line hover:border-muted"
        }`}
      >
        {busy ? "Opening…" : children}
      </button>
      {error && <span className="text-sm text-red-300">{error}</span>}
    </span>
  );
}
