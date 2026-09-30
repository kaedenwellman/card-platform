import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { hasDatabase } from "@/db";
import { ensureUser, getOwnedProfile } from "@/lib/owner";

export const metadata = { title: "Dashboard" };

const button = "inline-block rounded-md bg-gold px-6 py-3 font-bold text-black [font-stretch:110%] hover:bg-ink";

// M5 adds site link, PDFs, printing guide, scan count, and subscription status.
export default async function DashboardPage() {
  const cu = await currentUser();
  const user = hasDatabase() ? await ensureUser() : null;
  const profile = user ? await getOwnedProfile(user.id) : null;

  return (
    <section className="max-w-xl">
      <h1 className="text-3xl font-extrabold [font-stretch:112%]">
        Welcome{cu?.firstName ? `, ${cu.firstName}` : ""}
      </h1>
      {!profile ? (
        <>
          <p className="mt-3 text-muted">You don&apos;t have a site yet.</p>
          <Link href="/start" className={`mt-6 ${button}`}>
            Upload your resume
          </Link>
        </>
      ) : profile.status === "draft" ? (
        <>
          <p className="mt-3 text-muted">Your draft is ready to review. It isn&apos;t public yet.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/edit" className={button}>
              Review your draft
            </Link>
            <Link href="/preview" className="rounded-md border border-line px-6 py-3 hover:border-gold">
              Preview
            </Link>
          </div>
        </>
      ) : (
        <>
          <p className="mt-3 text-muted">Your site is live.</p>
          <Link href={`/${profile.slug}`} className={`mt-6 ${button}`}>
            View your site
          </Link>
        </>
      )}
    </section>
  );
}
