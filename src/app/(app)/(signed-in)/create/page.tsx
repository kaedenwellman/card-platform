import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { hasDatabase } from "@/db";
import { qrSvg, siteOrigin } from "@/lib/card";
import { DAILY_PARSE_LIMIT, ensureUser, getOwnedProfile, parsesInLastDay } from "@/lib/owner";
import { CreateWizard } from "./CreateWizard";

export const metadata = { title: "Create your website and card" };

// "Create new website and business card": available once per account.
export default async function CreatePage() {
  const { userId } = await auth.protect();
  const user = hasDatabase() ? await ensureUser() : null;
  if (user && (await getOwnedProfile(user.id))) redirect("/dashboard");
  const used = user ? await parsesInLastDay(user.id) : 0;

  const cu = await currentUser();
  const origin = siteOrigin();
  // Sample card face for the design step; the real one comes from the resume.
  const sampleCard = {
    name: [cu?.firstName, cu?.lastName].filter(Boolean).join(" ") || "Your Name",
    line: "Your major or role",
    phone: "555-123-4567",
    email: cu?.primaryEmailAddress?.emailAddress ?? "you@example.com",
    photoUrl: cu?.imageUrl && cu.hasImage ? cu.imageUrl : null,
    qrSvg: await qrSvg(`${origin}/c/example0`),
    domain: new URL(origin).host,
  };

  return (
    <CreateWizard
      clerkId={userId}
      sampleCard={sampleCard}
      limitReached={used >= DAILY_PARSE_LIMIT}
      limit={DAILY_PARSE_LIMIT}
    />
  );
}
