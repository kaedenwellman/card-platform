import Link from "next/link";

// One hero per landing-page look. All four are rendered; looks.css shows the one matching
// <html data-look>, so switching is instant and the server-rendered page never flashes.

export function HeroOriginal() {
  return (
    <section className="look-only look-only-original border-b border-line pb-14 pt-8 sm:pt-16">
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
  );
}

const TICKER = ["Upload your resume", "Pick a layout", "Publish your site", "Print your cards"];

// Raw Goods: giant grotesk headline, catalog grid lines, black strip, scrolling yellow ticker.
export function HeroEditorial() {
  const run = Array.from({ length: 4 }, () => TICKER).flat();
  return (
    <section className="look-only look-only-editorial ed-hero">
      <div className="ed-top">
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
export function HeroCinematic() {
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
    </section>
  );
}

// Brutal Shop: mono type on paper, thick borders, hard shadows, a sticker.
export function HeroBrutal() {
  return (
    <section className="look-only look-only-brutal br-hero">
      <span className="br-sticker" aria-hidden="true">
        New
      </span>
      <p className="br-kicker">Start here</p>
      <h1 className="br-title">Resume → site + card</h1>
      <div className="br-row">
        <ol className="br-chips">
          <li className="is-on">1 · Upload</li>
          <li>2 · Pick a layout</li>
          <li>3 · Print</li>
        </ol>
        <Link href="/create" className="br-search">
          <span aria-hidden="true">⌕</span> Start with your resume…
        </Link>
      </div>
    </section>
  );
}
