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

// "" = no link; otherwise normalized to https://.
function parseLink(linkUrl: string, linkLabel: string): { link: { label: string; href: string } | null } | { error: string } {
  if (!linkUrl) return { link: null };
  const href = /^https?:\/\//i.test(linkUrl) ? linkUrl.replace(/^http:/i, "https:") : `https://${linkUrl}`;
  if (!httpsUrl.safeParse(href).success) return { error: "That link doesn't look right." };
  return { link: { label: linkLabel || href.replace(/^https:\/\//, ""), href } };
}

// Turns a browser upload into a slide photo. Only the signed-in user's own uploads are accepted.
async function uploadedPhoto(pathname: string): Promise<{ media?: { type: "image"; url: string }; error?: string }> {
  const { userId: clerkId } = await auth();
  if (!clerkId || !pathname.startsWith(`uploads/${clerkId}/`)) return { error: "That photo isn't yours." };
  const photo = await takePhoto(pathname, clerkId, "slide");
  return photo.url ? { media: { type: "image", url: photo.url } } : { error: photo.error };
}

export async function addEntry(input: z.input<typeof NewEntry>): Promise<AddEntryResult> {
  const parsed = NewEntry.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form." };
  const e = parsed.data;
  const l = parseLink(e.linkUrl, e.linkLabel);
  if ("error" in l) return { ok: false, error: l.error };

  const profile = await ownedProfileOrThrow();
  let media = null;
  let photoError: string | undefined;
  if (e.photoPathname) {
    const photo = await uploadedPhoto(e.photoPathname);
    media = photo.media ?? null;
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
    link: l.link,
    media,
    tint: TINTS[position % TINTS.length],
  });
  refresh(profile.slug);
  return { ok: true, photoError };
}

const EditEntry = NewEntry.extend({ id: z.string().uuid(), removePhoto: z.boolean().default(false) });

// Saves every field of an existing entry. The photo changes only if a new one was uploaded or
// removePhoto is set; otherwise the current photo (or video) stays.
export async function updateEntry(input: z.input<typeof EditEntry>): Promise<AddEntryResult> {
  const parsed = EditEntry.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form." };
  const e = parsed.data;
  const l = parseLink(e.linkUrl, e.linkLabel);
  if ("error" in l) return { ok: false, error: l.error };

  const profile = await ownedProfileOrThrow();
  const where = and(eq(slides.id, e.id), eq(slides.profileId, profile.id));
  const [existing] = await db().select({ id: slides.id }).from(slides).where(where).limit(1);
  if (!existing) return { ok: false, error: "That entry no longer exists." };

  let photoError: string | undefined;
  let mediaPatch = {};
  if (e.photoPathname) {
    const photo = await uploadedPhoto(e.photoPathname);
    if (photo.media) mediaPatch = { media: photo.media };
    photoError = photo.error;
  } else if (e.removePhoto) {
    mediaPatch = { media: null };
  }

  await db()
    .update(slides)
    .set({ section: e.section, title: e.title, role: e.role, ...splitText(e.text), link: l.link, ...mediaPatch })
    .where(where);
  refresh(profile.slug);
  return { ok: true, photoError };
}

// Quick photo change from the entry list: a new upload, or null to remove the photo.
export async function setEntryPhoto(slideId: string, photoPathname: string | null): Promise<AddEntryResult> {
  const id = z.string().uuid().parse(slideId);
  const profile = await ownedProfileOrThrow();
  const where = and(eq(slides.id, id), eq(slides.profileId, profile.id));
  let media = null;
  if (photoPathname) {
    const photo = await uploadedPhoto(photoPathname);
    if (!photo.media) return { ok: false, error: photo.error ?? "We couldn't process that photo." };
    media = photo.media;
  }
  await db().update(slides).set({ media }).where(where);
  refresh(profile.slug);
  return { ok: true };
}

export async function removeEntry(slideId: string) {
  const id = z.string().uuid().parse(slideId);
  const profile = await ownedProfileOrThrow();
  // Scoped to the owner's profile, so nobody can delete someone else's entry.
  await db().delete(slides).where(and(eq(slides.id, id), eq(slides.profileId, profile.id)));
  refresh(profile.slug);
}

// ---------- The basics at the top of the site ----------

const Basics = z.object({
  name: z.string().trim().min(1, "Add your name.").max(80),
  headline: z.string().trim().max(160).default(""),
  email: z.union([z.email("That email doesn't look right."), z.literal("")]).default(""),
  phone: z
    .string()
    .trim()
    .max(24)
    .refine((v) => v === "" || /^[+\d()\-.\s]{7,24}$/.test(v), "That phone number doesn't look right.")
    .default(""),
  linkedin: z.string().trim().max(300).default(""),
  github: z.string().trim().max(300).default(""),
  website: z.string().trim().max(300).default(""),
});

export async function updateBasics(input: z.input<typeof Basics>): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = Basics.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form." };
  const b = parsed.data;
  const links: Record<string, string> = {};
  for (const key of ["linkedin", "github", "website"] as const) {
    const l = parseLink(b[key], "");
    if ("error" in l) return { ok: false, error: `Your ${key === "website" ? "website" : key === "github" ? "GitHub" : "LinkedIn"} link doesn't look right.` };
    if (l.link) links[key] = l.link.href;
  }
  const profile = await ownedProfileOrThrow();
  await db()
    .update(profiles)
    .set({ name: b.name, headline: b.headline, email: b.email, phone: b.phone || null, links, updatedAt: new Date() })
    .where(eq(profiles.id, profile.id));
  refresh(profile.slug);
  return { ok: true };
}
