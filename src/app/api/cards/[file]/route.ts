import { auth } from "@clerk/nextjs/server";
import { hasDatabase } from "@/db";
import { CARD_FILES, CardFitError, renderCardPdf, type CardFile } from "@/lib/card-pdf";
import { ensureUser, getOwnedDraft } from "@/lib/owner";
import { toPublicProfile } from "@/lib/profiles";

export const maxDuration = 30;

const text = (message: string, status: number) =>
  new Response(message, { status, headers: { "content-type": "text/plain; charset=utf-8" } });

// Card PDFs are built on request from the current profile, so they always match the site and
// there's nothing stored to go stale. The QR inside is decoded and checked on every build.
export async function GET(_req: Request, { params }: RouteContext<"/api/cards/[file]">) {
  const { file } = await params;
  if (!(file in CARD_FILES)) return text("Not found", 404);

  const { userId } = await auth();
  if (!userId) return text("Sign in first.", 401);
  if (!hasDatabase()) return text("Not available right now.", 503);
  const user = await ensureUser();
  const data = user ? await getOwnedDraft(user.id) : null;
  if (!data) return text("Create your site first.", 404);
  if (data.profile.status === "draft") return text("Publish your site first. The card links to it.", 402);
  if (data.profile.status === "removed") return text("This site was taken down.", 403);

  try {
    const pdf = await renderCardPdf(toPublicProfile(data.profile, data.slides, data.future), file as CardFile);
    return new Response(new Uint8Array(pdf), {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="${CARD_FILES[file as CardFile].filename}"`,
        "cache-control": "private, no-store",
      },
    });
  } catch (err) {
    if (err instanceof CardFitError) return text(err.message, 422);
    console.error("Card PDF failed", err);
    return text("We couldn't make your card file. Try again in a minute.", 500);
  }
}
