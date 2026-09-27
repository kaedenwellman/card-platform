import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// Shapes stored in jsonb columns. Validated with Zod at the edges (see src/lib/validation.ts).
export type ProfileLinks = {
  github?: string;
  linkedin?: string;
  website?: string;
};
export type ProfileTheme = {
  accent?: string; // hex, defaults to #CFB87C
  templateId?: string; // defaults to "carousel"
};
export type SlideLink = { label: string; href: string };
export type SlideMedia = {
  type: "image" | "video";
  url: string;
  position?: string; // CSS object-position
  fit?: "cover" | "contain"; // images only
};

export const profileStatus = pgEnum("profile_status", ["draft", "active", "lapsed", "removed"]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
};

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  authId: text("auth_id").notNull().unique(), // Clerk user id
  email: text("email").notNull(),
  ...timestamps,
});

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    slug: text("slug").notNull(),
    // Printed on cards via /c/{qrCode}. Assigned once, never changed or reused.
    qrCode: text("qr_code").notNull(),
    status: profileStatus("status").notNull().default("draft"),

    name: text("name").notNull(),
    headline: text("headline").notNull().default(""),
    email: text("email").notNull().default(""),
    phone: text("phone"),
    showPhoneOnSite: boolean("show_phone_on_site").notNull().default(true),
    showPhoneOnCard: boolean("show_phone_on_card").notNull().default(true),
    links: jsonb("links").$type<ProfileLinks>().notNull().default({}),
    theme: jsonb("theme").$type<ProfileTheme>().notNull().default({}),

    resumeBlobUrl: text("resume_blob_url"), // private
    resumePdfPublicUrl: text("resume_pdf_public_url"), // shown only if the owner opts in
    noindex: boolean("noindex").notNull().default(false),

    ...timestamps,
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
  },
  (t) => [uniqueIndex("profiles_slug_idx").on(t.slug), uniqueIndex("profiles_qr_code_idx").on(t.qrCode)],
);

export const slides = pgTable(
  "slides",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    section: text("section").notNull(),
    title: text("title").notNull(),
    role: text("role").notNull().default(""),
    body: text("body"),
    points: jsonb("points").$type<string[]>().notNull().default([]),
    link: jsonb("link").$type<SlideLink | null>(),
    media: jsonb("media").$type<SlideMedia | null>(),
    tint: text("tint").notNull().default("#2a2f45"),
  },
  (t) => [index("slides_profile_idx").on(t.profileId, t.position)],
);

export const futureItems = pgTable(
  "future_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull().default(""),
  },
  (t) => [index("future_items_profile_idx").on(t.profileId, t.position)],
);

export const cards = pgTable("cards", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  templateId: text("template_id").notNull().default("classic"),
  version: integer("version").notNull(),
  fieldsHash: text("fields_hash").notNull(),
  pdfBleedUrl: text("pdf_bleed_url"),
  pdfTrimUrl: text("pdf_trim_url"),
  pdfSheetUrl: text("pdf_sheet_url"),
  generatedAt: timestamp("generated_at", { withTimezone: true }).notNull().defaultNow(),
});

// No IP addresses, ever.
export const scans = pgTable(
  "scans",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    scannedAt: timestamp("scanned_at", { withTimezone: true }).notNull().defaultNow(),
    userAgentFamily: text("user_agent_family"),
    referrer: text("referrer"),
  },
  (t) => [index("scans_profile_idx").on(t.profileId, t.scannedAt)],
);

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  stripeCustomerId: text("stripe_customer_id").notNull(),
  stripeSubscriptionId: text("stripe_subscription_id").unique(),
  status: text("status").notNull(),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
});
