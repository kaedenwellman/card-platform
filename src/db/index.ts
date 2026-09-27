import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export function hasDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

let client: ReturnType<typeof drizzle<typeof schema>> | undefined;

// Railway Postgres is a regular always-on server, and every Vercel function instance opens its own
// connections, so keep each instance's pool small. Reused across requests within an instance.
export function db() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  client ??= drizzle(postgres(process.env.DATABASE_URL, { max: 3, idle_timeout: 20 }), { schema });
  return client;
}
