"use client";

import { useActionState } from "react";
import { submitReport, type ReportState } from "@/lib/report-actions";
import { REPORT_REASONS } from "@/lib/reports";

const field = "w-full border border-line bg-transparent px-3 py-2.5 text-base outline-none focus:border-muted";

export function ReportForm({ slug }: { slug: string }) {
  const [state, action, pending] = useActionState<ReportState, FormData>(submitReport, null);

  if (state?.ok) {
    return (
      <p className="border-l-2 border-gold pl-3 text-muted">
        Thanks. We&apos;ll review this page and take it down if it breaks our rules.
      </p>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="slug" value={slug} />
      {/* Honeypot: people never see or fill this. */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm text-muted">What&apos;s wrong with this page?</legend>
        {REPORT_REASONS.map((r) => (
          <label key={r} className="flex items-center gap-3 border border-line px-3 py-2.5 has-[:checked]:border-gold">
            <input type="radio" name="reason" value={r} required className="accent-[var(--color-gold)]" />
            {r}
          </label>
        ))}
      </fieldset>
      <label className="flex flex-col gap-1 text-sm text-muted">
        Details (optional)
        <textarea name="details" rows={4} maxLength={2000} className={field} placeholder="What should we look at?" />
      </label>
      <label className="flex flex-col gap-1 text-sm text-muted">
        Your email (optional, only if you want a reply)
        <input type="email" name="email" maxLength={200} className={field} autoComplete="email" />
      </label>
      {state?.error && <p className="text-sm text-red-700">{state.error}</p>}
      <button type="submit" disabled={pending} className="self-start bg-ink px-6 py-3 font-bold text-bg hover:bg-gold hover:text-white disabled:opacity-60">
        {pending ? "Sending…" : "Send report"}
      </button>
    </form>
  );
}
