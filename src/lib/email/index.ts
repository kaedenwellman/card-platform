import "server-only";
import { eq } from "drizzle-orm";
import { Resend } from "resend";
import { db } from "@/db";
import { emailLog, profiles, users } from "@/db/schema";
import { siteOrigin } from "@/lib/card";
import { LEGAL } from "@/lib/legal";
import { paymentFailedEmail, reportReceivedEmail, siteLiveEmail, sitePausedEmail, siteRemovedEmail, type Message } from "./templates";

// RESEND_API_KEY and EMAIL_FROM (e.g. "Cards <hello@yourdomain.com>", on a domain verified in Resend).
export const emailConfigured = () => Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);

let client: Resend | undefined;
const resend = () => (client ??= new Resend(process.env.RESEND_API_KEY));

// Sends a message at most once per dedupeKey (the key is logged before sending). Never throws: an
// email problem must not block publishing or make Stripe retry the webhook. A failed send is
// logged and its key released. Without Resend configured, emails are skipped.
async function sendOnce({ to, kind, dedupeKey, profileId, message }: { to: string | string[]; kind: string; dedupeKey: string; profileId: string; message: Message }) {
  if (!emailConfigured()) {
    console.log(`Email "${kind}" to ${to} skipped: Resend isn't configured`);
    return;
  }
  const [row] = await db()
    .insert(emailLog)
    .values({ profileId, kind, dedupeKey })
    .onConflictDoNothing({ target: emailLog.dedupeKey })
    .returning({ id: emailLog.id });
  if (!row) return; // already sent

  const { error } = await resend()
    .emails.send(
      {
        from: process.env.EMAIL_FROM!,
        to,
        replyTo: process.env.EMAIL_REPLY_TO || undefined,
        subject: message.subject,
        html: message.html,
        text: message.text,
      },
      { idempotencyKey: dedupeKey },
    )
    .catch((err: unknown) => ({ error: { message: String(err) } }));
  if (error) {
    console.error(`Email "${kind}" to ${to} failed: ${error.message}`);
    await db().delete(emailLog).where(eq(emailLog.id, row.id));
  }
}

// The owner's sign-in email (from Clerk), falling back to the contact email on their site.
async function recipient(profileId: string) {
  const [r] = await db()
    .select({ slug: profiles.slug, name: profiles.name, contact: profiles.email, account: users.email })
    .from(profiles)
    .leftJoin(users, eq(users.id, profiles.userId))
    .where(eq(profiles.id, profileId))
    .limit(1);
  if (!r) return null;
  const to = r.account || r.contact;
  return to ? { ...r, to } : null;
}

export async function notifySiteLive(profileId: string, subscriptionId: string, again: boolean) {
  const r = await recipient(profileId);
  if (!r) return;
  const origin = siteOrigin();
  await sendOnce({
    to: r.to,
    kind: "site_live",
    dedupeKey: `site_live:${subscriptionId}`,
    profileId,
    message: siteLiveEmail({ name: r.name, siteUrl: `${origin}/${r.slug}`, cardUrl: `${origin}/card`, printGuideUrl: `${origin}/print-guide`, again }),
  });
}

export async function notifySitePaused(profileId: string, subscriptionId: string) {
  const r = await recipient(profileId);
  if (!r) return;
  await sendOnce({
    to: r.to,
    kind: "site_paused",
    dedupeKey: `site_paused:${subscriptionId}`,
    profileId,
    message: sitePausedEmail({ name: r.name, renewUrl: `${siteOrigin()}/dashboard` }),
  });
}

// One email per failed attempt; Stripe retries a few times before giving up.
export async function notifyPaymentFailed(profileId: string, invoiceId: string, attempt: number, payUrl: string | null) {
  const r = await recipient(profileId);
  if (!r) return;
  const origin = siteOrigin();
  await sendOnce({
    to: r.to,
    kind: "payment_failed",
    dedupeKey: `payment_failed:${invoiceId}:${attempt}`,
    profileId,
    message: paymentFailedEmail({ name: r.name, payUrl: payUrl || `${origin}/dashboard`, siteUrl: `${origin}/${r.slug}` }),
  });
}

// ADMIN_EMAILS: comma-separated; these people get report alerts and can use /admin.
export const adminEmails = () =>
  (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

export async function notifyReport(report: { id: string; profileId: string; reason: string; details: string; reporterEmail: string | null }) {
  const to = adminEmails();
  if (!to.length) {
    console.log(`Report ${report.id} saved; no ADMIN_EMAILS to notify`);
    return;
  }
  const [p] = await db().select({ slug: profiles.slug, name: profiles.name }).from(profiles).where(eq(profiles.id, report.profileId)).limit(1);
  if (!p) return;
  const origin = siteOrigin();
  await sendOnce({
    to,
    kind: "report",
    dedupeKey: `report:${report.id}`,
    profileId: report.profileId,
    message: reportReceivedEmail({
      siteName: p.name,
      siteUrl: `${origin}/${p.slug}`,
      reason: report.reason,
      details: report.details,
      reporterEmail: report.reporterEmail,
      adminUrl: `${origin}/admin`,
    }),
  });
}

export async function notifySiteRemoved(profileId: string, removedAt: Date) {
  const r = await recipient(profileId);
  if (!r) return;
  await sendOnce({
    to: r.to,
    kind: "site_removed",
    dedupeKey: `site_removed:${profileId}:${removedAt.getTime()}`,
    profileId,
    message: siteRemovedEmail({ name: r.name, contact: LEGAL.contactEmail, termsUrl: `${siteOrigin()}/terms` }),
  });
}
