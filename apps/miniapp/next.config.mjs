import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" }
];

const emptyPolyfills = path.resolve(import.meta.dirname, "./lib/empty-polyfills.js");
const polyfillModulePath = require.resolve("next/dist/build/polyfills/polyfill-module.js");

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: path.join(import.meta.dirname, "../.."),
  transpilePackages: [
    "@yield-copilot/agents",
    "@yield-copilot/celo",
    "@yield-copilot/shared",
    "@yield-copilot/ui"
  ],
  experimental: {
    optimizeCss: true,
  },
  webpack(config, { isServer }) {
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        [polyfillModulePath]: emptyPolyfills,
      };
    }
    return config;
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders
      }
    ];
  }
};

export default nextConfig;
