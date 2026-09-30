import { clerkMiddleware } from "@clerk/nextjs/server";

// Auth is enforced in the pages themselves (see src/app/(app)/(signed-in)/layout.tsx); the proxy
// only makes the session available. It runs on the landing page, the signed-in app and APIs, not
// on public profile pages (/{slug}) or QR redirects (/c/{code}), so phones scanning a card load as
// little as possible.
export default clerkMiddleware();

export const config = {
  matcher: [
    "/",
    // Every page under src/app/(app)/(signed-in)/ must be listed (checked by scripts/check-proxy.mjs).
    "/create/:path*",
    "/start/:path*",
    "/edit/:path*",
    "/dashboard/:path*",
    "/card/:path*",
    "/preview",
    "/sign-in/:path*",
    "/sign-up/:path*",
    // All APIs except Stripe's webhook, which authenticates with its own signature.
    "/api/((?!stripe/webhook).*)",
    "/trpc/(.*)",
    "/__clerk/:path*",
  ],
};
