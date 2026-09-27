import Link from "next/link";

// M6 replaces this with the real landing page (example site, price, how it works).
export default function Home() {
  return (
    <section className="flex max-w-3xl flex-col gap-6 py-8 sm:py-16">
      <h1 className="text-4xl font-extrabold leading-none [font-stretch:125%] sm:text-6xl">
        Your resume, as a site and a business card.
      </h1>
      <p className="max-w-xl text-lg text-muted">
        Upload your resume. Get a personal site and a print-ready card with a QR code that points to it.
      </p>
      <div className="flex flex-wrap items-center gap-5">
        <Link
          href="/start"
          className="rounded-md bg-gold px-8 py-4 font-bold text-black [font-stretch:110%] hover:bg-ink"
        >
          Get started
        </Link>
        <Link href="/kaeden" className="text-gold underline underline-offset-4">
          See an example
        </Link>
      </div>
    </section>
  );
}
