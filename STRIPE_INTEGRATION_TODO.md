# Stripe Integration TODO

Hosted Stripe Checkout: the dashboard's **Publish my site** / **Renew** buttons send the customer to a
Stripe-hosted payment page. The site goes live only when Stripe's webhook confirms payment.

## Values to Replace

None. The Checkout Session call has no placeholder values. Its `mode`, `success_url`, `cancel_url`
and `line_items` were already real and were kept as they were:

**Files containing the Checkout Session call:**
- [src/app/api/stripe/checkout/route.ts](src/app/api/stripe/checkout/route.ts)

| Field | Current Value | Notes |
|-------|--------------|-------|
| mode | `subscription` | Correct: the site is a yearly subscription. |
| success_url | `${origin}/dashboard?paid=1` | The dashboard shows a "you're live" note. |
| cancel_url | `${origin}/dashboard` | Back to the dashboard. |
| line_items[].price | `STRIPE_PRICE_SETUP` (optional, first purchase only) + `STRIPE_PRICE_ANNUAL` | Price IDs come from Vercel env vars. Set them to your real Price IDs (see Setup). |

## Configured Parameters

These parameters were configured in Checkout Studio and are already set correctly.

**Files containing these parameters:**
- [src/app/api/stripe/checkout/route.ts](src/app/api/stripe/checkout/route.ts)

| Parameter | Value |
|-----------|-------|
| ui_mode | `hosted_page` (Stripe SDK is 22.6.2, which uses `hosted_page`) |
| billing_address_collection | `auto` |
| phone_number_collection | `{ enabled: false }` |
| automatic_tax | `{ enabled: false }` |
| allow_promotion_codes | `false` (was `true`) |
| payment_method_collection | `always` (mode is `subscription`) |
| submit_type | `auto` |
| integration_identifier | `hosted_web_0001` |
| origin_context | `web` |

Kept on purpose (app wiring, not Checkout Studio settings): `client_reference_id`, `metadata.profileId`,
`subscription_data.metadata.profileId`, and `customer` / `customer_email`. The webhook uses `profileId`
to know which site to publish, so removing them would break publishing.

## Setup

1. **Stripe account, test mode.** Turn on Test mode at https://dashboard.stripe.com.
2. **Prices** (Product catalog → Add product):
   - a **Recurring, Yearly** price, which is the renewal
   - optionally a **One-time** price, which is the setup fee
3. **Webhook** (Developers → Webhooks → Add endpoint):
   - URL: `https://card-platform-mu.vercel.app/api/stripe/webhook`
   - events:
     - `checkout.session.completed`
     - `checkout.session.async_payment_succeeded`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.paid`
     - `invoice.payment_failed`
   - Copy the signing secret (`whsec_…`).
4. **Customer portal:** Settings → Billing → Customer portal → Save once. **Manage billing** needs this.
5. **Vercel environment variables** (Production):

   | Name | Value |
   |------|-------|
   | `STRIPE_SECRET_KEY` | `sk_test_…` from https://dashboard.stripe.com/test/apikeys. Mark it Sensitive. |
   | `STRIPE_PRICE_ANNUAL` | the yearly Price ID (`price_…`) |
   | `STRIPE_PRICE_SETUP` | the one-time Price ID. Optional: leave it out for no setup fee. |
   | `STRIPE_WEBHOOK_SECRET` | `whsec_…` |

   There's no publishable key: hosted Checkout needs no Stripe.js in the browser.
6. **Redeploy**, then check that `/healthz` shows all four Stripe values as `set`.

## Files

| File | Role |
|------|------|
| [src/lib/stripe.ts](src/lib/stripe.ts) | Stripe client, prices shown on the dashboard, `syncSubscription` (subscription → site status) |
| [src/app/api/stripe/checkout/route.ts](src/app/api/stripe/checkout/route.ts) | Creates the Checkout Session |
| [src/app/api/stripe/webhook/route.ts](src/app/api/stripe/webhook/route.ts) | Checks the signature, then syncs the subscription |
| [src/app/api/stripe/portal/route.ts](src/app/api/stripe/portal/route.ts) | Opens the Billing Portal (**Manage billing**) |
| [src/components/billing/StripeButton.tsx](src/components/billing/StripeButton.tsx) | Button that POSTs to one of the routes above and redirects to Stripe |

## How it works

1. The user clicks **Publish my site** (or **Renew**). This POSTs to `/api/stripe/checkout`, which creates the
   session and returns `session.url`, and the browser goes to Stripe.
2. The user pays on Stripe's hosted page and is sent back to `/dashboard?paid=1`.
3. Stripe calls `/api/stripe/webhook`. The app re-reads the subscription from Stripe, saves it, and sets the
   site status: active/trialing/past_due → live; canceled/unpaid → paused.
4. Renewals, failed payments and cancellations come through the same webhook.

## Testing

- `4242 4242 4242 4242`: succeeds (any future expiry date, any CVC, any ZIP)
- `4000 0025 0000 3155`: requires 3D Secure authentication
- `4000 0000 0000 9995`: declined (insufficient funds)
- To test locally, run `stripe listen --forward-to localhost:3000/api/stripe/webhook` and use the `whsec_…` it
  prints.
- Stripe lists each webhook delivery and the app's response under Developers → Webhooks → your endpoint.

## Next steps

- Set final prices in Stripe. No code change is needed; the dashboard reads them from Stripe.
- Switch to live keys and a live webhook endpoint at launch.
- Add "your site is live" / "payment failed" emails (Resend) in the webhook handler.
- Add terms and privacy pages before taking real payments.

## Resources

- https://support.stripe.com
- https://docs.stripe.com/mcp
