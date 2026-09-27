import { ClerkProvider, UserButton } from "@clerk/nextjs";
import { dark } from "@clerk/ui/themes";
import Link from "next/link";

// Signed-in app shell. ClerkProvider lives here, not in the root layout, so public profile pages
// don't ship Clerk's JavaScript.
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <ClerkProvider appearance={{ theme: dark, variables: { colorPrimary: "#CFB87C" } }}>
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 sm:px-8">
        <header className="flex items-center justify-between border-b border-line py-4">
          <Link href="/" className="text-lg font-extrabold tracking-wide [font-stretch:125%]">
            BRAND
          </Link>
          <nav className="flex items-center gap-5 text-sm text-muted">
            <Link href="/dashboard" className="hover:text-ink">
              Dashboard
            </Link>
            <UserButton />
          </nav>
        </header>
        <main className="flex-1 py-8">{children}</main>
      </div>
    </ClerkProvider>
  );
}
