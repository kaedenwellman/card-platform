import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProfileView } from "@/components/profile/ProfileView";
import { paletteIds, templateIds, type PaletteId, type TemplateId } from "@/lib/design";
import { EXAMPLE } from "@/seed/example";

export const metadata: Metadata = { title: "Example", robots: { index: false, follow: false } };

// The fictional sample profile in any layout and palette: /examples/profile?palette=ocean.
// Used for the design previews in the create flow and on the landing page.
export default async function ExamplePage({ params, searchParams }: PageProps<"/examples/[template]">) {
  const { template } = await params;
  const { palette } = await searchParams;
  if (!(templateIds as string[]).includes(template)) notFound();
  const paletteId = typeof palette === "string" && (paletteIds as string[]).includes(palette) ? (palette as PaletteId) : "gold";
  return <ProfileView profile={EXAMPLE} override={{ templateId: template as TemplateId, paletteId }} />;
}
