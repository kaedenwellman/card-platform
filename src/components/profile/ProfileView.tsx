"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import type { PublicProfile } from "@/lib/profile-types";
import type { Slide } from "@/lib/validation";
import { boldSegments, safeColor, safeHref, safePosition, telHref } from "@/lib/safe";
import { GitHubIcon, LinkedInIcon, WebsiteIcon } from "./icons";
import "./profile.css";

const TIP = 44; // desktop: px of the footer left visible above the screen edge

function offsetOf(i: number, current: number, n: number) {
  let d = (i - current) % n;
  if (d > n / 2) d -= n;
  if (d < -n / 2) d += n;
  return d;
}

function Bold({ text }: { text: string }) {
  return boldSegments(text).map((s, i) => (s.bold ? <b key={i}>{s.text}</b> : <span key={i}>{s.text}</span>));
}

function SlideArt({ slide }: { slide: Slide }) {
  const m = slide.media;
  const src = safeHref(m?.url);
  if (m && src && m.type === "video") {
    return <video src={src} muted loop playsInline preload="metadata" style={{ objectPosition: safePosition(m.position) }} />;
  }
  if (m && src && m.type === "image") {
    return m.fit === "contain" ? (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="fill" src={src} alt="" aria-hidden="true" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="whole" src={src} alt={slide.title} loading="lazy" />
      </>
    ) : (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={slide.title} loading="lazy" style={{ objectPosition: safePosition(m.position) }} />
    );
  }
  return (
    <div className="ph" style={{ "--tint": safeColor(slide.tint, "#2a2f45") } as CSSProperties}>
      <i>{slide.section}</i>
      <b>{slide.title}</b>
    </div>
  );
}

export function ProfileView({ profile }: { profile: PublicProfile }) {
  const { slides } = profile;
  const n = slides.length;
  const [current, setCurrent] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLElement>(null);
  const footerRef = useRef<HTMLElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const swiped = useRef(false);
  const startX = useRef<number | null>(null);

  const go = useCallback((i: number) => setCurrent(((i % n) + n) % n), [n]);

  const sections = [...new Set(slides.map((s) => s.section))];
  const slide = slides[current];

  // Only the current slide's video plays.
  useEffect(() => {
    stageRef.current?.querySelectorAll<HTMLVideoElement>(".slide video").forEach((v) => {
      if (v.closest(".slide")?.classList.contains("is-current")) v.play().catch(() => {});
      else v.pause();
    });
  }, [current]);

  // Keep the active tab in view when the tab row scrolls (phones).
  useEffect(() => {
    const tabs = tabsRef.current;
    const b = tabs?.querySelector<HTMLButtonElement>('button[aria-current="true"]');
    if (tabs && b && tabs.scrollWidth > tabs.clientWidth) {
      tabs.scrollTo({ left: b.offsetLeft - tabs.clientWidth / 2 + b.offsetWidth / 2, behavior: "smooth" });
    }
  }, [current]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (dialogRef.current?.open) return;
      if (e.key === "ArrowLeft") go(current - 1);
      if (e.key === "ArrowRight") go(current + 1);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [current, go]);

  // Desktop: tuck the footer below the screen edge so just the top of the resume button shows,
  // and bounce it into view once on load.
  useEffect(() => {
    const footer = footerRef.current;
    if (!footer) return;
    const desktop = () => matchMedia("(min-width: 721px)").matches;
    const peek = () =>
      footer.style.setProperty("--peek-hide", desktop() ? Math.max(0, footer.offsetHeight - TIP) + "px" : "0px");
    peek();
    if (desktop() && footer.getBoundingClientRect().bottom > innerHeight + 1) {
      footer.classList.add("bounce");
      footer.addEventListener("animationend", () => footer.classList.remove("bounce"), { once: true });
    }
    addEventListener("resize", peek);
    return () => removeEventListener("resize", peek);
  }, []);

  const phone = profile.showPhoneOnSite && profile.phone ? profile.phone : null;
  const tel = phone ? telHref(phone) : null;
  const resume = safeHref(profile.resumePdfPublicUrl);
  const github = safeHref(profile.links.github);
  const linkedin = safeHref(profile.links.linkedin);
  const website = safeHref(profile.links.website);
  const link = slide ? safeHref(slide.link?.href) : null;
  const downloadName = `${profile.name.replace(/[^\p{L}\p{N}]+/gu, "_")}_Resume.pdf`;

  return (
    <div className="kp" style={{ "--gold": safeColor(profile.theme.accent, "#CFB87C") } as CSSProperties}>
      <div className="page">
        <header>
          <h1 className="name">
            {profile.name}
            {profile.headline && <small>{profile.headline}</small>}
          </h1>
          <nav className="contact" aria-label="Contact">
            {tel && (
              <a href={tel}>
                <span className="full">{phone}</span>
                <span className="short">Call</span>
              </a>
            )}
            {profile.email && (
              <a href={`mailto:${profile.email}`}>
                <span className="full">{profile.email}</span>
                <span className="short">Email</span>
              </a>
            )}
          </nav>
        </header>

        <main>
          {n > 0 && (
            <>
              <nav className="tabs" ref={tabsRef} aria-label="Resume sections">
                {sections.map((name) => (
                  <button
                    key={name}
                    type="button"
                    aria-current={slide.section === name}
                    onClick={() => go(slides.findIndex((s) => s.section === name))}
                  >
                    {name}
                  </button>
                ))}
              </nav>

              <div
                className="stage"
                ref={stageRef}
                aria-roledescription="carousel"
                aria-label="Resume highlights"
                onPointerDown={(e) => {
                  startX.current = e.clientX;
                  swiped.current = false;
                }}
                onPointerUp={(e) => {
                  if (startX.current === null) return;
                  const dx = e.clientX - startX.current;
                  startX.current = null;
                  if (Math.abs(dx) > 45) {
                    swiped.current = true;
                    go(current + (dx < 0 ? 1 : -1));
                  }
                }}
                onPointerCancel={() => (startX.current = null)}
              >
                {n > 1 && (
                  <button className="arrow prev" aria-label="Previous" onClick={() => go(current - 1)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M15 4 7 12l8 8" />
                    </svg>
                  </button>
                )}
                {n > 1 && (
                  <button className="arrow next" aria-label="Next" onClick={() => go(current + 1)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="m9 4 8 8-8 8" />
                    </svg>
                  </button>
                )}
                {slides.map((s, i) => {
                  const d = offsetOf(i, current, n);
                  const cls = d === 0 ? "is-current" : Math.abs(d) > 1 ? "is-far" : "is-near";
                  return (
                    <div
                      key={i}
                      className={`slide ${cls}`}
                      style={{ "--d": d } as CSSProperties}
                      role="group"
                      aria-label={`${i + 1} of ${n}: ${s.title}`}
                      aria-hidden={d !== 0}
                      onClick={() => {
                        if (!swiped.current && i !== current) go(i);
                      }}
                    >
                      <SlideArt slide={s} />
                    </div>
                  );
                })}
              </div>

              <section className="desc swap" key={current} aria-live="polite">
                <div className="desc-top">
                  <h2>{slide.title}</h2>
                  <span className="count">
                    {current + 1} / {n}
                  </span>
                </div>
                {slide.role && <div className="role">{slide.role}</div>}
                {slide.body && <p className="body">{slide.body}</p>}
                {slide.points.length > 0 && (
                  <ul>
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
              </section>
            </>
          )}
        </main>

        <footer ref={footerRef}>
          {profile.future.length > 0 ? (
            <button className="link-btn" onClick={() => dialogRef.current?.showModal()}>
              Future projects
            </button>
          ) : (
            <span />
          )}
          {resume ? (
            <div className="resume-box">
              <a className="resume" href={resume} target="_blank" rel="noopener">
                View my full resume
              </a>
              <a className="download" href={resume} download={downloadName}>
                Download PDF
              </a>
            </div>
          ) : (
            <span />
          )}
          <div className="social">
            {website && (
              <a className="link-btn" href={website} target="_blank" rel="noopener noreferrer">
                <WebsiteIcon />
                Website
              </a>
            )}
            {linkedin && (
              <a className="link-btn" href={linkedin} target="_blank" rel="noopener noreferrer">
                <LinkedInIcon />
                LinkedIn
              </a>
            )}
            {github && (
              <a className="link-btn" href={github} target="_blank" rel="noopener noreferrer">
                <GitHubIcon />
                GitHub
              </a>
            )}
          </div>
        </footer>
      </div>

      {profile.future.length > 0 && (
        <dialog
          ref={dialogRef}
          onClick={(e) => {
            if (e.target === dialogRef.current) dialogRef.current.close();
          }}
        >
          <h3>Future projects</h3>
          <p className="sub">What I&apos;m building next.</p>
          <ul>
            {profile.future.map((f, i) => (
              <li key={i}>
                <b>{f.title}</b>
                <span>{f.body}</span>
              </li>
            ))}
          </ul>
          <button className="link-btn close" onClick={() => dialogRef.current?.close()}>
            Close
          </button>
        </dialog>
      )}
    </div>
  );
}
