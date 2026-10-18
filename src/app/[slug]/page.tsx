import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContactOnlyView } from "@/components/profile/ContactOnlyView";
import { ProfileView } from "@/components/profile/ProfileView";
import { getPalette } from "@/lib/design";
import type { PublicProfile } from "@/lib/profile-types";
import { getPublicProfile } from "@/lib/profiles";
import { isValidSlug } from "@/lib/slugs";

type Props = { params: Promise<{ slug: string }> };

async function load(params: Props["params"]) {
  const { slug } = await params;
  const lower = slug.toLowerCase();
  if (!isValidSlug(lower)) return null;
  const profile = await getPublicProfile(lower);
  // Drafts aren't public yet; removed pages (takedowns) are gone.
  if (!profile || profile.status === "draft" || profile.status === "removed") return null;
  return profile;
}

export const viewport: Viewport = { themeColor: "#000000" };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const profile = await load(params);
  if (!profile) return { title: "Not found" };
  return {
    title: profile.name,
    description: profile.headline ? `${profile.name}: ${profile.headline}` : profile.name,
    robots: profile.noindex || profile.status === "lapsed" ? { index: false, follow: false } : undefined,
  };
}

// A quiet "Report this page" line under every public site, in the site's own colors.
function ReportStrip({ profile }: { profile: PublicProfile }) {
  const palette = getPalette(profile.theme.paletteId);
  return (
    <p style={{ background: palette.bg, color: palette.muted, padding: "18px 16px 22px", textAlign: "center", fontSize: 12 }}>
      <Link href={`/report?site=${profile.slug}`} rel="nofollow" style={{ color: "inherit", textDecoration: "underline", textUnderlineOffset: 3 }}>
        Report this page
      </Link>
    </p>
  );
}

export default async function ProfilePage({ params }: Props) {
  const profile = await load(params);
  if (!profile) notFound();
  return (
    <>
      {/* Lapsed: printed cards must keep working, so show name, headline and email instead of a 404. */}
      {profile.status === "lapsed" ? <ContactOnlyView profile={profile} /> : <ProfileView profile={profile} />}
      <ReportStrip profile={profile} />
    </>
  );
}
