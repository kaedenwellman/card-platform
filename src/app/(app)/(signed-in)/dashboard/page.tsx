import { currentUser } from "@clerk/nextjs/server";
import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { StripeButton } from "@/components/billing/StripeButton";
import { db, hasDatabase } from "@/db";
import { subscriptions } from "@/db/schema";
import { ensureUser, getOwnedProfile } from "@/lib/owner";
import { paymentsConfigured, priceSummary } from "@/lib/stripe";

export const metadata = { title: "Dashboard" };

const linkBtn = (primary: boolean) =>
  `self-start rounded-sm px-5 py-2.5 text-center font-bold [font-stretch:110%] sm:self-auto ${
    primary ? "bg-gold text-black hover:bg-ink" : "border border-line hover:border-muted"
  }`;

function Row({ title, body, children, dim = false }: { title: string; body: React.ReactNode; children?: React.ReactNode; dim?: boolean }) {
  return (
    <li className="flex flex-col gap-3 border-b border-line py-5 sm:flex-row sm:items-center sm:justify-between">
      <div className={dim ? "opacity-50" : ""}>
        <h2 className="font-bold">{title}</h2>
        <p className="mt-1 text-sm text-muted">{body}</p>
      </div>
      {children}
    </li>
  );
}

export default async function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  const { paid } = await searchParams;
  const cu = await currentUser();
  const user = hasDatabase() ? await ensureUser() : null;
  const profile = user ? await getOwnedProfile(user.id) : null;
  const [sub] = profile
    ? await db().select().from(subscriptions).where(eq(subscriptions.profileId, profile.id)).orderBy(desc(subscriptions.currentPeriodEnd)).limit(1)
    : [];
  const prices = profile && profile.status !== "active" ? await priceSummary() : null;
  const renewsOn = sub?.currentPeriodEnd?.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return (
    <section className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-extrabold [font-stretch:112%]">{cu?.firstName ? `Hi, ${cu.firstName}` : "Your account"}</h1>
        {profile && (
          <p className="mt-2 text-sm text-muted">
            {profile.status === "active" ? (
              <>
                Live at{" "}
                <Link href={`/${profile.slug}`} className="text-ink underline underline-offset-4">
                  /{profile.slug}
                </Link>
              </>
            ) : profile.status === "lapsed" ? (
              `/${profile.slug} · paused`
            ) : (
              `/${profile.slug} · draft, not public yet`
            )}
          </p>
        )}
      </header>

      {paid === "1" && profile?.status === "draft" && (
        <p className="border-l-2 border-gold pl-3 text-sm">
          Payment received. Your site goes live in a few seconds. Refresh this page if it still says draft.
        </p>
      )}
      {paid === "1" && profile?.status === "active" && (
        <p className="border-l-2 border-gold pl-3 text-sm">You&apos;re live. Share your link or print your cards.</p>
      )}

      <ul className="border-t border-line">
        {!profile ? (
          <Row title="Create website and business card" body="Pick a layout, colors, and a card, then upload your resume.">
            <Link href="/create" className={linkBtn(true)}>
              Start
            </Link>
          </Row>
        ) : (
          <Row title="Create website and business card" body="Done. One per account." dim />
        )}

        {profile?.status === "draft" && (
          <Row
            title="Publish my site"
            body={
              prices
                ? `${prices.today} today, then ${prices.renewal}. Your QR code starts working as soon as you publish.`
                : paymentsConfigured()
                  ? "Make your site public so your QR code works."
                  : "Payments aren't set up yet."
            }
          >
            {paymentsConfigured() && (
              <StripeButton endpoint="/api/stripe/checkout" primary>
                Publish
              </StripeButton>
            )}
          </Row>
        )}
        {profile?.status === "lapsed" && (
          <Row
            title="Your site is paused"
            body={`Visitors see only your name and email until you renew.${prices ? ` Renewal is ${prices.renewal}.` : ""}`}
          >
            <StripeButton endpoint="/api/stripe/checkout" primary>
              Renew
            </StripeButton>
          </Row>
        )}

        <Row title="Update your website" body="Edit your content, add photos, change the layout or colors." dim={!profile}>
          {profile ? (
            <Link href="/edit" className={linkBtn(profile.status !== "draft")}>
              Open
            </Link>
          ) : (
            <span className="text-sm text-muted">Create your website first</span>
          )}
        </Row>
        <Row title="Print my business card" body="Choose a card design and get it ready to print." dim={!profile}>
          {profile ? (
            <Link href="/card" className={linkBtn(false)}>
              Open
            </Link>
          ) : (
            <span className="text-sm text-muted">Create your website first</span>
          )}
        </Row>
        {sub && (
          <Row
            title="Billing"
            body={
              sub.status === "active" || sub.status === "trialing"
                ? `Renews ${renewsOn ?? "yearly"}.`
                : sub.status === "past_due"
                  ? "Your last payment didn't go through. Update your card to keep your site live."
                  : "Update your card, see receipts, or cancel."
            }
          >
            <StripeButton endpoint="/api/stripe/portal">Manage billing</StripeButton>
          </Row>
        )}
      </ul>
    </section>
  );
}
