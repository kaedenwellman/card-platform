// Deploy diagnostics: which settings this deployment can see. Never returns secret values.
export const dynamic = "force-dynamic";

export function GET() {
  const pk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
  const sk = process.env.CLERK_SECRET_KEY ?? "";
  const body = {
    clerkPublishableKey: pk ? `set (${pk.slice(0, 8)}…, ${pk.length} chars)` : "MISSING",
    clerkSecretKey: sk ? `set (${sk.slice(0, 8)}…)` : "MISSING",
    clerkSignInUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? "not set",
    clerkSignUpUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL ?? "not set",
    databaseUrl: process.env.DATABASE_URL ? "set" : "MISSING",
    vercelEnv: process.env.VERCEL_ENV ?? "local",
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local",
  };
  return Response.json(body, { headers: { "cache-control": "no-store" } });
}
