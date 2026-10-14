import type Stripe from "stripe";
import { notifyPaymentFailed } from "@/lib/email";
import { stripe, syncSubscription } from "@/lib/stripe";

function syncInvoiceSubscription(invoice: Stripe.Invoice) {
  const ref = invoice.parent?.subscription_details?.subscription;
  const subId = typeof ref === "string" ? ref : ref?.id;
  return subId ? syncSubscription(subId) : Promise.resolve(null);
}

// Stripe → us. Publishing, renewals, and lapses all happen here. Every event just re-syncs the
// subscription from Stripe, so duplicates and out-of-order delivery are harmless.
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!secret || !signature) return new Response("Not configured", { status: 400 });

  let event: Stripe.Event;
  try {
    event = await stripe().webhooks.constructEventAsync(await request.text(), signature, secret);
  } catch (err) {
    console.error("Bad webhook signature", err);
    return new Response("Bad signature", { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const s = event.data.object;
        const subId = typeof s.subscription === "string" ? s.subscription : s.subscription?.id;
        if (subId) await syncSubscription(subId, s.metadata?.profileId ?? s.client_reference_id ?? undefined);
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await syncSubscription(event.data.object.id);
        break;
      case "invoice.paid":
        await syncInvoiceSubscription(event.data.object);
        break;
      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const profileId = await syncInvoiceSubscription(invoice);
        // Renewals only: a first payment that fails is handled on the Checkout page itself.
        if (profileId && invoice.billing_reason !== "subscription_create" && invoice.id) {
          await notifyPaymentFailed(profileId, invoice.id, invoice.attempt_count ?? 1, invoice.hosted_invoice_url ?? null).catch((err) =>
            console.error("Payment failed email", err),
          );
        }
        break;
      }
    }
  } catch (err) {
    // 500 makes Stripe retry later.
    console.error(`Webhook ${event.type} failed`, err);
    return new Response("Handler failed", { status: 500 });
  }
  return Response.json({ received: true });
}
