import Link from "next/link";
import { getPublicProfile } from "@/lib/profiles";
import { isValidSlug } from "@/lib/slugs";
import { ReportForm } from "./ReportForm";

export const metadata = { title: "Report a page", robots: { index: false, follow: false } };

// Linked from the bottom of every public site. Public, no sign-in.
export default async function ReportPage({ searchParams }: PageProps<"/report">) {
  const { site } = await searchParams;
  const slug = typeof site === "string" ? site.toLowerCase() : "";
  const profile = isValidSlug(slug) ? await getPublicProfile(slug).catch(() => null) : null;
  const found = profile && (profile.status === "active" || profile.status === "lapsed");

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-12">
      <h1 className="text-4xl font-semibold uppercase leading-[0.95] tracking-tight">Report a page</h1>
      {found ? (
        <>
          <p className="text-muted">
            You&apos;re reporting <span className="text-ink">{profile.name}</span> (/{slug}). Reports go to the people who run
            this service, not to the page&apos;s owner.
          </p>
          <ReportForm slug={slug} />
        </>
      ) : (
        <p className="text-muted">We couldn&apos;t find that page. It may have been removed already.</p>
      )}
      <p className="text-xs text-muted">
        See our{" "}
        <Link href="/terms" className="underline">
          Terms
        </Link>{" "}
        for what isn&apos;t allowed.
      </p>
    </main>
  );
}
