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
    if (!dev) {
      // Optimize chunks for better caching
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
            },
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 5,
              reuseExistingChunk: true,
            },
            // Separate heavy libraries
            charts: {
              test: /[\\/]node_modules[\\/](recharts|d3)[\\/]/,
              name: 'charts',
              chunks: 'all',
              priority: 15,
            },
            ui: {
              test: /[\\/]node_modules[\\/](@radix-ui)[\\/]/,
              name: 'ui',
              chunks: 'all',
              priority: 12,
            },
          },
        },
        usedExports: true,
        sideEffects: false,
      };

      // Remove console logs in production (safely)
      if (config.optimization?.minimizer) {
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
          const message = (error as Error)?.message ?? String(error);
          console.warn('Could not configure console removal:', message);
        }
      }
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
      'recharts',
      '@tanstack/react-query',
      'socket.io-client',
    ],
  },
};

export default nextConfig;
