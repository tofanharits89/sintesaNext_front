import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // basePath: "/v3/next", // Commented out to serve at root
  
  // Performance optimizations
  poweredByHeader: false,
  compress: true,
  
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  
  eslint: {
    // Ignore ESLint during builds to prevent lint errors from blocking production builds
    // Lint can still be run via `npm run lint` separately in CI or locally
    ignoreDuringBuilds: true,
  },
  
  typescript: {
    // Only ignore build errors in CI, fail locally to catch issues early
    ignoreBuildErrors: process.env.CI === 'true',
  },
  
  webpack: (config, { dev, isServer }) => {
    // Alias configuration
    config.resolve.alias = {
      ...config.resolve.alias,
      "@shared": path.resolve(__dirname, "./src/shared"),
      // Force legacy pdfjs-dist build in Node.js environments to avoid warnings
      // This affects only the server bundle when isServer === true
      ...(isServer
        ? {
            "pdfjs-dist/build/pdf": "pdfjs-dist/legacy/build/pdf",
            "pdfjs-dist/build/pdf.worker": "pdfjs-dist/legacy/build/pdf.worker",
            "pdfjs-dist/build/pdf.min": "pdfjs-dist/legacy/build/pdf",
          }
        : {}),
    };

    // Bundle analyzer
    if (process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
          reportFilename: isServer ? '../analyze/server.html' : './analyze/client.html',
        })
      );
    }

    // Important: let Next.js handle client chunking to avoid invalid script URLs like 
    // requesting a route (e.g., "/login") as a script. Custom splitChunks has been removed.
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
        destination: "/login", // ✅ Let Next.js handle basePath automatically
        permanent: false,
      },
    ];
  },

  // Output configuration for Docker deployment
  output: 'standalone',
  
  // Experimental features for better performance
  experimental: {
    optimizePackageImports: [
      '@radix-ui/react-icons',
      'lucide-react',
      'date-fns',
      'recharts',
      '@tanstack/react-query',
      'socket.io-client',
    ],
  },
};

export default nextConfig;
