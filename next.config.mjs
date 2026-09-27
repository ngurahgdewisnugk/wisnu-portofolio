import { readFileSync } from "node:fs";

const pkg = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf8")
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // Self-contained server bundle for a small Docker runtime image.
  output: "standalone",

  // Build metadata is inlined at build time so the server-rendered HTML and
  // the browser bundle always agree. The Dockerfile passes GIT_SHA/BUILD_TIME
  // as build args; local builds fall back to "dev".
  env: {
    APP_VERSION: pkg.version,
    GIT_SHA: process.env.GIT_SHA ?? "dev",
    BUILD_TIME: process.env.BUILD_TIME ?? "",
  },

  images: {
    // Images are served as-is; the Image Optimization API stays disabled,
    // which also removes its attack surface on a self-hosted server.
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "opengraph.githubassets.com", pathname: "/**" },
      { protocol: "https", hostname: "repository-images.githubusercontent.com", pathname: "/**" },
    ],
  },

  // Short, conventional ops endpoints backed by API routes.
  async rewrites() {
    return [
      { source: "/health", destination: "/api/health" },
      { source: "/version", destination: "/api/version" },
    ];
  },

  async headers() {
    const securityHeaders = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ];
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        source: "/api/:path(health|version|metrics)",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
    ];
  },
};

export default nextConfig;
