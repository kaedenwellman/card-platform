import Link from "next/link";

type Step = { title: string; body: string; done: boolean; action?: { label: string; href: string } };

// A short setup tutorial at the top of the dashboard. Each step checks itself off from what the
// owner has actually done (site created, published, first QR scan), and the whole guide disappears
// once all four are done.
export function SetupGuide({ hasSite, published, scanned }: { hasSite: boolean; published: boolean; scanned: boolean }) {
  const steps: Step[] = [
    {
      title: "Make your site",
      body: "Pick a layout, colors, and a card design. Then upload your resume, or answer a few questions instead, and we draft your site from it.",
      done: hasSite,
      action: { label: "Start", href: "/create" },
    },
    {
      title: "Check every line",
      body: "The draft only uses what you gave us, but read it all. Fix wording, add photos, reorder entries, and pick your web address.",
      done: published,
      action: { label: "Update your website", href: "/edit" },
    },
    {
      title: "Publish",
      body: "Publishing makes your site public and switches on the QR code. You'll get an email when it's live.",
      done: published,
      action: { label: "Publish below", href: "#publish" },
    },
    {
      title: "Print and test your card",
      body: "Download your card, print one, and scan its QR code with your phone camera. This step checks itself off when that first scan comes through.",
      done: scanned,
      action: { label: "Print my business card", href: "/card" },
    },
  ];
  if (steps.every((s) => s.done)) return null;
  const current = steps.findIndex((s) => !s.done);
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <section aria-labelledby="setup-title" className="border border-line">
      <header className="flex items-baseline justify-between gap-4 border-b border-line px-4 py-3">
        <h2 id="setup-title" className="text-sm font-semibold uppercase tracking-[0.04em]">
          Getting set up
        </h2>
        <span className="text-sm text-muted">
          {doneCount} of {steps.length} done
        </span>
      </header>
      <ol>
        {steps.map((s, i) => {
          const isCurrent = i === current;
          return (
            <li
              key={s.title}
              className={`grid grid-cols-[2.25rem_1fr] gap-x-3 border-b border-l-4 border-line px-4 py-4 last:border-b-0 ${
                isCurrent ? "border-l-gold bg-white/60" : "border-l-transparent"
              }`}
              aria-current={isCurrent ? "step" : undefined}
            >
              <span
                className={`grid h-7 w-7 place-items-center border text-sm ${
                  s.done ? "border-ink bg-ink text-bg" : isCurrent ? "border-gold text-gold" : "border-line text-muted"
                }`}
                aria-hidden="true"
              >
                {s.done ? "✓" : i + 1}
              </span>
              <div className={s.done && !isCurrent ? "text-muted" : ""}>
                <p className={`font-semibold uppercase tracking-tight ${s.done ? "line-through decoration-1" : ""}`}>
                  {s.title}
                  <span className="sr-only">{s.done ? " (done)" : isCurrent ? " (next)" : ""}</span>
                </p>
                {!s.done && <p className={`mt-1 max-w-xl text-sm ${isCurrent ? "text-ink/80" : "text-muted"}`}>{s.body}</p>}
                {isCurrent && s.action && (
                  <Link href={s.action.href} className="mt-3 inline-block bg-ink px-4 py-2 text-sm font-bold text-bg hover:bg-gold hover:text-white">
                    {s.action.label} →
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
