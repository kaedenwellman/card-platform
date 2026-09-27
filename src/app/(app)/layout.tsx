import { ClerkProvider, Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { dark } from "@clerk/ui/themes";
import Link from "next/link";

// App shell for the landing page, sign-in/up, and signed-in pages. ClerkProvider lives here, not in
// the root layout, so public profile pages don't ship Clerk's JavaScript.
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <ClerkProvider appearance={{ theme: dark, variables: { colorPrimary: "#CFB87C" } }}>
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 sm:px-8">
        <header className="flex items-center justify-between gap-4 border-b border-line py-4">
          <Link href="/" className="text-lg font-extrabold tracking-wide [font-stretch:125%]">
            BRAND
          </Link>
          <nav className="flex items-center gap-4 text-sm sm:gap-5">
            <Show when="signed-out">
              <SignInButton>
                <button className="text-muted hover:text-ink">Sign in</button>
              </SignInButton>
              <SignUpButton>
                <button className="rounded-md bg-gold px-4 py-2 font-bold text-black [font-stretch:110%] hover:bg-ink">
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
      </div>
    </ClerkProvider>
  );
}
