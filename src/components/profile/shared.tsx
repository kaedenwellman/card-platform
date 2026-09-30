import type { CSSProperties } from "react";
import type { PublicProfile } from "@/lib/profile-types";
import { boldSegments, safeColor, safeHref, safePosition, telHref } from "@/lib/safe";
import type { Slide } from "@/lib/validation";
import { GitHubIcon, LinkedInIcon, WebsiteIcon } from "./icons";

export type TemplateProps = { profile: PublicProfile; rootStyle: CSSProperties };

// "**bold** rest" -> <b>bold</b> rest. Never raw HTML.
export function Bold({ text }: { text: string }) {
  return boldSegments(text).map((s, i) => (s.bold ? <b key={i}>{s.text}</b> : <span key={i}>{s.text}</span>));
}

export function SlideArt({ slide, eager = false }: { slide: Slide; eager?: boolean }) {
  const m = slide.media;
  const src = safeHref(m?.url);
  const loading = eager ? "eager" : "lazy";
  if (m && src && m.type === "video") {
    return <video src={src} muted loop playsInline preload="metadata" style={{ objectPosition: safePosition(m.position) }} />;
  }
  if (m && src && m.type === "image") {
    return m.fit === "contain" ? (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="fill" src={src} alt="" aria-hidden="true" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="whole" src={src} alt={slide.title} loading={loading} />
      </>
    ) : (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={slide.title} loading={loading} style={{ objectPosition: safePosition(m.position) }} />
    );
  }
  return (
    <div className="ph" style={{ "--tint": safeColor(slide.tint, "#2a2f45") } as CSSProperties}>
      <i>{slide.section}</i>
      <b>{slide.title}</b>
    </div>
  );
}

// The first image on any slide, used as the headshot in layouts that show one.
export function firstPhoto(profile: PublicProfile) {
  for (const s of profile.slides) {
    const url = safeHref(s.media?.url);
    if (s.media?.type === "image" && url) return { url, position: safePosition(s.media.position) };
  }
  return null;
}

export function contactInfo(profile: PublicProfile) {
  const phone = profile.showPhoneOnSite && profile.phone ? profile.phone : null;
  return {
    phone,
    tel: phone ? telHref(phone) : null,
    email: profile.email || null,
    resume: safeHref(profile.resumePdfPublicUrl),
    github: safeHref(profile.links.github),
    linkedin: safeHref(profile.links.linkedin),
    website: safeHref(profile.links.website),
    downloadName: `${profile.name.replace(/[^\p{L}\p{N}]+/gu, "_")}_Resume.pdf`,
  };
}

export function sectionsOf(profile: PublicProfile) {
  const names = [...new Set(profile.slides.map((s) => s.section))];
  return names.map((name) => ({
    name,
    id: "s-" + name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    slides: profile.slides.filter((s) => s.section === name),
  }));
}

export function SocialLinks({ profile, className }: { profile: PublicProfile; className?: string }) {
  const c = contactInfo(profile);
  return (
    <div className={className}>
      {c.website && (
        <a href={c.website} target="_blank" rel="noopener noreferrer">
          <WebsiteIcon />
          Website
        </a>
      )}
      {c.linkedin && (
        <a href={c.linkedin} target="_blank" rel="noopener noreferrer">
          <LinkedInIcon />
          LinkedIn
        </a>
      )}
      {c.github && (
        <a href={c.github} target="_blank" rel="noopener noreferrer">
          <GitHubIcon />
          GitHub
        </a>
      )}
    </div>
  );
}

// Body, bullets, and link of one entry; shared by the one-page layouts.
export function EntryText({ slide }: { slide: Slide }) {
  const link = safeHref(slide.link?.href);
  return (
    <>
      {slide.body && <p className="body">{slide.body}</p>}
      {slide.points.length > 0 && (
        <ul className="points">
          {slide.points.map((p, i) => (
            <li key={i}>
              <Bold text={p} />
            </li>
          ))}
        </ul>
      )}
      {slide.link && link && (
        <a className="more" href={link} target="_blank" rel="noopener noreferrer">
          {slide.link.label} ↗
        </a>
      )}
    </>
  );
}
