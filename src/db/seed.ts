// Seeds Kaeden's profile at /kaeden.
//   npm run db:seed            add it only if /kaeden doesn't exist yet (also runs on every deploy)
//   npm run db:seed -- --reset replace its fields, slides and future items with src/seed/kaeden.ts
//                              (keeps the profile id and QR code)
import { eq } from "drizzle-orm";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { KAEDEN } from "../seed/kaeden";
import { futureItemSchema, profileSchema, slideSchema } from "../lib/validation";
import { futureItems, profiles, slides } from "./schema";

export async function seedKaeden(d: PostgresJsDatabase, { reset = false } = {}) {
  const fields = profileSchema.parse(KAEDEN);
  const slideRows = KAEDEN.slides.map((s) => slideSchema.parse(s));
  const futureRows = KAEDEN.future.map((f) => futureItemSchema.parse(f));

  const [existing] = await d.select().from(profiles).where(eq(profiles.slug, KAEDEN.slug)).limit(1);
  if (existing && !reset) {
    console.log(`/${KAEDEN.slug} already exists; leaving it as is`);
    return;
  }

  await d.transaction(async (tx) => {
    const profileId = existing
      ? (await tx.update(profiles).set({ ...fields, status: "active", updatedAt: new Date() }).where(eq(profiles.id, existing.id)).returning())[0].id
      : (
          await tx
            .insert(profiles)
            .values({ ...fields, slug: KAEDEN.slug, qrCode: KAEDEN.qrCode, status: "active", publishedAt: new Date() })
            .returning()
        )[0].id;
    await tx.delete(slides).where(eq(slides.profileId, profileId));
    await tx.delete(futureItems).where(eq(futureItems.profileId, profileId));
    await tx.insert(slides).values(slideRows.map((s, position) => ({ ...s, profileId, position })));
    await tx.insert(futureItems).values(futureRows.map((f, position) => ({ ...f, profileId, position })));
  });

  console.log(`Seeded /${KAEDEN.slug} (${slideRows.length} slides, ${futureRows.length} future items)`);
}

if (process.argv[1]?.endsWith("seed.ts")) {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const sql = postgres(url, { max: 1 });
  seedKaeden(drizzle(sql), { reset: process.argv.includes("--reset") })
    .then(() => sql.end())
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
