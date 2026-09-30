import { auth } from "@clerk/nextjs/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { ensureUser, getOwnedProfile } from "@/lib/owner";
import { stripe } from "@/lib/stripe";

// Stripe's hosted billing portal: update card, see invoices, cancel.
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Sign in first." }, { status: 401 });
  const user = await ensureUser();
  const profile = user ? await getOwnedProfile(user.id) : null;
  if (!profile) return Response.json({ error: "No site yet." }, { status: 400 });
  const [sub] = await db()
    .select({ customer: subscriptions.stripeCustomerId })
    .from(subscriptions)
    .where(eq(subscriptions.profileId, profile.id))
    .orderBy(desc(subscriptions.currentPeriodEnd))
    .limit(1);
  if (!sub) return Response.json({ error: "No billing history yet." }, { status: 400 });
  try {
    const session = await stripe().billingPortal.sessions.create({
      customer: sub.customer,
      return_url: `${new URL(request.url).origin}/dashboard`,
    });
    return Response.json({ url: session.url });
  } catch (err) {
    console.error("Billing portal failed", err);
    return Response.json({ error: "Couldn't open billing. Try again." }, { status: 502 });
  }
}
