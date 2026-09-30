import { SafeImg } from "./SafeImg";
import { SiteFooter } from "./SiteFooter";
import { EntryText, contactInfo, firstPhoto, sectionsOf, type TemplateProps } from "./shared";

// "Timeline" layout: a visual resume read top to bottom, each entry a stop on one line.
export function TimelineTemplate({ profile, rootStyle }: TemplateProps) {
  const photo = firstPhoto(profile);
  const c = contactInfo(profile);
  const sections = sectionsOf(profile);

  return (
    <div className="kp kp-one kp-timeline" style={rootStyle}>
      <div className="tl-wrap">
        <header className="tl-head">
          {photo && (
            <SafeImg className="tl-photo" src={photo.url} alt={profile.name} style={{ objectPosition: photo.position }} fallback={null} />
          )}
          <div>
            <h1 className="tl-name">{profile.name}</h1>
            {profile.headline && <p className="tl-headline">{profile.headline}</p>}
          </div>
          <nav className="tl-contact" aria-label="Contact">
            {c.tel && <a href={c.tel}>Call</a>}
            {c.email && <a href={`mailto:${c.email}`}>Email</a>}
          </nav>
        </header>

        <main>
          {sections.map((s) => (
            <section key={s.id} id={s.id} className="tl-section">
              <h2 className="tl-section-name">{s.name}</h2>
              <ol className="tl-line">
                {s.slides.map((slide, i) => (
                  <li key={i} className="tl-stop">
                    <h3>{slide.title}</h3>
                    {slide.role && <p className="role">{slide.role}</p>}
                    <EntryText slide={slide} />
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </main>

        <SiteFooter profile={profile} />
      </div>
    </div>
  );
}
