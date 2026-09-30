import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { hasDatabase } from "@/db";
import { ensureUser, getOwnedProfile } from "@/lib/owner";

export const metadata = { title: "Dashboard" };

type Action = { title: string; body: string; href: string; cta: string; enabled: boolean; note?: string; primary?: boolean };

// The three things a customer does: create (once), update the site, print the card.
export default async function DashboardPage() {
  const cu = await currentUser();
  const user = hasDatabase() ? await ensureUser() : null;
  const profile = user ? await getOwnedProfile(user.id) : null;
  const has = Boolean(profile);

  const actions: Action[] = [
    {
      title: "Create your website and business card",
      body: "Pick a layout, colors, and a card design, then upload your resume. We draft everything for you.",
      href: "/create",
      cta: has ? "Created" : "Get started",
      enabled: !has,
      note: has ? "Done. Each account gets one website and card." : undefined,
      primary: !has,
    },
    {
      title: "Update your website",
      body: "Review your draft, change the layout or colors, and see it at phone size.",
      href: "/edit",
      cta: "Update website",
      enabled: has,
      note: has ? undefined : "Create your website first.",
      primary: has,
    },
    {
      title: "Print my business card",
      body: "See your card, switch designs, and get the files and instructions for printing.",
      href: "/card",
      cta: "Print my card",
      enabled: has,
      note: has ? undefined : "Create your website first.",
    },
  ];

  return (
    <section className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-extrabold [font-stretch:112%]">Welcome{cu?.firstName ? `, ${cu.firstName}` : ""}</h1>
        {profile && (
          <p className="mt-2 text-muted">
            Your site: <span className="text-ink">/{profile.slug}</span>{" "}
            {profile.status === "draft" ? "(draft, not public yet)" : "(live)"}
          </p>
        )}
      </header>
      <div className="grid gap-4 md:grid-cols-3">
        {actions.map((a) => (
          <div
            key={a.title}
            className={`flex flex-col gap-3 rounded-xl border p-5 ${a.enabled ? "border-line" : "border-line/60 opacity-60"}`}
          >
            <h2 className="text-lg font-bold leading-snug">{a.title}</h2>
            <p className="flex-1 text-sm text-muted">{a.body}</p>
            {a.enabled ? (
              <Link
                href={a.href}
                className={`rounded-md px-5 py-3 text-center font-bold [font-stretch:110%] ${
                  a.primary ? "bg-gold text-black hover:bg-ink" : "border border-line hover:border-gold"
                }`}
              >
                {a.cta}
              </Link>
            ) : (
              <span aria-disabled="true" className="rounded-md border border-line px-5 py-3 text-center text-muted">
                {a.cta}
              </span>
            )}
            {a.note && <p className="text-xs text-muted">{a.note}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}
