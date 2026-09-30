import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ProfileView } from "@/components/profile/ProfileView";
import { hasDatabase } from "@/db";
import { ensureUser, getOwnedDraft } from "@/lib/owner";
import { toPublicProfile } from "@/lib/profiles";

export const metadata: Metadata = { title: "Preview", robots: { index: false, follow: false } };

// The owner's draft, rendered exactly like the public page. Outside the (app) layout so it's
// full-screen like the real thing.
export default async function PreviewPage({ searchParams }: PageProps<"/preview">) {
  const { template, palette, embed } = await searchParams;
  await auth.protect();
  const user = hasDatabase() ? await ensureUser() : null;
  const data = user ? await getOwnedDraft(user.id) : null;
  if (!data) redirect("/start");
  const profile = toPublicProfile(data.profile, data.slides, data.future);

  // ?template=&palette= previews an unsaved design choice; ?embed=1 hides the bar (used in iframes).
  const override = {
    templateId: typeof template === "string" ? template : undefined,
    paletteId: typeof palette === "string" ? palette : undefined,
  };
  if (embed === "1") return <ProfileView profile={profile} override={override} />;

  return (
    <>
      <div className="flex items-center justify-between gap-4 border-b border-line bg-[#0e0e0e] px-4 py-2 text-sm">
        <span className="text-muted">Draft preview. Only you can see this.</span>
        <Link href="/edit" className="text-gold underline underline-offset-4">
          Back to draft
        </Link>
      </div>
      <ProfileView profile={profile} override={override} />
    </>
  );
}
