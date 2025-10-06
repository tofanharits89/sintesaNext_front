import { Geist, Geist_Mono } from "next/font/google";

/**
 * Font Configuration - Enterprise Grade
 * 
 * Strategy:
 * - Geist Sans: Preloaded with optimized fallback matching
 * - Geist Mono: Lazy loaded (only used in code blocks and specific components)
 * 
 * Font Display Strategy:
 * - Using "optional" to prevent FOUT (Flash of Unstyled Text)
 * - If font isn't cached, fallback is used without swap
 * - On subsequent visits, font loads instantly from cache
 * 
 * This eliminates the "font changing" effect while maintaining performance.
 */

// Primary font - used everywhere, preload enabled
export const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "optional", // ✅ Prevents FOUT - no swap if font loads slowly
  preload: true, // ✅ Keep preload - used above the fold
  adjustFontFallback: true, // ✅ Match fallback metrics to reduce layout shift
  fallback: ["system-ui", "arial"], // ✅ Define explicit fallback chain
});

// Monospace font - used selectively, preload disabled
export const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "optional", // ✅ Prevents FOUT for monospace too
  preload: false, // ✅ Disable preload - only used in specific contexts
  adjustFontFallback: true, // ✅ Match fallback metrics
  fallback: ["ui-monospace", "Consolas", "Monaco"], // ✅ Define explicit fallback chain
});
