import Image from "next/image";
import Link from "next/link";
import { BusinessCard } from "@/components/card/BusinessCard";
import { ScaledFrame } from "@/components/design/ScaledFrame";
import { cardLine, qrSvg, qrUrl, siteOrigin } from "@/lib/card";
import { TEMPLATES, getPalette } from "@/lib/design";
import { KAEDEN } from "@/seed/kaeden";

const cta = "rounded-md bg-gold px-8 py-4 text-center font-bold text-black [font-stretch:110%] hover:bg-ink";

// Landing page. M6 adds pricing; examples and the flow are here now.
export default async function Home() {
  const kaedenCard = {
    name: KAEDEN.name,
    line: cardLine(KAEDEN.headline),
    phone: KAEDEN.phone,
    email: KAEDEN.email,
    photoUrl: "/seed/kaeden/about.jpg",
    qrSvg: await qrSvg(qrUrl(KAEDEN.qrCode)),
    domain: new URL(siteOrigin()).host,
  };
  const gold = getPalette("gold");

  return (
    <div className="flex flex-col gap-20 pb-10">
      <section className="flex flex-col gap-6 pt-6 sm:pt-12">
        <h1 className="max-w-3xl text-4xl font-extrabold leading-[0.95] [font-stretch:125%] sm:text-6xl">
          Your resume, as a website and a business card.
        </h1>
        <p className="max-w-xl text-lg text-muted">
          Upload your resume. Get a personal site that looks great on a phone, and a print-ready card with a QR code
          that opens it. Built for students, athletes, and anyone who wants more than a PDF.
        </p>
        <div className="flex flex-wrap items-center gap-5">
          <Link href="/create" className={cta}>
            Get started
          </Link>
          <a href="#examples" className="text-gold underline underline-offset-4">
            See examples
          </a>
        </div>
      </section>

      <section id="examples" className="flex scroll-mt-6 flex-col gap-6">
        <h2 className="text-2xl font-extrabold [font-stretch:112%]">Real examples</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <Link href="/kaeden" className="group overflow-hidden rounded-xl border border-line hover:border-gold">
            <ScaledFrame src="/kaeden" width={1280} height={800} title="Kaeden Wellman's site" />
            <div className="flex items-baseline justify-between gap-3 p-4">
              <div>
                <p className="font-bold">Kaeden Wellman</p>
                <p className="text-sm text-muted">Electrical Engineering, UCCS · Carousel layout</p>
              </div>
              <span className="text-sm text-gold group-hover:underline">Open ↗</span>
            </div>
          </Link>
          <div className="overflow-hidden rounded-xl border border-line">
            <Image
              src="/examples/bryson-site.webp"
              alt="Bryson States's site: photo, key stats, and sections on one page"
              width={2000}
              height={1352}
              className="aspect-[16/10] w-full object-cover object-top"
            />
            <div className="p-4">
              <p className="font-bold">Bryson States</p>
              <p className="text-sm text-muted">Data Analytics & Systems Engineering, UCCS · Profile layout</p>
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <div>
          <h2 className="text-2xl font-extrabold [font-stretch:112%]">Pick your look</h2>
          <p className="mt-2 text-muted">Four layouts and six color palettes. Change them any time.</p>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {TEMPLATES.map((t, i) => (
            <div key={t.id} className="overflow-hidden rounded-lg border border-line">
              <ScaledFrame
                src={`/examples/${t.id}?palette=${["gold", "charcoal", "ocean", "paper"][i]}`}
                width={390}
                height={700}
                title={`${t.name} layout example`}
              />
              <div className="p-3">
                <p className="font-bold">{t.name}</p>
                <p className="mt-1 text-sm text-muted">{t.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <div>
          <h2 className="text-2xl font-extrabold [font-stretch:112%]">A card that opens your site</h2>
          <p className="mt-2 max-w-xl text-muted">
            Five card designs. The QR on the back never changes, so printed cards keep working even when you update
            your site. Print them yourself at FedEx Office, a UPS Store, or at home.
          </p>
        </div>
        <div className="grid gap-5 rounded-xl border border-line bg-[#0b0b0b] p-5 sm:grid-cols-2 sm:p-8 lg:grid-cols-3">
          <BusinessCard design="classic" palette={gold} side="front" card={kaedenCard} />
          <BusinessCard design="classic" palette={gold} side="back" card={kaedenCard} />
          <BusinessCard design="photo" palette={getPalette("charcoal")} side="front" card={kaedenCard} />
          <BusinessCard design="split" palette={getPalette("ocean")} side="front" card={kaedenCard} />
          <BusinessCard design="bold" palette={getPalette("crimson")} side="front" card={kaedenCard} />
          <BusinessCard design="paper" palette={gold} side="front" card={kaedenCard} />
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-2xl font-extrabold [font-stretch:112%]">How it works</h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {[
            ["Pick your design", "Choose a website layout, colors, and a business card."],
            ["Upload your resume", "AI drafts your site from it, in your resume's order and wording. Nothing made up."],
            ["Review, then share", "Check every line, publish, and print your cards."],
          ].map(([title, body], i) => (
            <li key={title} className="rounded-xl border border-line p-5">
              <span className="text-sm font-bold text-gold">{i + 1}</span>
              <p className="mt-2 font-bold">{title}</p>
              <p className="mt-1 text-sm text-muted">{body}</p>
            </li>
          ))}
        </ol>
        <Link href="/create" className={`${cta} self-start`}>
          Get started
        </Link>
      </section>
    </div>
  );
}
