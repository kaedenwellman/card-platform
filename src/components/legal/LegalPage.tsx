import type { ReactNode } from "react";
import { LEGAL } from "@/lib/legal";

// Shared layout for /terms and /privacy: plain, readable, one column.
export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="mx-auto flex max-w-2xl flex-col gap-8 pb-8">
      <header>
        <h1 className="text-3xl font-extrabold [font-stretch:112%]">{title}</h1>
        <p className="mt-2 text-sm text-muted">Effective {LEGAL.effectiveDate}</p>
        {LEGAL.DRAFT && (
          <p className="mt-4 border-l-2 border-gold pl-3 text-sm text-muted">
            Draft. This page is being finalized before launch and isn&apos;t legal advice. Bracketed items are still to be
            filled in.
          </p>
        )}
      </header>
      <div className="flex flex-col gap-8 text-[15px] leading-relaxed text-[#CFCCC6] [&_a]:text-ink [&_a]:underline [&_strong]:text-ink">
        {children}
      </div>
    </article>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-bold text-ink">{title}</h2>
      {children}
    </section>
  );
}

export function List({ items }: { items: ReactNode[] }) {
  return (
    <ul className="list-disc space-y-1.5 pl-5">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}
