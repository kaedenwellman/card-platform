import Link from "next/link";
import { redirect } from "next/navigation";
import { hasDatabase } from "@/db";
import { ensureUser, getOwnedDraft } from "@/lib/owner";

export const metadata = { title: "Your draft" };

// M2: review the AI draft. M3 turns this into the full editor with live preview.
export default async function EditPage({ searchParams }: PageProps<"/edit">) {
  const { photo } = await searchParams;
  const user = hasDatabase() ? await ensureUser() : null;
  const data = user ? await getOwnedDraft(user.id) : null;
  if (!data) redirect("/start");
  const { profile, slides } = data;
  const sections = [...new Set(slides.map((s) => s.section))];

  return (
    <section className="flex flex-col gap-8">
      <div className="rounded-md border border-gold/60 bg-gold/10 p-4 text-sm">
        <b className="text-gold">Review everything.</b> The AI drafted this from your resume. Check every
        line against it before you publish.
      </div>
      {typeof photo === "string" && (
        <p className="rounded-md border border-line p-4 text-sm">
          Your photo wasn&apos;t added: {photo} You can add one in the editor.
        </p>
      )}

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold leading-tight [font-stretch:112%]">{profile.name}</h1>
          {profile.headline && <p className="mt-1 text-muted">{profile.headline}</p>}
          <p className="mt-2 text-sm text-muted">
            Draft address: <span className="text-ink">/{profile.slug}</span> (not public yet)
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/preview"
            className="rounded-md bg-gold px-5 py-3 font-bold text-black [font-stretch:110%] hover:bg-ink"
          >
            Preview my site
          </Link>
          <Link href="/start" className="rounded-md border border-line px-5 py-3 hover:border-gold">
            Upload a different resume
          </Link>
        </div>
      </header>

      {slides.length === 0 ? (
        <div className="rounded-md border border-line p-4">
          <h2 className="font-bold">We couldn&apos;t draft your slides automatically.</h2>
          <p className="mt-1 text-sm text-muted">
            Your resume text is below. The editor, coming next, lets you build the slides from it by hand.
            You can also try uploading again.
          </p>
        </div>
      ) : (
        <ol className="flex flex-col gap-6">
          {sections.map((section) => (
            <li key={section}>
              <h2 className="mb-2 text-sm uppercase tracking-widest text-muted">{section}</h2>
              <ul className="flex flex-col gap-3">
                {slides
                  .filter((s) => s.section === section)
                  .map((s) => (
                    <li key={s.id} className="rounded-md border border-line p-4">
                      <p className="font-bold">{s.title}</p>
                      {s.role && <p className="text-sm text-gold">{s.role}</p>}
                      {s.body && <p className="mt-2 text-sm text-[#CFCCC6]">{s.body}</p>}
                      {s.points.length > 0 && (
                        <ul className="mt-2 list-disc pl-5 text-sm text-[#CFCCC6] marker:text-gold">
                          {s.points.map((p, i) => (
                            <li key={i}>{p.replace(/\*\*/g, "")}</li>
                          ))}
                        </ul>
                      )}
                      {s.link && <p className="mt-2 text-sm text-gold">{s.link.label} → {s.link.href}</p>}
                    </li>
                  ))}
              </ul>
            </li>
          ))}
        </ol>
      )}

      {profile.resumeText && (
        <details open={slides.length === 0} className="rounded-md border border-line p-4">
          <summary className="cursor-pointer font-bold">Your resume text</summary>
          <pre className="mt-3 whitespace-pre-wrap font-sans text-sm text-[#CFCCC6]">{profile.resumeText}</pre>
        </details>
      )}
    </section>
  );
}
