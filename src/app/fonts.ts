import { Geist, Geist_Mono } from "next/font/google";

/**
 * Font Configuration - Enterprise Grade
 * 
 * Strategy:
 * - Geist Sans: Preloaded (used globally across all pages)
 * - Geist Mono: Lazy loaded (only used in code blocks and specific components)
 * 
 * This prevents unnecessary preloading warnings and optimizes initial page load.
 */

// Primary font - used everywhere, preload enabled
export const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true, // ✅ Keep preload - used above the fold
});

// Monospace font - used selectively, preload disabled
export const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false, // ✅ Disable preload - only used in specific contexts
});
