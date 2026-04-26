import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
});

const nextConfig: NextConfig = {
  // Serwist uses webpack, so we build with --webpack flag.
  // Empty turbopack config suppresses the Turbopack warning in dev.
  turbopack: {},
};

export default withSerwist(nextConfig);
