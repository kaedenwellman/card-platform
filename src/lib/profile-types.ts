import type { FutureItem, ProfileFields, Slide } from "./validation";

export type ProfileStatus = "draft" | "active" | "lapsed" | "removed";

// Everything a public page needs, independent of where it was loaded from.
export type PublicProfile = ProfileFields & {
  slug: string;
  qrCode: string;
  status: ProfileStatus;
  slides: Slide[];
  future: FutureItem[];
};
