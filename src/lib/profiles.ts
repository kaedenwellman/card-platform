import "server-only";
import { asc, eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { db, hasDatabase } from "@/db";
import { futureItems, profiles, slides } from "@/db/schema";
import { KAEDEN } from "@/seed/kaeden";
import type { PublicProfile } from "./profile-types";

export const profileTag = (slug: string) => `profile:${slug}`;

async function loadProfile(slug: string): Promise<PublicProfile | null> {
  if (!hasDatabase()) return slug === KAEDEN.slug ? KAEDEN : null;

  const d = db();
  const [p] = await d.select().from(profiles).where(eq(profiles.slug, slug)).limit(1);
  if (!p) return null;

  const [slideRows, futureRows] = await Promise.all([
    d.select().from(slides).where(eq(slides.profileId, p.id)).orderBy(asc(slides.position)),
    d.select().from(futureItems).where(eq(futureItems.profileId, p.id)).orderBy(asc(futureItems.position)),
  ]);

  return {
    slug: p.slug,
    qrCode: p.qrCode,
    status: p.status,
    name: p.name,
    headline: p.headline,
    email: p.email,
    phone: p.phone,
    showPhoneOnSite: p.showPhoneOnSite,
    showPhoneOnCard: p.showPhoneOnCard,
    links: p.links,
    theme: p.theme,
    resumePdfPublicUrl: p.resumePdfPublicUrl,
    noindex: p.noindex,
    slides: slideRows.map((s) => ({
      section: s.section,
      title: s.title,
      role: s.role,
      body: s.body,
      points: s.points,
      link: s.link ?? null,
      media: s.media ?? null,
      tint: s.tint,
    })),
    future: futureRows.map((f) => ({ title: f.title, body: f.body })),
  };
}

// Cached per slug; the editor calls revalidateTag(profileTag(slug), "max") after saving.
export function getPublicProfile(slug: string) {
  return unstable_cache(() => loadProfile(slug), ["public-profile", slug], {
    tags: [profileTag(slug)],
    revalidate: 3600,
  })();
}
