import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";

export const metadata = { title: "Dashboard" };

// M5: site link, PDFs, printing guide, scan count, subscription status.
export default async function DashboardPage() {
  const user = await currentUser();
  return (
    <section className="max-w-xl">
      <h1 className="text-3xl font-extrabold [font-stretch:112%]">
        Welcome{user?.firstName ? `, ${user.firstName}` : ""}
      </h1>
      <p className="mt-3 text-muted">You don&apos;t have a site yet.</p>
      <Link
        href="/start"
        className="mt-6 inline-block rounded-md bg-gold px-6 py-3 font-bold text-black [font-stretch:110%] hover:bg-ink"
      >
        Upload your resume
      </Link>
    </section>
  );
}
