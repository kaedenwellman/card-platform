"use server";

import { auth } from "@clerk/nextjs/server";
import { and, eq, max } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { profiles, slides } from "@/db/schema";
import { cardTemplateIds, paletteIds, templateIds } from "./design";
import { ensureUser, getOwnedProfile } from "./owner";
import { profileTag } from "./profiles";
import { takePhoto } from "./resume/draft";
import { httpsUrl } from "./validation";

const WebsiteDesign = z.object({ templateId: z.enum(templateIds), paletteId: z.enum(paletteIds) });
const CardDesign = z.object({ cardTemplateId: z.enum(cardTemplateIds) });

async function updateTheme(patch: Record<string, string>) {
  const user = await ensureUser();
  if (!user) throw new Error("Sign in first.");
  const profile = await getOwnedProfile(user.id);
  if (!profile) throw new Error("Create your site first.");
  // Picking a palette clears any old one-off accent override.
  const { accent: _accent, ...rest } = profile.theme;
  void _accent;
  await db()
    .update(profiles)
    .set({ theme: { ...rest, ...patch }, updatedAt: new Date() })
    .where(eq(profiles.id, profile.id));
  revalidateTag(profileTag(profile.slug), "max");
}

export async function saveWebsiteDesign(input: { templateId: string; paletteId: string }) {
  await updateTheme(WebsiteDesign.parse(input));
  revalidatePath("/edit");
  revalidatePath("/preview");
}

export async function saveCardDesign(input: { cardTemplateId: string }) {
  await updateTheme(CardDesign.parse(input));
  revalidatePath("/card");
}

// ---------- Add content / remove an entry (the "Update your website" page) ----------

const TINTS = ["#6b5a2a", "#2a2f45", "#2d4a3a", "#1f3d5c", "#5c2a1f", "#5c4a1f", "#3f2d5c", "#1f2f3a"];

const NewEntry = z.object({
  section: z.string().trim().min(1, "Pick or name a section.").max(40),
  title: z.string().trim().min(1, "Add a title.").max(120),
  role: z.string().trim().max(200).default(""),
  text: z.string().trim().max(3000).default(""),
  linkLabel: z.string().trim().max(80).default(""),
  linkUrl: z.string().trim().max(2048).default(""),
  photoPathname: z.string().max(300).nullable().default(null),
});

export type AddEntryResult = { ok: true; photoError?: string } | { ok: false; error: string };

async function ownedProfileOrThrow() {
  const user = await ensureUser();
  if (!user) throw new Error("Sign in first.");
  const profile = await getOwnedProfile(user.id);
  if (!profile) throw new Error("Create your site first.");
  return profile;
}

function refresh(slug: string) {
  revalidateTag(profileTag(slug), "max");
  revalidatePath("/edit");
  revalidatePath("/preview");
}

// Several lines become bullet points; a single paragraph becomes the entry's text.
function splitText(text: string) {
  const lines = text
    .split(/\n+/)
    .map((l) => l.replace(/^\s*[-•*]\s*/, "").trim())
    .filter(Boolean);
  return lines.length > 1 ? { body: null, points: lines.slice(0, 8) } : { body: lines[0] ?? null, points: [] };
}

export async function addEntry(input: z.input<typeof NewEntry>): Promise<AddEntryResult> {
  const parsed = NewEntry.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form." };
  const e = parsed.data;

  let link: { label: string; href: string } | null = null;
  if (e.linkUrl) {
    const href = /^https?:\/\//i.test(e.linkUrl) ? e.linkUrl.replace(/^http:/i, "https:") : `https://${e.linkUrl}`;
    if (!httpsUrl.safeParse(href).success) return { ok: false, error: "That link doesn't look right." };
    link = { label: e.linkLabel || href.replace(/^https:\/\//, ""), href };
  }

  const profile = await ownedProfileOrThrow();
  const { userId: clerkId } = await auth();
  let media = null;
  let photoError: string | undefined;
  if (e.photoPathname) {
    if (!clerkId || !e.photoPathname.startsWith(`uploads/${clerkId}/`)) return { ok: false, error: "That photo isn't yours." };
    const photo = await takePhoto(e.photoPathname, clerkId, "slide");
    if (photo.url) media = { type: "image" as const, url: photo.url };
    photoError = photo.error;
  }

  const [{ last }] = await db().select({ last: max(slides.position) }).from(slides).where(eq(slides.profileId, profile.id));
  const position = (last ?? -1) + 1;
  await db().insert(slides).values({
    profileId: profile.id,
    position,
    section: e.section,
    title: e.title,
    role: e.role,
    ...splitText(e.text),
    link,
    media,
    tint: TINTS[position % TINTS.length],
  });
  refresh(profile.slug);
  return { ok: true, photoError };
}

export async function removeEntry(slideId: string) {
  const id = z.string().uuid().parse(slideId);
  const profile = await ownedProfileOrThrow();
  // Scoped to the owner's profile, so nobody can delete someone else's entry.
  await db().delete(slides).where(and(eq(slides.id, id), eq(slides.profileId, profile.id)));
  refresh(profile.slug);
}
