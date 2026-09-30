import { SiteFooter } from "./SiteFooter";
import { EntryText, SlideArt, contactInfo, sectionsOf, type TemplateProps } from "./shared";

// "Gallery" layout: a grid of cards, each with its photo (or placeholder art) on top.
export function GalleryTemplate({ profile, rootStyle }: TemplateProps) {
  const c = contactInfo(profile);
  const sections = sectionsOf(profile);

  return (
    <div className="kp kp-one kp-gallery" style={rootStyle}>
      <div className="gl-wrap">
        <header className="gl-head">
          <h1 className="gl-name">{profile.name}</h1>
          {profile.headline && <p className="gl-headline">{profile.headline}</p>}
          <nav className="gl-contact" aria-label="Contact">
            {c.tel && <a href={c.tel}>Call</a>}
            {c.email && <a href={`mailto:${c.email}`}>Email</a>}
          </nav>
          <nav className="gl-chips" aria-label="Sections">
            {sections.map((s) => (
              <a key={s.id} href={`#${s.id}`}>
                {s.name}
              </a>
            ))}
          </nav>
        </header>

        <main className="gl-grid">
          {sections.flatMap((s) =>
            s.slides.map((slide, i) => (
              // The first card of each section carries the section's anchor for the chips above.
              <article key={`${s.id}-${i}`} id={i === 0 ? s.id : undefined} className="gl-card">
                <div className="gl-art">
                  <SlideArt slide={slide} />
                </div>
                <div className="gl-text">
                  <p className="gl-kicker">{s.name}</p>
                  <h3>{slide.title}</h3>
                  {slide.role && <p className="role">{slide.role}</p>}
                  <EntryText slide={slide} />
                </div>
              </article>
            )),
          )}
        </main>

        <SiteFooter profile={profile} />
      </div>
    </div>
  );
}
