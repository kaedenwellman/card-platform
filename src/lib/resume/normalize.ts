import { factSchema, futureItemSchema, httpsUrl, profileSchema, slideSchema } from "../validation";
import type { FutureItem, ProfileFields, Slide } from "../validation";
import type { AiDraft } from "./parse-ai";

// Placeholder-art tints, cycled per slide (same palette as the reference site).
const TINTS = ["#6b5a2a", "#2a2f45", "#2d4a3a", "#1f3d5c", "#5c2a1f", "#5c4a1f", "#3f2d5c", "#1f2f3a"];

const clip = (s: string, max: number) => (s.length <= max ? s : s.slice(0, max - 1).trimEnd() + "…");

// Resumes usually write "github.com/name"; the site only renders https:// links.
export function toHttps(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;
  let v = raw.trim().replace(/[.,;)]+$/, "");
  if (!v) return undefined;
  if (/^http:\/\//i.test(v)) v = "https://" + v.slice(7);
  else if (!/^https:\/\//i.test(v)) v = "https://" + v.replace(/^\/+/, "");
  return httpsUrl.safeParse(v).success && !v.startsWith("/") ? v : undefined;
}

export type Draft = { profile: ProfileFields; slides: Slide[]; future: FutureItem[] };

// Throws (ZodError) when the draft can't be made valid; the caller retries once, then falls back.
export function normalizeDraft(ai: AiDraft): Draft {
  const p = ai.profile;
  const email = p.email?.trim() ?? "";
  const profile = profileSchema.parse({
    name: clip(p.name.trim(), 80),
    headline: clip(p.headline.trim(), 160),
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "",
    phone: p.phone && /^[+\d()\-.\s]{7,24}$/.test(p.phone.trim()) ? p.phone.trim() : null,
    links: {
      github: toHttps(p.links.github),
      linkedin: toHttps(p.links.linkedin),
      website: toHttps(p.links.website),
    },
    // Facts that don't fit the limits are dropped rather than failing the whole draft.
    facts: ai.facts
      .map((f) =>
        factSchema.safeParse({
          label: f.label.trim(),
          value: f.value.trim(),
          detail: f.detail?.trim() ? clip(f.detail.trim(), 80) : undefined,
        }),
      )
      .flatMap((r) => (r.success ? [r.data] : []))
      .slice(0, 4),
  });

  const slides = ai.slides.map((s, i) => {
    const href = toHttps(s.link?.href);
    return slideSchema.parse({
      section: clip(s.section.trim(), 40),
      title: clip(s.title.trim(), 120),
      role: clip(s.role.trim(), 200),
      body: s.body?.trim() ? clip(s.body.trim(), 1200) : null,
      points: s.points.map((x) => clip(x.trim(), 600)).filter(Boolean).slice(0, 8),
      link: s.link && href ? { label: clip(s.link.label.trim() || href, 80), href } : null,
      media: null,
      tint: TINTS[i % TINTS.length],
    });
  });
  if (slides.length === 0) throw new Error("No slides in draft");

  const future = ai.future_items.map((f) =>
    futureItemSchema.parse({ title: clip(f.title.trim(), 80), body: clip(f.body.trim(), 600) }),
  );

  return { profile, slides, future };
}
