import "server-only";
import QRCode from "qrcode";
import type { PublicProfile } from "./profile-types";
import { firstPhoto } from "@/components/profile/shared";

export type CardData = {
  name: string;
  line: string; // one line under the name
  phone: string | null;
  email: string | null;
  photoUrl: string | null;
  qrSvg: string;
  domain: string; // printed under the QR
};

// The site's public origin, e.g. https://BRAND.com. Printed QR codes point here, so in production
// set NEXT_PUBLIC_SITE_URL to the permanent domain before anyone prints a card.
export function siteOrigin() {
  const env = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");
  if (env) return env;
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return vercel ? `https://${vercel}` : "http://localhost:3000";
}

// The QR always encodes the permanent short link /c/{code}, never the slug (§5 of the handoff).
export function qrUrl(qrCode: string) {
  return `${siteOrigin()}/c/${qrCode}`;
}

// Vector QR, error correction Q, 4-module quiet zone, black on white.
export async function qrSvg(url: string) {
  return QRCode.toString(url, {
    type: "svg",
    errorCorrectionLevel: "Q",
    margin: 4,
    color: { dark: "#000000", light: "#ffffff" },
  });
}

// "Electrical Engineering @ UCCS · D2 Track & Field · Builder" -> first segment, for the card's one line.
// Over 60 characters, it's cut at a word boundary, dropping a dangling "with", "@", "and" etc.
export function cardLine(headline: string) {
  const first = headline.split(/\s[·|•]\s/)[0].trim();
  if (first.length <= 60) return first;
  const words = first.slice(0, 61).split(/\s+/).slice(0, -1);
  while (words.length > 1 && /^(@|&|-|–|,|and|or|of|in|at|for|with|the|a|an|to)$/i.test(words[words.length - 1]!)) words.pop();
  return words.join(" ").replace(/[,;:–-]+$/, "");
}

export async function cardData(profile: PublicProfile): Promise<CardData> {
  return {
    name: profile.name,
    line: cardLine(profile.headline),
    phone: profile.showPhoneOnCard ? profile.phone : null,
    email: profile.email || null,
    photoUrl: firstPhoto(profile)?.url ?? null,
    qrSvg: await qrSvg(qrUrl(profile.qrCode)),
    domain: new URL(siteOrigin()).host,
  };
}
