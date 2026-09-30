import { auth } from "@clerk/nextjs/server";
import { desc, eq } from "drizzle-orm";
import { db, hasDatabase } from "@/db";
import { subscriptions } from "@/db/schema";
import { ensureUser, getOwnedProfile } from "@/lib/owner";
import { paymentsConfigured, stripe } from "@/lib/stripe";

// Starts Stripe Checkout for publishing (or renewing) the signed-in user's site. The site goes live
// only when Stripe's webhook confirms payment (/api/stripe/webhook), never from this redirect.
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Sign in first." }, { status: 401 });
  if (!hasDatabase() || !paymentsConfigured()) return Response.json({ error: "Payments aren't set up yet." }, { status: 503 });

  const user = await ensureUser();
  const profile = user ? await getOwnedProfile(user.id) : null;
  if (!user || !profile) return Response.json({ error: "Create your site first." }, { status: 400 });
  if (profile.status === "active") return Response.json({ error: "Your site is already live." }, { status: 409 });
  if (profile.status === "removed") return Response.json({ error: "This site was taken down." }, { status: 403 });

  // Reuse the Stripe customer from an earlier subscription (renewals after a lapse).
  const [prev] = await db()
    .select({ customer: subscriptions.stripeCustomerId })
    .from(subscriptions)
    .where(eq(subscriptions.profileId, profile.id))
    .orderBy(desc(subscriptions.currentPeriodEnd))
    .limit(1);

  const origin = new URL(request.url).origin;
  const setup = process.env.STRIPE_PRICE_SETUP;
  try {
    const session = await stripe().checkout.sessions.create({
      mode: "subscription",
      line_items: [
        // One-time setup fee only on the first purchase, not on a renewal after a lapse.
        ...(setup && profile.status === "draft" ? [{ price: setup, quantity: 1 }] : []),
        { price: process.env.STRIPE_PRICE_ANNUAL!, quantity: 1 },
      ],
      client_reference_id: profile.id,
      metadata: { profileId: profile.id },
      subscription_data: { metadata: { profileId: profile.id } },
      ...(prev ? { customer: prev.customer } : { customer_email: user.email || undefined }),
      allow_promotion_codes: true,
      success_url: `${origin}/dashboard?paid=1`,
      cancel_url: `${origin}/dashboard`,
    });
    return Response.json({ url: session.url });
  } catch (err) {
    console.error("Checkout session failed", err);
    return Response.json({ error: "Couldn't start checkout. Try again." }, { status: 502 });
  }
}
