import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { hasDatabase } from "@/db";
import { DAILY_PARSE_LIMIT, ensureUser, getOwnedProfile, parsesInLastDay } from "@/lib/owner";
import { UploadForm } from "./UploadForm";

export const metadata = { title: "Upload your resume" };

export default async function StartPage() {
  const { userId } = await auth.protect();
  const user = hasDatabase() ? await ensureUser() : null;
  const profile = user ? await getOwnedProfile(user.id) : null;
  // First-time creation goes through the design picker; /start is only for re-uploading a draft.
  if (hasDatabase() && !profile) redirect("/create");
  const used = user ? await parsesInLastDay(user.id) : 0;

  return (
    <section className="max-w-xl">
      <h1 className="text-3xl font-extrabold [font-stretch:112%]">Upload a new resume</h1>
      <p className="mt-3 text-muted">
        We&apos;ll turn it into a draft of your site: one slide per job, project, and activity, in your
        resume&apos;s order and wording. You review everything before anything goes live.
      </p>
      {profile && profile.status !== "draft" ? (
        <p className="mt-8 rounded-md border border-line p-4">
          Your site is already published. <Link href="/edit" className="text-gold underline">Open the editor</Link> to make changes.
        </p>
      ) : used >= DAILY_PARSE_LIMIT ? (
        <p className="mt-8 rounded-md border border-line p-4">
          You&apos;ve uploaded {DAILY_PARSE_LIMIT} resumes in the last day. Try again tomorrow, or{" "}
          <Link href="/edit" className="text-gold underline">review your current draft</Link>.
        </p>
      ) : (
        <UploadForm clerkId={userId} replacing={Boolean(profile)} />
      )}
    </section>
  );
}
