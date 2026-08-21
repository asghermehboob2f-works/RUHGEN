import path from "node:path";
import type { NextConfig } from "next";

function getBackendTarget(): string {
  const envBackend = (process.env.BACKEND_URL || "").trim().replace(/\/$/, "");
  if (
    !envBackend ||
    envBackend.includes("ruhgen-1.onrender.com") ||
    (process.env.APP_URL && envBackend === process.env.APP_URL.trim().replace(/\/$/, "")) ||
    (process.env.NEXT_PUBLIC_SITE_URL && envBackend === process.env.NEXT_PUBLIC_SITE_URL.trim().replace(/\/$/, ""))
  ) {
    const port = process.env.BACKEND_PORT || "4000";
    return `http://127.0.0.1:${port}`;
  }
  return envBackend;
}

const backend = getBackendTarget();

const nextConfig: NextConfig = {
  cacheComponents: true,
  turbopack: {
    root: path.resolve(__dirname),
  },
  outputFileTracingRoot: path.resolve(__dirname),
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        source: "/media/:path*.mov",
        headers: [
          { key: "Content-Type", value: "video/mp4" },
          { key: "Access-Control-Allow-Origin", value: "*" },
        ],
      },
      {
        source: "/media/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, HEAD, OPTIONS" },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backend}/api/:path*`,
      },
      {
        source: "/media/:path*",
        destination: `${backend}/media/:path*`,
      },
    ];
  },
};

export default nextConfig;
