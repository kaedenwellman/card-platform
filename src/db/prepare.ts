// Runs before `next build` on Vercel (the "vercel-build" script): applies pending migrations in
// drizzle/, then adds the /kaeden seed profile if it's missing. Skipped when DATABASE_URL isn't set.
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { seedKaeden } from "./seed";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.log("DATABASE_URL not set; skipping migrations");
    return;
  }
  const sql = postgres(url, { max: 1, onnotice: () => {} });
  try {
    const d = drizzle(sql);
    await migrate(d, { migrationsFolder: "drizzle" });
    console.log("Migrations applied");
    await seedKaeden(d);
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
