import type { CSSProperties } from "react";
import { getPalette, paletteVars } from "@/lib/design";
import type { PublicProfile } from "@/lib/profile-types";
import { safeColor } from "@/lib/safe";
import "./profile.css";

// Shown when a profile's subscription has lapsed. The owner's reactivate prompt comes in M5.
export function ContactOnlyView({ profile }: { profile: PublicProfile }) {
  const palette = getPalette(profile.theme.paletteId);
  const accent = profile.theme.accent ? safeColor(profile.theme.accent, palette.accent) : undefined;
  return (
    <div className="kp kp-carousel" style={paletteVars(palette, accent) as CSSProperties}>
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
