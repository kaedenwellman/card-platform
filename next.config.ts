import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // react-pdf and its font engine run as plain Node packages, not bundled.
  serverExternalPackages: ["@react-pdf/renderer", "fontkit"],
  // The card PDF route reads its fonts from disk at runtime.
  outputFileTracingIncludes: { "/api/cards/[file]": ["./src/fonts/pdf/**"] },
};

export default nextConfig;
