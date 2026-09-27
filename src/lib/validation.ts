import { z } from "zod";

// Only https:// links from users. Our own relative paths ("/seed/...", "/api/...") are allowed for
// assets we host.
export const httpsUrl = z
  .string()
  .trim()
  .max(2048)
  .refine((v) => {
    if (v.startsWith("/") && !v.startsWith("//")) return true;
    try {
      return new URL(v).protocol === "https:";
    } catch {
      return false;
    }
  }, "Links must start with https://");

export const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a 6-digit hex color");

export const slideLinkSchema = z.object({
  label: z.string().trim().min(1).max(80),
  href: httpsUrl,
});

export const slideMediaSchema = z.object({
  type: z.enum(["image", "video"]),
  url: httpsUrl,
  position: z
    .string()
    .regex(/^[a-z0-9%.\s-]{1,40}$/i)
    .optional(),
  fit: z.enum(["cover", "contain"]).optional(),
});

export const slideSchema = z.object({
  section: z.string().trim().min(1).max(40),
  title: z.string().trim().min(1).max(120),
  role: z.string().trim().max(200).default(""),
  body: z.string().trim().max(1200).nullable().default(null),
  points: z.array(z.string().trim().min(1).max(600)).max(8).default([]),
  link: slideLinkSchema.nullable().default(null),
  media: slideMediaSchema.nullable().default(null),
  tint: hexColor.default("#2a2f45"),
});

export const futureItemSchema = z.object({
  title: z.string().trim().min(1).max(80),
  body: z.string().trim().max(600).default(""),
});

export const profileSchema = z.object({
  name: z.string().trim().min(1).max(80),
  headline: z.string().trim().max(160).default(""),
  email: z.union([z.email(), z.literal("")]).default(""),
  phone: z
    .string()
    .trim()
    .regex(/^[+\d()\-.\s]{7,24}$/, "Enter a valid phone number")
    .nullable()
    .default(null),
  showPhoneOnSite: z.boolean().default(true),
  showPhoneOnCard: z.boolean().default(true),
  links: z
    .object({
      github: httpsUrl.optional(),
      linkedin: httpsUrl.optional(),
      website: httpsUrl.optional(),
    })
    .default({}),
  theme: z
    .object({
      accent: hexColor.optional(),
      templateId: z.string().max(40).optional(),
    })
    .default({}),
  resumePdfPublicUrl: httpsUrl.nullable().default(null),
  noindex: z.boolean().default(false),
});

export type SlideInput = z.input<typeof slideSchema>;
export type Slide = z.output<typeof slideSchema>;
export type FutureItem = z.output<typeof futureItemSchema>;
export type ProfileFields = z.output<typeof profileSchema>;
