import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { hasDatabase } from "@/db";
import { getPalette, getTemplateId } from "@/lib/design";
import { ensureUser, getOwnedDraft } from "@/lib/owner";
import { AddContentForm } from "./AddContentForm";
import { DesignEditor } from "./DesignEditor";
import { RemoveEntryButton } from "./RemoveEntryButton";

export const metadata = { title: "Update your website" };

const label = "font-mono text-[11px] uppercase tracking-[0.22em] text-muted";

export default async function EditPage({ searchParams }: PageProps<"/edit">) {
  const { photo } = await searchParams;
  const { userId: clerkId } = await auth.protect();
  const user = hasDatabase() ? await ensureUser() : null;
  const data = user ? await getOwnedDraft(user.id) : null;
  if (!data) redirect("/dashboard");
  const { profile, slides } = data;
  const sections = [...new Set(slides.map((s) => s.section))];
  const isDraft = profile.status === "draft";

  return (
    <section className="flex flex-col gap-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold leading-tight [font-stretch:112%]">{profile.name}</h1>
          {profile.headline && <p className="mt-1 text-muted">{profile.headline}</p>}
          <p className="mt-2 text-sm text-muted">
            /{profile.slug} · {isDraft ? "draft, not public yet" : "live"}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/preview" className="rounded-sm bg-gold px-5 py-3 font-bold text-black [font-stretch:110%] hover:bg-ink">
            Preview my site
          </Link>
          {isDraft && (
            <Link href="/start" className="rounded-sm border border-line px-5 py-3 hover:border-muted">
              Upload a different resume
            </Link>
          )}
        </div>
      </header>

      <p className="-mt-4 border-l-2 border-gold pl-3 text-sm text-muted">
        The AI wrote this from what you gave it. Read every line before you share your site.
      </p>
      {typeof photo === "string" && <p className="-mt-4 text-sm text-red-300">Your photo wasn&apos;t added: {photo}</p>}

      <section className="flex flex-col gap-4 border-t border-line pt-8">
        <h2 className={label}>Design</h2>
        <DesignEditor
          initial={{ templateId: getTemplateId(profile.theme.templateId), paletteId: getPalette(profile.theme.paletteId).id }}
        />
      </section>

      <section className="flex flex-col gap-4 border-t border-line pt-8">
        <h2 className={label}>Content</h2>
        {slides.length === 0 ? (
          <p className="text-sm text-muted">
            Nothing on your site yet. Add your first entry below, or upload your resume again.
          </p>
        ) : (
          <div className="flex flex-col gap-8">
            {sections.map((section) => (
              <div key={section}>
                <h3 className="mb-1 text-sm text-muted">{section}</h3>
                <ul className="border-t border-line">
                  {slides
                    .filter((s) => s.section === section)
                    .map((s) => (
                      <li key={s.id} className="flex items-start justify-between gap-4 border-b border-line py-4">
                        <div className="min-w-0">
                          <p className="font-bold">{s.title}</p>
                          {s.role && <p className="text-sm text-gold">{s.role}</p>}
                          {s.body && <p className="mt-2 text-sm text-ink/80">{s.body}</p>}
                          {s.points.length > 0 && (
                            <ul className="mt-2 list-disc pl-5 text-sm text-ink/80 marker:text-gold">
                              {s.points.map((p, i) => (
                                <li key={i}>{p.replace(/\*\*/g, "")}</li>
                              ))}
                            </ul>
                          )}
                          {s.link && (
                            <p className="mt-2 break-all text-sm text-gold">
                              {s.link.label} → {s.link.href}
                            </p>
                          )}
                          {s.media && <p className="mt-2 text-xs text-muted">Has a {s.media.type === "video" ? "video" : "photo"}</p>}
                        </div>
                        <RemoveEntryButton id={s.id} title={s.title} />
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      <section id="add" className="flex scroll-mt-6 flex-col gap-4 border-t border-line pt-8">
        <div>
          <h2 className={label}>Add content</h2>
          <p className="mt-2 text-sm text-muted">A job, project, club, award, anything you want on your site. It shows up right away.</p>
        </div>
        <AddContentForm clerkId={clerkId} sections={sections} />
      </section>

      {profile.resumeText && (
        <details className="border-t border-line pt-8">
          <summary className="cursor-pointer text-sm text-muted">What we built this from</summary>
          <pre className="mt-3 whitespace-pre-wrap font-sans text-sm text-ink/80">{profile.resumeText}</pre>
        </details>
      )}
    </section>
  );
}
