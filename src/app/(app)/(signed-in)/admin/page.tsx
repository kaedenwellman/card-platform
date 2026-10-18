import { desc, eq, inArray } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db, hasDatabase } from "@/db";
import { profiles, reports, subscriptions } from "@/db/schema";
import { currentAdmin } from "@/lib/admin";
import { isValidSlug } from "@/lib/slugs";
import { AdminButton } from "./AdminButton";

export const metadata = { title: "Admin", robots: { index: false, follow: false } };

const label = "font-mono text-[11px] uppercase tracking-[0.22em] text-muted";
const when = (d: Date) => d.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });

type Profile = typeof profiles.$inferSelect;

type Sub = typeof subscriptions.$inferSelect;

function Site({ p, subs }: { p: Profile; subs: Sub[] }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-baseline gap-x-3">
        <span className="font-bold">{p.name}</span>
        <a href={`/${p.slug}`} target="_blank" rel="noopener" className="text-sm text-gold underline underline-offset-4">
          /{p.slug}
        </a>
        <span className="text-sm text-muted">
          {p.status}
          {p.status === "removed" && p.removedAt ? ` ${when(p.removedAt)} (was ${p.removedFromStatus ?? "?"})` : ""}
        </span>
      </div>
      {subs
        .filter((s) => s.profileId === p.id)
        .map((s) => (
          <span key={s.id} className="text-xs text-muted">
            Stripe {s.stripeCustomerId} · {s.status}
          </span>
        ))}
    </div>
  );
}

function Actions({ p }: { p: Profile }) {
  return p.status === "removed" ? (
    <AdminButton action="restore" id={p.id} label="Restore" confirmText={`Put /${p.slug} back online?`} />
  ) : (
    <AdminButton
      action="takeDown"
      id={p.id}
      label="Take down"
      danger
      confirmText={`Take down /${p.slug}? The page and its QR code stop working and the owner is emailed.`}
    />
  );
}

// Reports inbox and takedowns. Only visible to ADMIN_EMAILS; everyone else gets a 404.
export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
  if (!hasDatabase() || !(await currentAdmin())) notFound();
  const { site } = await searchParams;
  const lookup = typeof site === "string" ? site.trim().toLowerCase().replace(/^.*\//, "") : "";

  const open = await db()
    .select({ report: reports, profile: profiles })
    .from(reports)
    .innerJoin(profiles, eq(profiles.id, reports.profileId))
    .where(eq(reports.status, "open"))
    .orderBy(desc(reports.createdAt))
    .limit(200);
  const byProfile = new Map<string, { profile: Profile; items: (typeof open)[number]["report"][] }>();
  for (const row of open) {
    const g = byProfile.get(row.profile.id) ?? { profile: row.profile, items: [] };
    g.items.push(row.report);
    byProfile.set(row.profile.id, g);
  }
  const removed = await db().select().from(profiles).where(eq(profiles.status, "removed")).orderBy(desc(profiles.removedAt)).limit(50);
  const [found] = lookup && isValidSlug(lookup) ? await db().select().from(profiles).where(eq(profiles.slug, lookup)).limit(1) : [];

  const ids = [...byProfile.keys(), ...removed.map((p) => p.id), ...(found ? [found.id] : [])];
  const subs = ids.length ? await db().select().from(subscriptions).where(inArray(subscriptions.profileId, ids)) : [];

  return (
    <section className="flex flex-col gap-10">
      <header>
        <h1 className="text-3xl font-extrabold [font-stretch:112%]">Admin</h1>
        <p className="mt-2 text-sm text-muted">
          Reports and takedowns. Taking a page down doesn&apos;t touch billing: cancel or refund in Stripe if needed.
        </p>
      </header>

      <form className="flex flex-wrap gap-3" action="/admin">
        <input
          name="site"
          defaultValue={lookup}
          placeholder="Find a site by address, e.g. jane-smith"
          className="min-w-0 flex-1 rounded-sm border border-line bg-transparent px-3 py-2 outline-none focus:border-muted"
        />
        <button className="rounded-sm border border-line px-4 py-2 hover:border-muted">Find</button>
      </form>
      {lookup && (
        <div className="-mt-6 border-b border-line pb-6">
          {found ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Site p={found} subs={subs} />
              <Actions p={found} />
            </div>
          ) : (
            <p className="text-sm text-muted">No site at /{lookup}.</p>
          )}
        </div>
      )}

      <div className="flex flex-col gap-4">
        <h2 className={label}>Open reports ({open.length})</h2>
        {byProfile.size === 0 && <p className="text-sm text-muted">Nothing to review.</p>}
        <ul className="border-t border-line">
          {[...byProfile.values()].map(({ profile: p, items }) => (
            <li key={p.id} className="flex flex-col gap-4 border-b border-line py-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <Site p={p} subs={subs} />
                <Actions p={p} />
              </div>
              <ul className="flex flex-col gap-3 border-l-2 border-line pl-4">
                {items.map((r) => (
                  <li key={r.id} className="flex flex-col gap-1 text-sm">
                    <span>
                      <b>{r.reason}</b> <span className="text-muted">· {when(r.createdAt)}</span>
                    </span>
                    {r.details && <span className="whitespace-pre-wrap text-ink/80">{r.details}</span>}
                    <span className="text-muted">{r.reporterEmail ? `From ${r.reporterEmail}` : "Anonymous"}</span>
                    <span>
                      <AdminButton action="dismissReport" id={r.id} label="Dismiss" />
                    </span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-4">
        <h2 className={label}>Taken down ({removed.length})</h2>
        {removed.length === 0 && <p className="text-sm text-muted">None.</p>}
        <ul className="border-t border-line">
          {removed.map((p) => (
            <li key={p.id} className="flex flex-col gap-3 border-b border-line py-4 sm:flex-row sm:items-center sm:justify-between">
              <Site p={p} subs={subs} />
              <Actions p={p} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
