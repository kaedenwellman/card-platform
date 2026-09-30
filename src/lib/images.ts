import "server-only";
import { put } from "@vercel/blob";
import sharp from "sharp";
import { MAX_PHOTO_BYTES, MIN_PHOTO_WIDTH } from "./limits";

export class PhotoError extends Error {}

// Re-encode an uploaded photo to WebP about 1600px wide (strips EXIF, applies rotation) and store it
// publicly. Rejects photos narrower than 600px, which look blurry on the carousel.
export async function processPhoto(bytes: Uint8Array, pathPrefix: string) {
  if (bytes.byteLength > MAX_PHOTO_BYTES) throw new PhotoError("Photos can be at most 8 MB.");
  let img = sharp(bytes, { failOn: "error" }).rotate();
  const meta = await img.metadata().catch(() => null);
  if (!meta?.width || !meta.format || !["jpeg", "png", "webp"].includes(meta.format)) {
    throw new PhotoError("Use a JPG, PNG, or WebP photo.");
  }
  // After EXIF rotation, portrait photos swap width and height.
  const width = meta.orientation && meta.orientation >= 5 ? meta.height! : meta.width;
  if (width < MIN_PHOTO_WIDTH) throw new PhotoError(`Photos need to be at least ${MIN_PHOTO_WIDTH}px wide.`);
  img = img.resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 80 });
  const out = await img.toBuffer();
  const blob = await put(`${pathPrefix}.webp`, out, {
    access: "public",
    contentType: "image/webp",
    addRandomSuffix: true,
  });
  return blob.url;
}
