import Image from "next/image";
import Link from "next/link";
import { BusinessCard } from "@/components/card/BusinessCard";
import { ScaledFrame } from "@/components/design/ScaledFrame";
import { cardLine, qrSvg, qrUrl, siteOrigin } from "@/lib/card";
import { CARD_TEMPLATES, TEMPLATES, getPalette } from "@/lib/design";
import { HeroBrutal, HeroCinematic, HeroEditorial, HeroOriginal } from "@/components/landing/Heroes";
import "@/components/landing/looks.css";
import { EXAMPLES, headshotOf } from "@/seed/examples";

const label = "lp-label font-mono text-[11px] uppercase tracking-[0.22em] text-muted";

export default async function Home() {
  // One sample person per card design, so the row shows different names and majors.
  const people = [EXAMPLES.john, EXAMPLES.maya, EXAMPLES.marcus, EXAMPLES.sofia, EXAMPLES.maya];
  const faces = await Promise.all(
    people.map(async (p) => ({
      name: p.name,
      line: cardLine(p.headline),
      phone: p.phone,
      email: p.email,
      photoUrl: headshotOf(p),
      qrSvg: await qrSvg(qrUrl(p.qrCode)),
      domain: new URL(siteOrigin()).host,
    })),
  );
  const cardPalettes = ["gold", "crimson", "ocean", "charcoal", "gold"] as const;

  return (
    // look-scope: the landing-page looks (looks.css) only apply on pages containing it.
    <div className="look-scope flex flex-col pb-16">
      <HeroOriginal />
      <HeroEditorial />
      <HeroCinematic />
      <HeroBrutal />

      <section className="lp-section border-b border-line py-12">
        <p className={label}>Real sites</p>
        <div className="mt-6 grid gap-10 md:grid-cols-2 md:gap-8">
          <a href="https://meetkaeden.site" target="_blank" rel="noopener" className="group block">
            <div className="lp-frame overflow-hidden border border-line group-hover:border-muted">
              <ScaledFrame src="/kaeden" width={1280} height={800} title="meetkaeden.site" />
            </div>
            <p className="lp-caption mt-3 flex justify-between text-sm">
              <span className="group-hover:text-gold">meetkaeden.site ↗</span>
              <span className="text-muted">Carousel</span>
            </p>
          </a>
          <a href="https://brysonstates.website" target="_blank" rel="noopener" className="group block">
            <div className="lp-frame overflow-hidden border border-line group-hover:border-muted">
              <Image
                src="/examples/bryson-site.webp"
                alt="brysonstates.website"
                width={2000}
                height={1352}
                className="aspect-[16/10] w-full object-cover object-top"
              />
            </div>
            <p className="lp-caption mt-3 flex justify-between text-sm">
              <span className="group-hover:text-gold">brysonstates.website ↗</span>
              <span className="text-muted">Profile</span>
            </p>
          </a>
        </div>
      </section>

      <section className="lp-section border-b border-line py-12">
        <p className={label}>Layouts</p>
        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
          {TEMPLATES.map((t, i) => (
            <div key={t.id}>
              <div className="lp-frame overflow-hidden border border-line">
                <ScaledFrame
                  src={`/examples/${t.id}?palette=${["gold", "charcoal", "ocean", "paper"][i]}`}
                  width={390}
                  height={700}
                  title={`${t.name} layout`}
                />
              </div>
              <p className="lp-caption mt-3 text-sm">{t.name}</p>
              <p className="lp-desc text-sm text-muted">{t.description}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 text-sm text-muted">Each layout comes in six color palettes.</p>
      </section>

      <section className="lp-section border-b border-line py-12">
        <p className={label}>Cards</p>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {CARD_TEMPLATES.map((t, i) => (
            <div key={t.id} className="lp-card">
              <BusinessCard design={t.id} palette={getPalette(cardPalettes[i])} side="front" card={faces[i]} />
              <p className="lp-caption mt-3 text-sm">{t.name}</p>
            </div>
          ))}
          <div className="lp-card">
            <BusinessCard design="classic" palette={getPalette("gold")} side="back" card={faces[0]} />
            <p className="lp-caption mt-3 text-sm">Back</p>
          </div>
        </div>
        <p className="mt-8 max-w-xl text-sm text-muted">
          The QR code always goes to the same link, so cards you&apos;ve already handed out keep working after you edit
          your site. Print them at FedEx Office, a UPS Store, or at home.
        </p>
      </section>

      <section className="lp-section lp-steps grid gap-8 py-12 md:grid-cols-[1fr_auto] md:items-end">
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
        <Link href="/create" className="lp-link text-gold underline underline-offset-4 hover:text-ink">
          Start →
        </Link>
      </section>
    </div>
  );
}
