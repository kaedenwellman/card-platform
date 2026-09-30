import { uploadPresigned } from "@vercel/blob/client";
import { MAX_PHOTO_BYTES } from "./limits";

// Browser side: uploads a photo straight to the private Blob store (see /api/upload) and returns
// its pathname for a server action to process. Throws a user-facing message.
export async function uploadPhoto(file: File, clerkId: string) {
  if (file.size > MAX_PHOTO_BYTES) throw new Error("Photos can be at most 8 MB.");
  const ext = file.name.toLowerCase().match(/\.(jpe?g|png|webp)$/)?.[1]?.replace("jpeg", "jpg");
  if (!ext) throw new Error("Use a JPG, PNG, or WebP photo.");
  const blob = await uploadPresigned(`uploads/${clerkId}/${crypto.randomUUID()}.${ext}`, file, {
    access: "private",
    handleUploadUrl: "/api/upload",
  });
  return blob.pathname;
}
