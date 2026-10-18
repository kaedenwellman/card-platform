"use server";

import { auth } from "@clerk/nextjs/server";
import { and, asc, eq, max, ne } from "drizzle-orm";
import { del } from "@vercel/blob";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { profiles, slides, subscriptions } from "@/db/schema";
import { cardTemplateIds, paletteIds, templateIds } from "./design";
import { ensureUser, getOwnedProfile } from "./owner";
import { profileTag } from "./profiles";
import { takePhoto } from "./resume/draft";
import { isValidSlug, RESERVED_SLUGS } from "./slugs";
import { factSchema, httpsUrl } from "./validation";

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
  await reorder(profile.id, () => {}); // moves the new entry up next to the rest of its section
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
  await reorder(profile.id, () => {}); // in case the section changed
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

// ---------- Reordering ----------

type Group = { section: string; ids: string[] };

// Loads the entries grouped by section (sections in order of first appearance), lets `change`
// rearrange the groups, then rewrites positions so each section's entries stay together. The site
// shows entries in position order and builds its section tabs from that order.
async function reorder(profileId: string, change: (groups: Group[]) => void) {
  await db().transaction(async (tx) => {
    const rows = await tx
      .select({ id: slides.id, section: slides.section, position: slides.position })
      .from(slides)
      .where(eq(slides.profileId, profileId))
      .orderBy(asc(slides.position));
    const groups: Group[] = [];
    for (const r of rows) {
      let g = groups.find((x) => x.section === r.section);
      if (!g) groups.push((g = { section: r.section, ids: [] }));
      g.ids.push(r.id);
    }
    change(groups);
    const current = new Map(rows.map((r) => [r.id, r.position]));
    let position = 0;
    for (const id of groups.flatMap((g) => g.ids)) {
      if (current.get(id) !== position) await tx.update(slides).set({ position }).where(eq(slides.id, id));
      position++;
    }
  });
}

const swap = <T,>(list: T[], i: number, j: number) => {
  if (i < 0 || j < 0 || i >= list.length || j >= list.length) return;
  [list[i], list[j]] = [list[j]!, list[i]!];
};

const Direction = z.enum(["up", "down"]);

// Moves an entry one place up or down within its section.
export async function moveEntry(slideId: string, direction: "up" | "down") {
  const id = z.string().uuid().parse(slideId);
  const step = Direction.parse(direction) === "up" ? -1 : 1;
  const profile = await ownedProfileOrThrow();
  await reorder(profile.id, (groups) => {
    const g = groups.find((x) => x.ids.includes(id));
    if (g) swap(g.ids, g.ids.indexOf(id), g.ids.indexOf(id) + step);
  });
  refresh(profile.slug);
}

// Moves a whole section (all its entries) one place up or down.
export async function moveSection(section: string, direction: "up" | "down") {
  const name = z.string().min(1).max(40).parse(section);
  const step = Direction.parse(direction) === "up" ? -1 : 1;
  const profile = await ownedProfileOrThrow();
  await reorder(profile.id, (groups) => {
    const i = groups.findIndex((g) => g.section === name);
    if (i >= 0) swap(groups, i, i + step);
  });
  refresh(profile.slug);
}

// ---------- Key facts (the stat boxes on the Profile layout) ----------

const Facts = z.array(
  z.object({ label: z.string(), value: z.string(), detail: z.string().default("") }).transform((f) => ({
    label: f.label.trim(),
    value: f.value.trim(),
    detail: f.detail.trim(),
  })),
);

export async function updateFacts(input: { label: string; value: string; detail?: string }[]): Promise<{ ok: true } | { ok: false; error: string }> {
  // Fully empty rows are dropped; half-filled ones get a message.
  const rows = Facts.parse(input).filter((f) => f.label || f.value || f.detail);
  if (rows.length > 4) return { ok: false, error: "Up to 4 facts." };
  const facts = [];
  for (const [i, f] of rows.entries()) {
    if (!f.label || !f.value) return { ok: false, error: `Fact ${i + 1} needs a label and a value.` };
    const parsed = factSchema.safeParse({ label: f.label, value: f.value, detail: f.detail || undefined });
    if (!parsed.success) {
      return { ok: false, error: `Fact ${i + 1} is too long (label up to 24 characters, value 60, detail 80).` };
    }
    facts.push(parsed.data);
  }
  const profile = await ownedProfileOrThrow();
  await db().update(profiles).set({ facts, updatedAt: new Date() }).where(eq(profiles.id, profile.id));
  refresh(profile.slug);
  return { ok: true };
}

// ---------- Web address ----------

// Changes /{slug}. Printed QR codes keep working because they point to /c/{code}, which always
// redirects to the current slug; links shared with the old address stop working.
export async function updateSlug(input: string): Promise<{ ok: true; slug: string } | { ok: false; error: string }> {
  const slug = z.string().max(60).parse(input).trim().toLowerCase();
  if (RESERVED_SLUGS.has(slug)) return { ok: false, error: "That address is reserved. Try another." };
  if (!isValidSlug(slug)) {
    return { ok: false, error: "Use 3–40 lowercase letters, numbers, or single dashes, starting and ending with a letter or number." };
  }
  const profile = await ownedProfileOrThrow();
  if (slug === profile.slug) return { ok: true, slug };
  const [taken] = await db()
    .select({ id: profiles.id })
    .from(profiles)
    .where(and(eq(profiles.slug, slug), ne(profiles.id, profile.id)))
    .limit(1);
  if (taken) return { ok: false, error: "That address is taken. Try another." };
  try {
    await db().update(profiles).set({ slug, updatedAt: new Date() }).where(eq(profiles.id, profile.id));
  } catch {
    return { ok: false, error: "That address is taken. Try another." }; // lost a race for the same slug
  }
  revalidateTag(profileTag(profile.slug), { expire: 0 }); // the old address 404s right away
  refresh(slug);
  revalidatePath("/dashboard");
  revalidatePath("/card");
  return { ok: true, slug };
}

// ---------- Start over (drafts only) ----------

// Deletes an unpublished site so the owner can create a new one from scratch. Published sites
// can't be deleted here: their QR codes are printed.
export async function startOver(): Promise<{ ok: false; error: string } | void> {
  const profile = await ownedProfileOrThrow();
  if (profile.status !== "draft") return { ok: false, error: "Only unpublished sites can be started over." };
  // A checkout was started for this site; deleting it could strand a payment.
  const [sub] = await db().select({ id: subscriptions.id }).from(subscriptions).where(eq(subscriptions.profileId, profile.id)).limit(1);
  if (sub) return { ok: false, error: "A payment was started for this site, so it can't be deleted. Contact support." };
  const photoPaths = (await db().select({ media: slides.media }).from(slides).where(eq(slides.profileId, profile.id)))
    .map((r) => r.media?.url)
    .filter((u): u is string => Boolean(u?.startsWith("/media/photos/")))
    .map((u) => u.slice("/media/".length));
  await db().delete(profiles).where(and(eq(profiles.id, profile.id), eq(profiles.status, "draft")));
  // Files are cleaned up best-effort; the database row is what matters.
  const files = [...photoPaths, ...(profile.resumeBlobUrl ? [profile.resumeBlobUrl] : [])];
  if (files.length) await del(files).catch((err) => console.error("Start over: file cleanup failed", err));
  revalidateTag(profileTag(profile.slug), { expire: 0 });
  revalidatePath("/dashboard");
  redirect("/create");
}

// ---------- Search engines ----------

// Asks search engines not to list the site (a robots "noindex" tag). The site stays public: anyone
// with the link or QR code can still open it.
export async function setHiddenFromSearch(hidden: boolean): Promise<{ ok: true }> {
  const value = z.boolean().parse(hidden);
  const profile = await ownedProfileOrThrow();
  await db().update(profiles).set({ noindex: value, updatedAt: new Date() }).where(eq(profiles.id, profile.id));
  refresh(profile.slug);
  return { ok: true };
}
