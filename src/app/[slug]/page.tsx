import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { ContactOnlyView } from "@/components/profile/ContactOnlyView";
import { ProfileView } from "@/components/profile/ProfileView";
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

export default async function ProfilePage({ params }: Props) {
  const profile = await load(params);
  if (!profile) notFound();
  // Lapsed: printed cards must keep working, so show name, headline and email instead of a 404.
  if (profile.status === "lapsed") return <ContactOnlyView profile={profile} />;
  return <ProfileView profile={profile} />;
}
