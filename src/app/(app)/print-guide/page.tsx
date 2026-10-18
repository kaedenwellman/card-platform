import Link from "next/link";
import { List, Section } from "@/components/legal/LegalPage";

export const metadata = { title: "How to print your cards" };

// The printing guide (handoff §9): linked from the card page, the dashboard, and the "you're live"
// email. Public, so it works from an email without signing in.
export default function PrintGuidePage() {
  return (
    <article className="mx-auto flex max-w-2xl flex-col gap-8 pb-8">
      <header>
        <h1 className="text-4xl font-semibold uppercase leading-[0.95] tracking-tight">How to print your cards</h1>
        <p className="mt-3 text-muted">
          Your card files are on{" "}
          <Link href="/card" className="text-ink underline underline-offset-4">
            Print my business card
          </Link>
          . Pick the file for where you&apos;re printing, then follow the steps below.
        </p>
      </header>

      <div className="flex flex-col gap-8 text-[15px] leading-relaxed text-ink/80 [&_strong]:text-ink">
        <Section title="Which file to use">
          <List
            items={[
              <>
                <strong>FedEx / UPS (3.5 × 2 in):</strong> for print counters like FedEx Office or a UPS Store. Two pages:
                front and back.
              </>,
              <>
                <strong>Print shop (with bleed):</strong> for print shops that ask for &ldquo;bleed&rdquo;. The background
                runs ⅛ inch past the edge so nothing white shows after cutting.
              </>,
              <>
                <strong>Home printer (10 per sheet):</strong> a regular letter-size page with cut marks, fronts on page 1
                and backs on page 2.
              </>,
            ]}
          />
        </Section>

        <Section title="At FedEx Office or a UPS Store">
          <List
            items={[
              "Upload the FedEx / UPS file online or bring it on a USB drive or your phone.",
              <>
                At FedEx Office, choose <strong>Quick Business Cards</strong> (ready the same or next day), not Premium
                (about 5 business days).
              </>,
              "Pick double-sided, and a matte, heavier card stock if you have the choice. Matte is easier to scan than glossy.",
              "Ask them to print at actual size, not scaled to fit.",
              "Before they print the whole batch, ask for one proof card and scan it.",
            ]}
          />
        </Section>

        <Section title="At home">
          <List
            items={[
              "Use letter-size card stock (around 80–110 lb cover, matte). Check that your printer can feed it.",
              <>
                In the print dialog, set the size to <strong>100%</strong> or <strong>Actual size</strong>. Never &ldquo;Fit
                to page&rdquo;: it shrinks the cards and throws off the cut marks.
              </>,
              <>
                Print double-sided, <strong>flip on long edge</strong>. If your printer can&apos;t, print page 1, put the
                sheet back in the tray, and print page 2.
              </>,
              "Print one sheet first and hold it up to a light: the fronts and backs should line up.",
              "Cut along the marks at the edges with a paper trimmer, or a ruler and craft knife. Scissors leave wavy edges.",
            ]}
          />
        </Section>

        <Section title="Test before you hand any out">
          <p>
            Open your phone&apos;s camera, point it at the QR code on a printed card, and tap the link. It should open your
            site. Your first scan also completes the last step of the setup guide on your dashboard.
          </p>
        </Section>

        <Section title="If the QR code won't scan">
          <List
            items={[
              "Make sure the card was printed at 100%. A shrunken code is harder to read.",
              "Glossy paper can glare under bright lights. Tilt the card or use matte stock.",
              "Low ink or toner makes the black squares patchy. Reprint with fresh ink.",
              "Keep the white square around the code intact when cutting; the code needs that border.",
            ]}
          />
          <p>
            Your QR code always points to the same link, so you can keep editing your site without reprinting. If it still
            won&apos;t scan, contact us through the email on our{" "}
            <Link href="/terms" className="text-ink underline underline-offset-4">
              Terms
            </Link>{" "}
            page.
          </p>
        </Section>
      </div>
    </article>
  );
}
