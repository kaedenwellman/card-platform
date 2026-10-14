import "server-only";
import { renderToBuffer } from "@react-pdf/renderer";
import sharp from "sharp";
import { firstPhoto } from "@/components/profile/shared";
import { cardLine, qrUrl, siteOrigin } from "@/lib/card";
import { getCardTemplateId, getPalette } from "@/lib/design";
import type { PublicProfile } from "@/lib/profile-types";
import { readPrivateBlob } from "@/lib/resume/draft";
import { CardDocument, type CardFile } from "./document";
import { registerFonts } from "./fonts";
import { backFace, frontFace, type CardInput } from "./layout";
import { qrMatrix, verifyQr } from "./qr";

export { CardFitError } from "./layout";
export { QrVerifyError } from "./qr";
export type { CardFile } from "./document";

export const CARD_FILES: Record<CardFile, { filename: string }> = {
  trim: { filename: "card-trim.pdf" }, // 3.5 × 2 in, for FedEx / UPS counters
  bleed: { filename: "card-bleed.pdf" }, // 3.75 × 2.25 in, for print shops that want bleed
  sheet: { filename: "card-sheet.pdf" }, // Letter, 10 per sheet with crop marks, for home printing
};

// The card's headshot: the site's first photo, as a square PNG (react-pdf can't read WebP).
async function headshot(profile: PublicProfile): Promise<Buffer | null> {
  const url = firstPhoto(profile)?.url;
  if (!url?.startsWith("/media/photos/")) return null;
  try {
    const bytes = await readPrivateBlob(url.slice("/media/".length));
    if (!bytes) return null;
    return await sharp(bytes).resize(600, 600, { fit: "cover", position: "attention" }).png().toBuffer();
  } catch (err) {
    console.error("Card photo failed; using initials", err);
    return null;
  }
}

// Builds one of the three card PDFs for a profile. Throws CardFitError (text doesn't fit; show the
// message to the owner) or QrVerifyError (the QR didn't decode; never hand that file out).
export async function renderCardPdf(profile: PublicProfile, file: CardFile): Promise<Buffer> {
  registerFonts();
  const design = getCardTemplateId(profile.theme.cardTemplateId);
  const url = qrUrl(profile.qrCode);
  const qr = qrMatrix(url);
  verifyQr(qr, url);

  const input: CardInput = {
    design,
    palette: getPalette(profile.theme.paletteId),
    name: profile.name.trim(),
    line: cardLine(profile.headline),
    phone: profile.showPhoneOnCard ? profile.phone || null : null,
    email: profile.email || null,
    domain: new URL(siteOrigin()).host,
    photo: design === "photo" ? await headshot(profile) : null,
    qr,
  };
  const front = frontFace(input);
  const back = backFace(input);
  return renderToBuffer(<CardDocument file={file} front={front} back={back} title={`${input.name} business card`} />);
}
