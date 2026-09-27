// Seeds Kaeden's profile at /kaeden. Safe to re-run: replaces the profile's slides and future items
// but keeps its id and QR code.
//   npm run db:seed
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { KAEDEN } from "../seed/kaeden";
import { futureItemSchema, profileSchema, slideSchema } from "../lib/validation";
import { futureItems, profiles, slides } from "./schema";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const sql = postgres(url, { max: 1 });
  const d = drizzle(sql);

  const fields = profileSchema.parse(KAEDEN);
  const slideRows = KAEDEN.slides.map((s) => slideSchema.parse(s));
  const futureRows = KAEDEN.future.map((f) => futureItemSchema.parse(f));

  const [existing] = await d.select().from(profiles).where(eq(profiles.slug, KAEDEN.slug)).limit(1);
  const profileId = existing
    ? (await d.update(profiles).set({ ...fields, status: "active", updatedAt: new Date() }).where(eq(profiles.id, existing.id)).returning())[0].id
    : (
        await d
          .insert(profiles)
          .values({ ...fields, slug: KAEDEN.slug, qrCode: KAEDEN.qrCode, status: "active", publishedAt: new Date() })
          .returning()
      )[0].id;

  await d.transaction(async (tx) => {
    await tx.delete(slides).where(eq(slides.profileId, profileId));
    await tx.delete(futureItems).where(eq(futureItems.profileId, profileId));
    await tx.insert(slides).values(slideRows.map((s, position) => ({ ...s, profileId, position })));
    await tx.insert(futureItems).values(futureRows.map((f, position) => ({ ...f, profileId, position })));
  });

  console.log(`Seeded /${KAEDEN.slug} (${slideRows.length} slides, ${futureRows.length} future items)`);
  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
