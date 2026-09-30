import { SafeImg } from "./SafeImg";
import { SiteFooter } from "./SiteFooter";
import { EntryText, contactInfo, firstPhoto, sectionsOf, type TemplateProps } from "./shared";

// Numbers like "4.0" or "4.0 / 4.36" get the big accent treatment in the stat grid.
const isStat = (v: string) => /^[\d.]+(\s*[/·]\s*[\d.]+\s*\w*)?$/.test(v.trim());

// "Profile" layout, modeled on Bryson's site: photo + key facts, big name, section tabs, one page.
export function ProfileTemplate({ profile, rootStyle }: TemplateProps) {
  const photo = firstPhoto(profile);
  const c = contactInfo(profile);
  const sections = sectionsOf(profile);
  const [first, ...restName] = profile.name.split(" ");

  return (
    <div className="kp kp-one kp-profile" style={rootStyle}>
      <div className="pf-wrap">
        <header className={`pf-hero${photo ? "" : " no-photo"}`}>
          {photo && (
            <div className="pf-photo">
              <SafeImg src={photo.url} alt={profile.name} style={{ objectPosition: photo.position }} fallback={null} />
            </div>
          )}
          <div className="pf-id">
            <h1 className="pf-name">
              {first}
              {restName.length > 0 && <br />}
              {restName.join(" ")}
            </h1>
            {profile.headline && <p className="pf-headline">{profile.headline}</p>}
            <nav className="pf-contact" aria-label="Contact">
              {c.tel && <a href={c.tel}>Call</a>}
              {c.email && <a href={`mailto:${c.email}`}>Email</a>}
            </nav>
          </div>
          {profile.facts.length > 0 && (
            <dl className="pf-facts">
              {profile.facts.map((f, i) => (
                <div key={i} className="pf-fact">
                  <dt>{f.label}</dt>
                  {isStat(f.value) ? (
                    <dd className="stat">
                      <b>{f.value}</b>
                      {f.detail && <span>{f.detail}</span>}
                    </dd>
                  ) : (
                    <dd>
                      <b>{f.value}</b>
                      {f.detail && <span>{f.detail}</span>}
                    </dd>
                  )}
                </div>
              ))}
            </dl>
          )}
        </header>

        <nav className="pf-tabs" aria-label="Sections">
          {sections.map((s) => (
            <a key={s.id} href={`#${s.id}`}>
              {s.name}
            </a>
          ))}
          <a href="#s-contact">Contact</a>
        </nav>

        <main>
          {sections.map((s) => (
            <section key={s.id} id={s.id} className="pf-section">
              <h2 className="pf-label">{s.name}</h2>
              <div className="pf-entries">
                {s.slides.map((slide, i) =>
                  // An "About" summary reads as a big intro paragraph, like Bryson's site.
                  slide.body && slide.points.length === 0 && i === 0 && s === sections[0] ? (
                    <div key={i} className="pf-intro">
                      <p>{slide.body}</p>
                    </div>
                  ) : (
                    <article key={i} className="pf-entry">
                      <h3>{slide.title}</h3>
                      {slide.role && <p className="role">{slide.role}</p>}
                      <EntryText slide={slide} />
                    </article>
                  ),
                )}
              </div>
            </section>
          ))}
        </main>

        <SiteFooter profile={profile} id="s-contact" />
      </div>
    </div>
  );
}
