import { eq } from "drizzle-orm";
import { db, hasDatabase } from "@/db";
import { profiles, scans } from "@/db/schema";
import { KAEDEN } from "@/seed/kaeden";

// Printed QR codes point here, never at /{slug}, so slugs can change without breaking cards.
// 302 (not 301) so browsers don't cache the destination. Scans are logged without IP addresses.
function uaFamily(ua: string) {
  if (/iPhone|iPad|iPod/.test(ua)) return "ios";
  if (/Android/.test(ua)) return "android";
  if (/Macintosh|Windows|Linux|CrOS/.test(ua)) return "desktop";
  return "other";
}

export async function GET(request: Request, { params }: RouteContext<"/c/[code]">) {
  const { code } = await params;
  const origin = new URL(request.url).origin;
  if (!/^[a-z0-9]{8}$/.test(code)) return new Response("Not found", { status: 404 });

  if (!hasDatabase()) {
    return code === KAEDEN.qrCode ? Response.redirect(`${origin}/${KAEDEN.slug}`, 302) : new Response("Not found", { status: 404 });
  }

  const [p] = await db()
    .select({ id: profiles.id, slug: profiles.slug, status: profiles.status })
    .from(profiles)
    .where(eq(profiles.qrCode, code))
    .limit(1);
  if (!p || p.status === "removed") return new Response("Not found", { status: 404 });

  // Logging must never block the redirect.
  await db()
    .insert(scans)
    .values({
      profileId: p.id,
      userAgentFamily: uaFamily(request.headers.get("user-agent") ?? ""),
      referrer: request.headers.get("referer")?.slice(0, 300) ?? null,
    })
    .catch((err) => console.error("Scan log failed", err));

  return new Response(null, { status: 302, headers: { location: `${origin}/${p.slug}`, "cache-control": "no-store" } });
}
