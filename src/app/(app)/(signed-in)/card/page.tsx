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
        <h1 className="text-3xl font-extrabold [font-stretch:112%]">Print my business card</h1>
        <p className="mt-2 max-w-2xl text-muted">
          The QR code on the back opens your site at <span className="text-ink">{qrUrl(profile.qrCode)}</span>. That
          link never changes, even if you change your site, so cards you print keep working.
        </p>
      </header>

      <CardStudio initial={getCardTemplateId(profile.theme.cardTemplateId)} paletteId={palette.id} card={card} />

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-line p-5">
          <h2 className="font-bold">Print-ready files</h2>
          <p className="mt-2 text-sm text-muted">
            Three PDFs: one for FedEx Office &quot;Quick Business Cards&quot;, one with bleed for other print shops, and a
            10-per-page sheet for printing at home.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {["FedEx / UPS (3.5 × 2 in)", "Print shop (with bleed)", "Home sheet (Letter, 10-up)"].map((f) => (
              <span key={f} aria-disabled="true" className="rounded-md border border-line px-3 py-2 text-sm text-muted">
                {f}
              </span>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted">PDF downloads are being built next. Your design choice is saved.</p>
        </div>
        <div className="rounded-xl border border-line p-5">
          <h2 className="font-bold">How to print</h2>
          <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm text-[#CFCCC6]">
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
