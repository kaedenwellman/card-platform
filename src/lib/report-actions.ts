"use server";

import { and, count, eq, gte } from "drizzle-orm";
import { z } from "zod";
import { db, hasDatabase } from "@/db";
import { profiles, reports } from "@/db/schema";
import { notifyReport } from "./email";
import { REPORT_REASONS } from "./reports";

export type ReportState = { ok: boolean; error?: string } | null;

const Report = z.object({
  slug: z.string().min(1).max(60),
  reason: z.enum(REPORT_REASONS, { message: "Pick a reason." }),
  details: z.string().trim().max(2000, "Keep the details under 2,000 characters.").default(""),
  email: z.union([z.email("That email doesn't look right."), z.literal("")]).default(""),
  website: z.string().default(""), // honeypot: hidden from people, filled by bots
});

const PER_PAGE_PER_DAY = 20; // beyond this, more reports for the same page are dropped quietly

// "Report this page": anyone can submit, no sign-in. Stored for review at /admin and emailed to
// ADMIN_EMAILS. Nothing identifying about the reporter is stored unless they give an email.
export async function submitReport(_prev: ReportState, form: FormData): Promise<ReportState> {
  const parsed = Report.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form." };
  const r = parsed.data;
  if (r.website) return { ok: true }; // bot
  if (!hasDatabase()) return { ok: false, error: "Reports aren't available right now. Try again later." };

  const [p] = await db().select({ id: profiles.id, status: profiles.status }).from(profiles).where(eq(profiles.slug, r.slug)).limit(1);
  if (!p || p.status === "draft") return { ok: false, error: "We couldn't find that page." };
  if (p.status === "removed") return { ok: true }; // already taken down

  const since = new Date(Date.now() - 24 * 3600 * 1000);
  const [{ n }] = await db()
    .select({ n: count() })
    .from(reports)
    .where(and(eq(reports.profileId, p.id), gte(reports.createdAt, since)));
  if (n >= PER_PAGE_PER_DAY) return { ok: true };

  const [saved] = await db()
    .insert(reports)
    .values({ profileId: p.id, reason: r.reason, details: r.details, reporterEmail: r.email || null })
    .returning({ id: reports.id });
  await notifyReport({ id: saved.id, profileId: p.id, reason: r.reason, details: r.details, reporterEmail: r.email || null }).catch((err) =>
    console.error("Report email failed", err),
  );
  return { ok: true };
}
