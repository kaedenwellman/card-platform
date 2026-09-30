import type { PublicProfile } from "@/lib/profile-types";
import { SocialLinks, contactInfo } from "./shared";

// Contact + resume + links + future projects, shared by the one-page layouts. No JavaScript:
// "Future projects" uses <details>.
export function SiteFooter({ profile, id }: { profile: PublicProfile; id?: string }) {
  const c = contactInfo(profile);
  return (
    <footer className="site-footer" id={id}>
      <h2 className="site-label">Contact</h2>
      <div className="site-contact">
        {c.email && (
          <a className="site-btn" href={`mailto:${c.email}`}>
            {c.email}
          </a>
        )}
        {c.tel && (
          <a className="site-btn" href={c.tel}>
            {c.phone}
          </a>
        )}
      </div>
      {c.resume && (
        <div className="site-resume">
          <a className="site-primary" href={c.resume} target="_blank" rel="noopener">
            View my full resume
          </a>
          <a className="site-download" href={c.resume} download={c.downloadName}>
            Download PDF
          </a>
        </div>
      )}
      <SocialLinks profile={profile} className="site-social" />
      {profile.future.length > 0 && (
        <details className="site-future">
          <summary>Future projects</summary>
          <ul>
            {profile.future.map((f, i) => (
              <li key={i}>
                <b>{f.title}</b>
                <span>{f.body}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </footer>
  );
}
