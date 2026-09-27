import { clerkMiddleware } from "@clerk/nextjs/server";

// Auth is enforced in the pages themselves (see src/app/(app)/(signed-in)/layout.tsx); the proxy
// only makes the session available. It runs on the signed-in app and APIs, not on public profile
// pages (/{slug}) or QR redirects (/c/{code}), so phones scanning a card load as little as possible.
export default clerkMiddleware();

export const config = {
  matcher: [
    "/start/:path*",
    "/edit/:path*",
    "/dashboard/:path*",
    "/sign-in/:path*",
    "/sign-up/:path*",
    "/(api|trpc)(.*)",
  ],
};
