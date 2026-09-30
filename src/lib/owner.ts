import "server-only";
import { currentUser } from "@clerk/nextjs/server";
import { and, asc, count, eq, gte, like } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { db } from "@/db";
import { futureItems, profiles, resumeParses, slides, users, type ProfileTheme } from "@/db/schema";
import type { Draft } from "./resume/normalize";
import { isValidSlug, newQrCode } from "./slugs";
import { profileTag } from "./profiles";

export const DAILY_PARSE_LIMIT = 5;

// The signed-in Clerk user's row in our users table, created on first use.
export async function ensureUser() {
  const cu = await currentUser();
  if (!cu) return null;
  const email = cu.primaryEmailAddress?.emailAddress ?? cu.emailAddresses[0]?.emailAddress ?? "";
  const [row] = await db()
    .insert(users)
    .values({ authId: cu.id, email })
    .onConflictDoUpdate({ target: users.authId, set: { email } })
    .returning();
  return { ...row, firstName: cu.firstName };
}

export async function getOwnedProfile(userId: string) {
  const [p] = await db().select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  return p ?? null;
}

export async function getOwnedDraft(userId: string) {
  const p = await getOwnedProfile(userId);
  if (!p) return null;
  const [slideRows, futureRows] = await Promise.all([
    db().select().from(slides).where(eq(slides.profileId, p.id)).orderBy(asc(slides.position)),
    db().select().from(futureItems).where(eq(futureItems.profileId, p.id)).orderBy(asc(futureItems.position)),
  ]);
  return { profile: p, slides: slideRows, future: futureRows };
}

export async function parsesInLastDay(userId: string) {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [{ n }] = await db()
    .select({ n: count() })
    .from(resumeParses)
    .where(and(eq(resumeParses.userId, userId), gte(resumeParses.createdAt, since)));
  return n;
}

export async function recordParse(userId: string, ok: boolean, error?: string) {
  await db().insert(resumeParses).values({ userId, ok, error: error?.slice(0, 500) });
}

// "Kaeden Wellman" -> "kaeden-wellman", then -2, -3... until unused. The slug picker comes in M3.
async function uniqueSlug(name: string) {
  const base =
    name
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 34)
      .replace(/-+$/, "") || "profile";
  const safeBase = isValidSlug(base) ? base : `${base}-site`.replace(/^-/, "p-");
  const taken = new Set(
    (await db().select({ slug: profiles.slug }).from(profiles).where(like(profiles.slug, `${safeBase}%`))).map(
      (r) => r.slug,
    ),
  );
  if (!taken.has(safeBase) && isValidSlug(safeBase)) return safeBase;
  for (let i = 2; i < 1000; i++) {
    const s = `${safeBase}-${i}`;
    if (!taken.has(s) && isValidSlug(s)) return s;
  }
  return `p-${newQrCode()}`;
}

export class ProfileLockedError extends Error {}

type SaveInput = {
  userId: string;
  fallbackName: string;
  fallbackEmail: string;
  draft: Draft | null; // null when parsing failed: keep the raw text for the editor
  resumeText: string;
  resumeBlobUrl: string | null;
  theme?: ProfileTheme; // design picked in the create flow
};

// Creates the user's draft profile, or replaces its content if it's still a draft.
// Published profiles aren't overwritten by a re-upload; editing them is M3.
export async function saveDraft(input: SaveInput) {
  const d = db();
  const existing = await getOwnedProfile(input.userId);
  if (existing && existing.status !== "draft") throw new ProfileLockedError();

  const fields = input.draft?.profile;
  const values = {
    name: fields?.name || existing?.name || input.fallbackName || "Your name",
    headline: fields?.headline ?? "",
    email: fields?.email || input.fallbackEmail,
    phone: fields?.phone ?? null,
    links: fields?.links ?? {},
    facts: fields?.facts ?? [],
    ...(input.theme ? { theme: input.theme } : {}),
    resumeText: input.resumeText,
    resumeBlobUrl: input.resumeBlobUrl,
    updatedAt: new Date(),
  };

  return d.transaction(async (tx) => {
    const profileId = existing
      ? (await tx.update(profiles).set(values).where(eq(profiles.id, existing.id)).returning())[0].id
      : (
          await tx
            .insert(profiles)
            .values({
              ...values,
              userId: input.userId,
              slug: await uniqueSlug(values.name),
              qrCode: newQrCode(),
              status: "draft",
            })
            .returning()
        )[0].id;

    await tx.delete(slides).where(eq(slides.profileId, profileId));
    await tx.delete(futureItems).where(eq(futureItems.profileId, profileId));
    const draft = input.draft;
    if (draft?.slides.length) {
      await tx.insert(slides).values(draft.slides.map((s, position) => ({ ...s, profileId, position })));
    }
    if (draft?.future.length) {
      await tx.insert(futureItems).values(draft.future.map((f, position) => ({ ...f, profileId, position })));
    }
    const [row] = await tx.select({ slug: profiles.slug }).from(profiles).where(eq(profiles.id, profileId));
    revalidateTag(profileTag(row.slug), "max");
    return { profileId, slug: row.slug };
  });
}
