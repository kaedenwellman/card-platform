import Link from "next/link";
import type { ReactNode } from "react";
import { Card3D } from "./Card3D";

// One hero per landing-page look. All are rendered; looks.css shows the one matching
// <html data-look>, so switching is instant and the server-rendered page never flashes. Each hero
// puts its copy on the left and a spinnable 3D business card on the right.

export type HeroCard = { front: ReactNode; back: ReactNode; label: string };

const Spinner = ({ card }: { card: HeroCard }) => <Card3D front={card.front} back={card.back} label={card.label} />;

export function HeroOriginal({ card }: { card: HeroCard }) {
  return (
    <section className="look-only look-only-original hero-split border-b border-line pb-14 pt-8 sm:pt-14">
      <div>
        <h1 className="text-[44px] font-extrabold leading-[0.92] tracking-tight [font-stretch:125%] sm:text-6xl lg:text-[52px]">
          A website and a business card, made from your resume.
        </h1>
        <p className="mt-8 max-w-md text-muted">
          Upload your resume and pick a layout. You get a site that works on a phone and a card with a QR code that
          opens it.
        </p>
        <Link
          href="/create"
          className="mt-8 inline-block rounded-sm bg-gold px-7 py-3.5 font-bold text-black [font-stretch:110%] hover:bg-ink"
        >
          Start →
        </Link>
      </div>
      <Spinner card={card} />
    </section>
  );
}

const TICKER = ["Upload your resume", "Pick a layout", "Publish your site", "Print your cards"];

// Raw Goods: giant grotesk headline, catalog grid lines, black strip, scrolling blue ticker.
export function HeroEditorial({ card }: { card: HeroCard }) {
  const run = Array.from({ length: 4 }, () => TICKER).flat();
  return (
    <section className="look-only look-only-editorial ed-hero">
      <div className="ed-top">
        <div className="ed-copy">
          <h1 className="ed-title">
            Your resume,
            <br />
            as a website
            <br />
            and a card
          </h1>
          <div className="ed-side">
            <p>Personal sites and print-ready business cards for students and new grads.</p>
            <Link href="/create" className="ed-btn">
              Start →
            </Link>
          </div>
        </div>
        <div className="ed-cardcol">
          <Spinner card={card} />
        </div>
      </div>
      <div className="ed-strip">Print at FedEx, UPS, or home · The QR link never changes</div>
      <div className="ed-ticker" aria-hidden="true">
        <div className="ed-ticker-run">
          {[0, 1].map((half) => (
            <span key={half}>
              {run.map((t, i) => (
                <span key={i}>
                  {t}
                  <b> • </b>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// Orvexa: warm light-streak glow behind centered light type and a white pill button.
export function HeroCinematic({ card }: { card: HeroCard }) {
  return (
    <section className="look-only look-only-cinematic cn-hero">
      <div className="cn-glow" aria-hidden="true" />
      <div className="cn-content">
        <p className="cn-kicker">Open to opportunities</p>
        <h1 className="cn-title">Turn your resume into a site people remember.</h1>
        <p className="cn-sub">A personal website, and a business card that opens it.</p>
        <Link href="/create" className="cn-btn">
          Get started <span aria-hidden="true">→</span>
        </Link>
        <p className="cn-note">
          <span aria-hidden="true">☆ ☆ ☆ ☆</span> Made for internships, recruiting, and first jobs
        </p>
      </div>
      <div className="cn-card">
        <Spinner card={card} />
      </div>
    </section>
  );
}
