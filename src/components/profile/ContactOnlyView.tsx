import type { CSSProperties } from "react";
import type { PublicProfile } from "@/lib/profile-types";
import { safeColor } from "@/lib/safe";
import "./profile.css";

// Shown when a profile's subscription has lapsed. The owner's reactivate prompt comes in M5.
export function ContactOnlyView({ profile }: { profile: PublicProfile }) {
  return (
    <div className="kp" style={{ "--gold": safeColor(profile.theme.accent, "#CFB87C") } as CSSProperties}>
      <div className="page">
        <div className="minimal">
          <h1 className="name">
            {profile.name}
            {profile.headline && <small>{profile.headline}</small>}
          </h1>
          {profile.email && (
            <a className="resume" href={`mailto:${profile.email}`}>
              Email {profile.email.split("@")[0]}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
