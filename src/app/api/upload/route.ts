import { auth } from "@clerk/nextjs/server";
import { issueSignedToken } from "@vercel/blob";
import { handleUploadPresigned, type HandleUploadPresignedBody } from "@vercel/blob/client";
import { MAX_PHOTO_BYTES, MAX_RESUME_BYTES } from "@/lib/limits";

const RULES = [
  {
    folder: "resumes",
    allowedContentTypes: [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    maximumSizeInBytes: MAX_RESUME_BYTES,
  },
  { folder: "uploads", allowedContentTypes: ["image/jpeg", "image/png", "image/webp"], maximumSizeInBytes: MAX_PHOTO_BYTES },
];

// Presigns browser uploads straight to Vercel Blob (Vercel caps request bodies at ~4.5 MB, below our
// file limits). Presigned uploads work with either Blob credential: the store's OIDC connection
// (BLOB_STORE_ID) or a BLOB_READ_WRITE_TOKEN. Each URL is scoped to one path in the user's folder.
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Sign in first." }, { status: 401 });

  const body = (await request.json()) as HandleUploadPresignedBody;
  try {
    const result = await handleUploadPresigned({
      body,
      request,
      getSignedToken: async (pathname) => {
        const rule = RULES.find((r) => pathname.startsWith(`${r.folder}/${userId}/`));
        if (!rule || pathname.includes("..")) throw new Error("Invalid upload path");
        const limits = { allowedContentTypes: rule.allowedContentTypes, maximumSizeInBytes: rule.maximumSizeInBytes };
        const token = await issueSignedToken({
          pathname,
          operations: ["put"],
          validUntil: Date.now() + 10 * 60 * 1000,
          ...limits,
        });
        // The browser picks a random path, so no suffix: the final path stays inside the token's scope.
        return { token, urlOptions: limits };
      },
    });
    return Response.json(result);
  } catch (error) {
    console.error("Upload presign failed", error);
    return Response.json({ error: (error as Error).message }, { status: 400 });
  }
}
