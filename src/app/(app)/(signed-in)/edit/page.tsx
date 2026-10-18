import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { hasDatabase } from "@/db";
import { siteOrigin } from "@/lib/card";
import { getPalette, getTemplateId } from "@/lib/design";
import { ensureUser, getOwnedDraft } from "@/lib/owner";
import { BasicsEditor } from "./BasicsEditor";
import { DesignEditor } from "./DesignEditor";
import { EntryForm } from "./EntryForm";
import { EntryItem } from "./EntryItem";
import { FactsEditor } from "./FactsEditor";
import { MoveButtons } from "./MoveButtons";
import { SearchToggle } from "./SearchToggle";
import { SlugEditor } from "./SlugEditor";
import { StartOverButton } from "./StartOverButton";

export const metadata = { title: "Update your website" };

const label = "inline-block self-start border border-line px-2.5 py-1 text-[12px] uppercase tracking-[0.04em] text-ink";

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
          <h1 className="text-4xl font-semibold uppercase leading-[0.95] tracking-tight">{profile.name}</h1>
          <p className="mt-1 text-sm text-muted">
            /{profile.slug} · {isDraft ? "draft, not public yet" : "live"}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/preview" className="bg-ink px-5 py-3 font-bold text-bg hover:bg-gold hover:text-white">
            Preview my site
          </Link>
          {isDraft && (
            <Link href="/start" className="border border-line px-5 py-3 hover:border-muted">
              Upload a different resume
            </Link>
          )}
        </div>
      </header>

      <p className="-mt-4 border-l-2 border-gold pl-3 text-sm text-muted">
        The AI wrote this from what you gave it. Read every line before you share your site.
      </p>
      {typeof photo === "string" && <p className="-mt-4 text-sm text-red-700">Your photo wasn&apos;t added: {photo}</p>}

      <section className="flex flex-col gap-4 border-t border-line pt-8">
        <h2 className={label}>Name and contact</h2>
        <BasicsEditor
          initial={{
            name: profile.name,
            headline: profile.headline,
            email: profile.email,
            phone: profile.phone ?? "",
            linkedin: profile.links.linkedin ?? "",
            github: profile.links.github ?? "",
            website: profile.links.website ?? "",
          }}
        />
      </section>

      <section className="flex flex-col gap-4 border-t border-line pt-8">
        <h2 className={label}>Web address</h2>
        <SlugEditor initial={profile.slug} host={new URL(siteOrigin()).host} isLive={!isDraft} />
      </section>

      <section className="flex flex-col gap-4 border-t border-line pt-8">
        <h2 className={label}>Search engines</h2>
        <SearchToggle initial={profile.noindex} />
      </section>

      <section className="flex flex-col gap-4 border-t border-line pt-8">
        <div>
          <h2 className={label}>Key facts</h2>
          <p className="mt-2 text-sm text-muted">Up to four stat boxes, like your major or GPA. They appear on the Profile layout.</p>
        </div>
        <FactsEditor initial={profile.facts} />
      </section>

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
            {sections.map((section, si) => (
              <div key={section}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <h3 className="text-sm text-muted">{section}</h3>
                  {sections.length > 1 && (
                    <MoveButtons target={{ section }} label={`the ${section} section`} first={si === 0} last={si === sections.length - 1} />
                  )}
                </div>
                <ul className="border-t border-line">
                  {slides
                    .filter((s) => s.section === section)
                    .map((s, i, list) => (
                      <EntryItem
                        key={s.id}
                        first={i === 0}
                        last={i === list.length - 1}
                        clerkId={clerkId}
                        sections={sections}
                        body={s.body}
                        points={s.points}
                        entry={{
                          id: s.id,
                          section: s.section,
                          title: s.title,
                          role: s.role,
                          text: s.points.length ? s.points.join("\n") : (s.body ?? ""),
                          linkUrl: s.link?.href ?? "",
                          linkLabel: s.link?.label ?? "",
                          photoUrl: s.media?.url ?? null,
                          isVideo: s.media?.type === "video",
                        }}
                      />
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
        <EntryForm clerkId={clerkId} sections={sections} />
      </section>

      {isDraft && (
        <section className="flex flex-col gap-3 border-t border-line pt-8">
          <h2 className={label}>Start over</h2>
          <p className="text-sm text-muted">
            Delete this draft and create a new site from scratch. Only possible before you publish.
          </p>
          <StartOverButton />
        </section>
      )}

      {profile.resumeText && (
        <details className="border-t border-line pt-8">
          <summary className="cursor-pointer text-sm text-muted">What we built this from</summary>
          <pre className="mt-3 whitespace-pre-wrap font-sans text-sm text-ink/80">{profile.resumeText}</pre>
        </details>
      )}
    </section>
  );
}
