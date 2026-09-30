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
      title: "Create website and business card",
      body: "Pick a layout, colors, and a card, then upload your resume.",
      href: "/create",
      cta: "Start",
      enabled: !has,
      note: has ? "Done. One per account." : undefined,
      primary: !has,
    },
    {
      title: "Update your website",
      body: "Change the layout or colors and check your content.",
      href: "/edit",
      cta: "Open",
      enabled: has,
      primary: has,
    },
    {
      title: "Print my business card",
      body: "Choose a card design and get it ready to print.",
      href: "/card",
      cta: "Open",
      enabled: has,
    },
  ];

  return (
    <section className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-extrabold [font-stretch:112%]">{cu?.firstName ? `Hi, ${cu.firstName}` : "Your account"}</h1>
        {profile && (
          <p className="mt-2 text-sm text-muted">
            /{profile.slug} · {profile.status === "draft" ? "draft, not public yet" : "live"}
          </p>
        )}
      </header>
      <ul className="border-t border-line">
        {actions.map((a) => (
          <li key={a.title} className="flex flex-col gap-3 border-b border-line py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className={a.enabled ? "" : "opacity-50"}>
              <h2 className="font-bold">{a.title}</h2>
              <p className="mt-1 text-sm text-muted">{a.note ?? a.body}</p>
            </div>
            {a.enabled ? (
              <Link
                href={a.href}
                className={`self-start rounded-sm px-5 py-2.5 text-center font-bold [font-stretch:110%] sm:self-auto ${
                  a.primary ? "bg-gold text-black hover:bg-ink" : "border border-line hover:border-muted"
                }`}
              >
                {a.cta}
              </Link>
            ) : (
              !has && <span className="text-sm text-muted">Create your website first</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
