import Image from "next/image";
import Link from "next/link";
import { BusinessCard } from "@/components/card/BusinessCard";
import { ScaledFrame } from "@/components/design/ScaledFrame";
import { cardLine, qrSvg, qrUrl, siteOrigin } from "@/lib/card";
import { CARD_TEMPLATES, TEMPLATES, getPalette } from "@/lib/design";
import { EXAMPLE } from "@/seed/example";

const label = "font-mono text-[11px] uppercase tracking-[0.22em] text-muted";

export default async function Home() {
  const sample = {
    name: EXAMPLE.name,
    line: cardLine(EXAMPLE.headline),
    phone: EXAMPLE.phone,
    email: EXAMPLE.email,
    photoUrl: "/seed/kaeden/about.jpg",
    qrSvg: await qrSvg(qrUrl(EXAMPLE.qrCode)),
    domain: new URL(siteOrigin()).host,
  };
  const cardPalettes = ["gold", "gold", "ocean", "charcoal", "gold"] as const;

  return (
    <div className="flex flex-col pb-16">
      <section className="border-b border-line pb-14 pt-8 sm:pt-16">
        <h1 className="max-w-4xl text-[44px] font-extrabold leading-[0.92] tracking-tight [font-stretch:125%] sm:text-7xl">
          A website and a business card, made from your resume.
        </h1>
        <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <p className="max-w-md text-muted">
            Upload your resume and pick a layout. You get a site that works on a phone and a card with a QR code that
            opens it.
          </p>
          <Link
            href="/create"
            className="self-start rounded-sm bg-gold px-7 py-3.5 font-bold text-black [font-stretch:110%] hover:bg-ink sm:self-auto"
          >
            Start →
          </Link>
        </div>
      </section>

      <section className="border-b border-line py-12">
        <p className={label}>Real sites</p>
        <div className="mt-6 grid gap-10 md:grid-cols-2 md:gap-8">
          <a href="https://meetkaeden.site" target="_blank" rel="noopener" className="group block">
            <div className="overflow-hidden border border-line group-hover:border-muted">
              <ScaledFrame src="/kaeden" width={1280} height={800} title="meetkaeden.site" />
            </div>
            <p className="mt-3 flex justify-between text-sm">
              <span className="group-hover:text-gold">meetkaeden.site ↗</span>
              <span className="text-muted">Carousel</span>
            </p>
          </a>
          <a href="https://brysonstates.website" target="_blank" rel="noopener" className="group block">
            <div className="overflow-hidden border border-line group-hover:border-muted">
              <Image
                src="/examples/bryson-site.webp"
                alt="brysonstates.website"
                width={2000}
                height={1352}
                className="aspect-[16/10] w-full object-cover object-top"
              />
            </div>
            <p className="mt-3 flex justify-between text-sm">
              <span className="group-hover:text-gold">brysonstates.website ↗</span>
              <span className="text-muted">Profile</span>
            </p>
          </a>
        </div>
      </section>

      <section className="border-b border-line py-12">
        <p className={label}>Layouts</p>
        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
          {TEMPLATES.map((t, i) => (
            <div key={t.id}>
              <div className="overflow-hidden border border-line">
                <ScaledFrame
                  src={`/examples/${t.id}?palette=${["gold", "charcoal", "ocean", "paper"][i]}`}
                  width={390}
                  height={700}
                  title={`${t.name} layout`}
                />
              </div>
              <p className="mt-3 text-sm">{t.name}</p>
              <p className="text-sm text-muted">{t.description}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 text-sm text-muted">Each layout comes in six color palettes.</p>
      </section>

      <section className="border-b border-line py-12">
        <p className={label}>Cards</p>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {CARD_TEMPLATES.map((t, i) => (
            <div key={t.id}>
              <BusinessCard design={t.id} palette={getPalette(cardPalettes[i])} side="front" card={sample} />
              <p className="mt-3 text-sm">{t.name}</p>
            </div>
          ))}
          <div>
            <BusinessCard design="classic" palette={getPalette("gold")} side="back" card={sample} />
            <p className="mt-3 text-sm">Back</p>
          </div>
        </div>
        <p className="mt-8 max-w-xl text-sm text-muted">
          The QR code always goes to the same link, so cards you&apos;ve already handed out keep working after you edit
          your site. Print them at FedEx Office, a UPS Store, or at home.
        </p>
      </section>

      <section className="grid gap-8 py-12 md:grid-cols-[1fr_auto] md:items-end">
        <ol className="grid gap-4 text-sm sm:grid-cols-3 sm:gap-8">
          <li>
            <span className="text-muted">1 </span>Pick a layout, colors, and a card.
          </li>
          <li>
            <span className="text-muted">2 </span>Upload your resume. We draft the site from it, using only what it says.
          </li>
          <li>
            <span className="text-muted">3 </span>Check it, publish it, print your cards.
          </li>
        </ol>
        <Link href="/create" className="text-gold underline underline-offset-4 hover:text-ink">
          Start →
        </Link>
      </section>
    </div>
  );
}
