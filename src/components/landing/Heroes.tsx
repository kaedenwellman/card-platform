import Link from "next/link";
import type { ReactNode } from "react";
import { Card3D } from "./Card3D";

// The landing-page hero (Editorial look, after Raw Goods): copy on the left, a spinnable 3D
// business card on the right, then a black strip and a scrolling blue ticker.

export type HeroCard = { front: ReactNode; back: ReactNode; label: string };

const Spinner = ({ card }: { card: HeroCard }) => <Card3D front={card.front} back={card.back} label={card.label} />;

const TICKER = ["Upload your resume", "Pick a layout", "Publish your site", "Print your cards"];

export function HeroEditorial({ card }: { card: HeroCard }) {
  const run = Array.from({ length: 4 }, () => TICKER).flat();
  return (
    <section className="ed-hero">
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
