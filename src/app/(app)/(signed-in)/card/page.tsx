import { redirect } from "next/navigation";
import { hasDatabase } from "@/db";
import { cardData, qrUrl } from "@/lib/card";
import { getCardTemplateId, getPalette } from "@/lib/design";
import { ensureUser, getOwnedDraft } from "@/lib/owner";
import { toPublicProfile } from "@/lib/profiles";
import { CardStudio } from "./CardStudio";

export const metadata = { title: "Print my business card" };

export default async function CardPage() {
  const user = hasDatabase() ? await ensureUser() : null;
  const data = user ? await getOwnedDraft(user.id) : null;
  if (!data) redirect("/dashboard");
  const profile = toPublicProfile(data.profile, data.slides, data.future);
  const card = await cardData(profile);
  const palette = getPalette(profile.theme.paletteId);

  return (
    <section className="flex flex-col gap-10">
      <header>
        <h1 className="text-4xl font-semibold uppercase leading-[0.95] tracking-tight">Print my business card</h1>
        <p className="mt-2 max-w-2xl text-muted">
          The QR code on the back opens <span className="text-ink">{qrUrl(profile.qrCode)}</span>. That link stays the
          same when you edit your site, so printed cards keep working.
        </p>
      </header>

      <CardStudio
        initial={getCardTemplateId(profile.theme.cardTemplateId)}
        paletteId={palette.id}
        card={card}
        canDownload={profile.status === "active" || profile.status === "lapsed"}
      />

      <div className="border-t border-line pt-8">
        <div className="max-w-2xl">
          <h2 className="font-bold">How to print</h2>
          <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm text-ink/80">
            <li>
              Use the FedEx / UPS file at a print counter, the bleed file for print shops that ask for bleed, and the home
              file on your own printer: double-sided, flip on the long edge, then cut on the marks.
            </li>
            <li>At FedEx Office, choose &quot;Quick Business Cards&quot; (same or next day), not &quot;Premium&quot; (about 5 business days).</li>
            <li>Pick a matte, heavier card stock.</li>
            <li>Print at 100% (never &quot;fit to page&quot;).</li>
            <li>Scan the QR on one card with your phone before cutting or taking the whole batch.</li>
          </ol>
        </div>
      </div>
    </section>
  );
}
