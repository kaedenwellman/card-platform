import { get } from "@vercel/blob";

// Serves slide photos from the private Blob store. Only the photos/ folder is readable here, so
// resumes (resumes/) and raw uploads (uploads/) are never exposed. Photo paths carry a random
// suffix and never change, so browsers and Vercel's CDN can cache them indefinitely.
export async function GET(_req: Request, { params }: RouteContext<"/media/[...path]">) {
  const { path } = await params;
  const pathname = path.join("/");
  if (path[0] !== "photos" || path.some((p) => p === ".." || p === "") || !/\.webp$/.test(pathname)) {
    return new Response("Not found", { status: 404 });
  }
  const blob = await get(pathname, { access: "private" }).catch(() => null);
  if (!blob || blob.statusCode !== 200) return new Response("Not found", { status: 404 });
  return new Response(blob.stream, {
    headers: {
      "content-type": "image/webp",
      "cache-control": "public, max-age=31536000, immutable",
      "x-content-type-options": "nosniff",
    },
  });
}
