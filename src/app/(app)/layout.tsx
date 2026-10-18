import { ClerkProvider, Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";

// App shell for the landing page, sign-in/up, and signed-in pages. ClerkProvider lives here, not in
// the root layout, so public profile pages don't ship Clerk's JavaScript.
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <ClerkProvider appearance={{ variables: { colorPrimary: "#0e0e0e", colorBackground: "#ffffff", borderRadius: "0px" } }}>
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 sm:px-8">
        <header className="app-header flex items-center justify-between gap-4 border-b border-line py-4">
          <Link href="/" className="app-logo text-lg font-extrabold uppercase tracking-tight">
            BRAND
          </Link>
          <nav className="app-nav flex items-center gap-4 text-sm uppercase tracking-[0.02em] sm:gap-5">
            <Show when="signed-out">
              <SignInButton>
                <button className="text-muted hover:text-ink">Sign in</button>
              </SignInButton>
              <SignUpButton>
                <button className="app-signup bg-ink px-4 py-2 font-bold text-bg hover:bg-gold hover:text-white">
                  Sign up
                </button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <Link href="/dashboard" className="text-muted hover:text-ink">
                Dashboard
              </Link>
              <UserButton />
            </Show>
          </nav>
        </header>
        <main className="flex-1 py-8">{children}</main>
        <footer className="app-footer flex gap-5 border-t border-line py-5 text-xs uppercase tracking-[0.03em] text-muted">
          <Link href="/terms" className="hover:text-ink">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-ink">
            Privacy
          </Link>
        </footer>
      </div>
    </ClerkProvider>
  );
}
