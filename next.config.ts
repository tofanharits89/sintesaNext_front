import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  basePath: "/v3/next",
  eslint: {
    // Allow production builds to complete even if there are ESLint errors in CI
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@shared": path.resolve(__dirname, "./src/shared"),
    };
    return config;
  },
  turbopack: {
    resolveAlias: {
      "@shared": "./src/shared",
    },
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/v3/next/login",
        permanent: false,
        basePath: false,
      },
    ];
  },

};

export default nextConfig;
