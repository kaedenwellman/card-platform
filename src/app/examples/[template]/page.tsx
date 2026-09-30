import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProfileView } from "@/components/profile/ProfileView";
import { paletteIds, templateIds, type PaletteId, type TemplateId } from "@/lib/design";
import { EXAMPLES, EXAMPLE_FOR_TEMPLATE, exampleIds, type ExampleId } from "@/seed/examples";

export const metadata: Metadata = { title: "Example", robots: { index: false, follow: false } };

// A fictional sample person in any layout and palette: /examples/profile?palette=ocean&person=maya.
// Without ?person, each layout has its own default person (EXAMPLE_FOR_TEMPLATE).
export default async function ExamplePage({ params, searchParams }: PageProps<"/examples/[template]">) {
  const { template } = await params;
  const { palette, person } = await searchParams;
  if (!(templateIds as string[]).includes(template)) notFound();
  const paletteId = typeof palette === "string" && (paletteIds as string[]).includes(palette) ? (palette as PaletteId) : "gold";
  const who: ExampleId =
    typeof person === "string" && (exampleIds as string[]).includes(person) ? (person as ExampleId) : EXAMPLE_FOR_TEMPLATE[template];
  return <ProfileView profile={EXAMPLES[who]} override={{ templateId: template as TemplateId, paletteId }} />;
}
