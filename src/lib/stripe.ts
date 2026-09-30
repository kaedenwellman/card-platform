import "server-only";
import { eq } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import Stripe from "stripe";
import { db } from "@/db";
import { profiles, subscriptions } from "@/db/schema";
import { profileTag } from "./profiles";

// Prices live in Stripe (Dashboard → Product catalog), not in code (handoff §11):
//   STRIPE_PRICE_SETUP  one-time setup fee (optional)
//   STRIPE_PRICE_ANNUAL yearly renewal that keeps the site live
let client: Stripe | undefined;
export function stripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  client ??= new Stripe(key, {
    // Lets tests point the SDK at a local mock (STRIPE_API_HOST=127.0.0.1:12111 over http).
    ...(process.env.STRIPE_API_HOST
      ? { host: process.env.STRIPE_API_HOST.split(":")[0], port: Number(process.env.STRIPE_API_HOST.split(":")[1]), protocol: "http" as const }
      : {}),
  });
  return client;
}

export const paymentsConfigured = () => Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ANNUAL);

function money(p: Stripe.Price) {
  const amount = (p.unit_amount ?? 0) / 100;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: p.currency.toUpperCase(), minimumFractionDigits: amount % 1 ? 2 : 0 }).format(amount);
}

// "$29 today, then $19/year" from the prices in Stripe. Null if Stripe isn't set up or unreachable.
export async function priceSummary(): Promise<{ today: string; renewal: string } | null> {
  if (!paymentsConfigured()) return null;
  try {
    const [setup, annual] = await Promise.all([
      process.env.STRIPE_PRICE_SETUP ? stripe().prices.retrieve(process.env.STRIPE_PRICE_SETUP) : null,
      stripe().prices.retrieve(process.env.STRIPE_PRICE_ANNUAL!),
    ]);
    const interval = annual.recurring?.interval ?? "year";
    const todayCents = (setup?.unit_amount ?? 0) + (annual.unit_amount ?? 0);
    return {
      today: money({ ...annual, unit_amount: todayCents } as Stripe.Price),
      renewal: `${money(annual)}/${interval}`,
    };
  } catch (err) {
    console.error("Couldn't load prices from Stripe", err);
    return null;
  }
}

// Stripe subscription status → our profile status. Removed (takedown) is never changed here.
function profileStatusFor(status: Stripe.Subscription.Status): "active" | "lapsed" | null {
  if (status === "active" || status === "trialing" || status === "past_due") return "active"; // past_due: Stripe is still retrying
  if (status === "canceled" || status === "unpaid" || status === "incomplete_expired" || status === "paused") return "lapsed";
  return null; // incomplete: first payment not done yet, leave the profile alone
}

// Pulls the subscription fresh from Stripe and mirrors it into our database. Called for every
// billing webhook, so event order and retries don't matter.
export async function syncSubscription(subscriptionId: string, profileIdHint?: string) {
  const sub = await stripe().subscriptions.retrieve(subscriptionId);
  const profileId = sub.metadata.profileId || profileIdHint;
  if (!profileId) {
    console.error(`Subscription ${sub.id} has no profileId`);
    return;
  }
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  // Billing periods are per item in current API versions; use the latest end.
  const periodEnd = Math.max(0, ...sub.items.data.map((i) => i.current_period_end ?? 0));

  const d = db();
  await d
    .insert(subscriptions)
    .values({
      profileId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: sub.id,
      status: sub.status,
      currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
    })
    .onConflictDoUpdate({
      target: subscriptions.stripeSubscriptionId,
      set: { status: sub.status, stripeCustomerId: customerId, currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null },
    });

  const next = profileStatusFor(sub.status);
  const [p] = await d.select().from(profiles).where(eq(profiles.id, profileId)).limit(1);
  if (!p || !next || p.status === "removed" || p.status === next) return;
  // An old canceled subscription must not pause a site that a newer one is paying for.
  if (next === "lapsed") {
    const others = await d.select().from(subscriptions).where(eq(subscriptions.profileId, profileId));
    if (others.some((o) => o.stripeSubscriptionId !== sub.id && profileStatusFor(o.status as Stripe.Subscription.Status) === "active")) return;
  }
  await d
    .update(profiles)
    .set({ status: next, updatedAt: new Date(), ...(next === "active" && !p.publishedAt ? { publishedAt: new Date() } : {}) })
    .where(eq(profiles.id, profileId));
  revalidateTag(profileTag(p.slug), "max");
  revalidatePath("/dashboard");
  console.log(`Profile ${p.slug}: ${p.status} → ${next} (subscription ${sub.id} ${sub.status})`);
}
