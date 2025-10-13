import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // basePath: "/v3/next", // Commented out to serve at root

  // Performance optimizations
  poweredByHeader: false,
  compress: true,

  // Remove console statements in production
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? {
            exclude: ["error", "warn"], // Keep console.error and console.warn
          }
        : false,
  },

  // Image optimization
  images: {
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 60,
  },

  // Security headers - Comprehensive protection
  async headers() {
    const isProduction = process.env.NODE_ENV === "production";
    const isDevelopment = process.env.NODE_ENV === "development";

    return [
      {
        source: "/(.*)",
        headers: [
          // Prevent clickjacking attacks
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          // Prevent MIME type sniffing
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // Control referrer information
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // XSS Protection (legacy browsers)
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          // Permissions Policy - Restrict browser features
          {
            key: "Permissions-Policy",
            value: [
              "camera=()",
              "microphone=()",
              "geolocation=()",
              "interest-cohort=()",
              "payment=()",
              "usb=()",
              "magnetometer=()",
              "gyroscope=()",
              "accelerometer=()",
            ].join(", "),
          },
          // HSTS - Force HTTPS (only in production with HTTPS enabled)
          ...(isProduction && process.env.HTTPS === "true"
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=31536000; includeSubDomains; preload",
                },
              ]
            : []),
          // Content Security Policy
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Next.js requires unsafe-eval and unsafe-inline
              // Google Maps API requires maps.googleapis.com
              isDevelopment
                ? "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://maps.googleapis.com"
                : "script-src 'self' 'unsafe-inline' https://maps.googleapis.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              "connect-src 'self' ws: wss: http://localhost:* http://10.0.8.42:* https://*",
              "media-src 'self'",
              "object-src 'none'",
              "frame-src 'self'",
              "frame-ancestors 'none'",
              "form-action 'self'",
              "base-uri 'self'",
              // Only upgrade to HTTPS if HTTPS is explicitly enabled
              isDevelopment || process.env.HTTPS !== "true"
                ? ""
                : "upgrade-insecure-requests",
            ]
              .filter(Boolean)
              .join("; "),
          },
          // Remove X-Powered-By header (already done via poweredByHeader: false)
          // Cache Control for security-sensitive pages
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, private",
          },
        ],
      },
      // Specific headers for API routes
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, private, max-age=0",
          },
          {
            key: "Pragma",
            value: "no-cache",
          },
          {
            key: "Expires",
            value: "0",
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
    ignoreBuildErrors: process.env.CI === "true",
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
    if (process.env.ANALYZE === "true") {
      const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: "static",
          openAnalyzer: false,
          reportFilename: isServer
            ? "../analyze/server.html"
            : "./analyze/client.html",
        }),
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

  async rewrites() {
    const backendHost =
      process.env.NODE_ENV === "production" ? "backend" : "localhost";

    return [
      // Proxy API requests to backend
      {
        source: "/api/v1/:path*",
        destination: `http://${backendHost}:88/api/v1/:path*`,
      },
    ];
  },

  // Output configuration for Docker deployment
  output: "standalone",

  // Experimental features for better performance
  experimental: {
    optimizePackageImports: [
      "@radix-ui/react-icons",
      "lucide-react",
      "date-fns",
      "recharts",
      "@tanstack/react-query",
      "socket.io-client",
    ],
  },
};

export default nextConfig;
