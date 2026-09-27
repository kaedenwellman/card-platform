import "server-only";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

export function hasDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

let client: ReturnType<typeof drizzle<typeof schema>> | undefined;

export function db() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  client ??= drizzle(neon(process.env.DATABASE_URL), { schema });
  return client;
}
