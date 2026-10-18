"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { profiles, reports, subscriptions } from "@/db/schema";
import { currentAdmin } from "./admin";
import { notifySiteRemoved } from "./email";
import { profileTag } from "./profiles";

type Result = { ok: true } | { ok: false; error: string };

async function guard() {
  if (!(await currentAdmin())) throw new Error("Not allowed");
}

function refresh(slug: string) {
  revalidateTag(profileTag(slug), { expire: 0 }); // the public page changes right away
  revalidatePath("/admin");
}

// Takes a page down: /{slug} and its QR code stop working, and the owner is emailed. Their
// subscription is not touched here; cancel or refund it in Stripe if that's warranted.
export async function takeDown(profileId: string): Promise<Result> {
  await guard();
  const id = z.string().uuid().parse(profileId);
  const [p] = await db().select().from(profiles).where(eq(profiles.id, id)).limit(1);
  if (!p) return { ok: false, error: "That page no longer exists." };
  if (p.status === "removed") return { ok: true };
  const removedAt = new Date();
  await db()
    .update(profiles)
    .set({ status: "removed", removedFromStatus: p.status, removedAt, updatedAt: removedAt })
    .where(and(eq(profiles.id, id), eq(profiles.status, p.status)));
  await db()
    .update(reports)
    .set({ status: "actioned", resolvedAt: removedAt })
    .where(and(eq(reports.profileId, id), eq(reports.status, "open")));
  refresh(p.slug);
  await notifySiteRemoved(id, removedAt).catch((err) => console.error("Takedown email failed", err));
  return { ok: true };
}

// Puts a taken-down page back. Its status comes from billing as it stands now (a subscription may
// have ended in the meantime), so a restore never hands out a free site.
export async function restore(profileId: string): Promise<Result> {
  await guard();
  const id = z.string().uuid().parse(profileId);
  const [p] = await db().select().from(profiles).where(eq(profiles.id, id)).limit(1);
  if (!p) return { ok: false, error: "That page no longer exists." };
  if (p.status !== "removed") return { ok: true };
  const [paying] = await db()
    .select({ id: subscriptions.id })
    .from(subscriptions)
    .where(and(eq(subscriptions.profileId, id), inArray(subscriptions.status, ["active", "trialing", "past_due"])))
    .limit(1);
  const status = paying ? "active" : p.publishedAt ? "lapsed" : "draft";
  await db().update(profiles).set({ status, removedFromStatus: null, removedAt: null, updatedAt: new Date() }).where(eq(profiles.id, id));
  refresh(p.slug);
  return { ok: true };
}

export async function dismissReport(reportId: string): Promise<Result> {
  await guard();
  const id = z.string().uuid().parse(reportId);
  await db().update(reports).set({ status: "dismissed", resolvedAt: new Date() }).where(eq(reports.id, id));
  revalidatePath("/admin");
  return { ok: true };
}
