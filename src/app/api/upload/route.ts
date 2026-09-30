import { auth } from "@clerk/nextjs/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { MAX_PHOTO_BYTES, MAX_RESUME_BYTES } from "@/lib/limits";

// Issues short-lived tokens so the browser uploads straight to Vercel Blob (Vercel caps request
// bodies at ~4.5 MB, below our file limits). Files must go under the signed-in user's own folder.
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Sign in first." }, { status: 401 });

  const body = (await request.json()) as HandleUploadBody;
  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (pathname.startsWith(`resumes/${userId}/`)) {
          return {
            allowedContentTypes: [
              "application/pdf",
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ],
            maximumSizeInBytes: MAX_RESUME_BYTES,
            addRandomSuffix: true,
          };
        }
        if (pathname.startsWith(`uploads/${userId}/`)) {
          return {
            allowedContentTypes: ["image/jpeg", "image/png", "image/webp"],
            maximumSizeInBytes: MAX_PHOTO_BYTES,
            addRandomSuffix: true,
          };
        }
        throw new Error("Invalid upload path");
      },
    });
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 400 });
  }
}
