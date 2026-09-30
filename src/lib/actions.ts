"use server";

import { eq } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { cardTemplateIds, paletteIds, templateIds } from "./design";
import { ensureUser, getOwnedProfile } from "./owner";
import { profileTag } from "./profiles";

const WebsiteDesign = z.object({ templateId: z.enum(templateIds), paletteId: z.enum(paletteIds) });
const CardDesign = z.object({ cardTemplateId: z.enum(cardTemplateIds) });

async function updateTheme(patch: Record<string, string>) {
  const user = await ensureUser();
  if (!user) throw new Error("Sign in first.");
  const profile = await getOwnedProfile(user.id);
  if (!profile) throw new Error("Create your site first.");
  // Picking a palette clears any old one-off accent override.
  const { accent: _accent, ...rest } = profile.theme;
  void _accent;
  await db()
    .update(profiles)
    .set({ theme: { ...rest, ...patch }, updatedAt: new Date() })
    .where(eq(profiles.id, profile.id));
  revalidateTag(profileTag(profile.slug), "max");
}

export async function saveWebsiteDesign(input: { templateId: string; paletteId: string }) {
  await updateTheme(WebsiteDesign.parse(input));
  revalidatePath("/edit");
  revalidatePath("/preview");
}

export async function saveCardDesign(input: { cardTemplateId: string }) {
  await updateTheme(CardDesign.parse(input));
  revalidatePath("/card");
}
