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
    // Only ignore during builds in CI environments, fail locally for better DX
    ignoreDuringBuilds: process.env.CI === 'true',
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

    // Production optimizations
    if (!dev && config.optimization?.minimizer) {
      // Remove console logs in production (safely)
      try {
        const minimizer = config.optimization.minimizer[0];
        if (minimizer && minimizer.options && minimizer.options.minimizer) {
          if (!minimizer.options.minimizer.options) {
            minimizer.options.minimizer.options = {};
          }
          if (!minimizer.options.minimizer.options.compress) {
            minimizer.options.minimizer.options.compress = {};
          }
          minimizer.options.minimizer.options.compress.drop_console = true;
        }
      } catch (error) {
        // Silently fail if minimizer structure is different
        console.warn('Could not configure console removal:', error.message);
      }
      
      // Tree shaking improvements
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
    }

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

  // Experimental features for better performance
  experimental: {
    optimizePackageImports: [
      '@radix-ui/react-icons',
      'lucide-react',
      'date-fns',
    ],
  },
};

export default nextConfig;
