import type { CSSProperties } from "react";
import { getPalette, getTemplateId, paletteVars } from "@/lib/design";
import type { PublicProfile } from "@/lib/profile-types";
import { safeColor } from "@/lib/safe";
import { CarouselTemplate } from "./CarouselTemplate";
import { GalleryTemplate } from "./GalleryTemplate";
import { ProfileTemplate } from "./ProfileTemplate";
import { TimelineTemplate } from "./TimelineTemplate";
import "./profile.css";
import "./templates.css";

// Renders a profile with its chosen layout and palette. `override` lets previews try other designs.
export function ProfileView({
  profile,
  override,
}: {
  profile: PublicProfile;
  override?: { templateId?: string; paletteId?: string };
}) {
  const templateId = getTemplateId(override?.templateId ?? profile.theme.templateId);
  const palette = getPalette(override?.paletteId ?? profile.theme.paletteId);
  const accent = override?.paletteId ? undefined : profile.theme.accent;
  const rootStyle = paletteVars(palette, accent ? safeColor(accent, palette.accent) : undefined) as CSSProperties;
  const props = { profile, rootStyle };

  switch (templateId) {
    case "profile":
      return <ProfileTemplate {...props} />;
    case "timeline":
      return <TimelineTemplate {...props} />;
    case "gallery":
      return <GalleryTemplate {...props} />;
    default:
      return <CarouselTemplate {...props} />;
  }
}
