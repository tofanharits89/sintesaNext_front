import type { Metadata } from "next";
import { redirect } from "next/navigation";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ConditionalToaster } from "@/components/ui/conditional-toaster";
import AppShell from "@/components/layout/app-shell";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import CheckBackend from "@/components/CheckBackend";
import { QueryProvider } from "@/components/providers/query-provider";
import { AdminPresenceListener } from "@/components/AdminPresenceListener";

import { ErrorBoundary, ComponentErrorBoundary } from "@/lib/ui/error-boundary";
import { withBasePath, apiPath } from "@/lib/config/base-path";
import { cookies, headers } from "next/headers";
import { MessagingAuthListener } from "@/components/messaging/messaging-auth-listener";
import SessionMonitor from "@/components/SessionMonitor";
import { performanceMonitor } from "@/utils/performance-monitor";
import { preloadOnIdle } from "@/utils/chunk-preloader";
import { RoutePreloader } from "@/components/ui/route-preloader";
import { ClientInit } from "@/components/ClientInit";
// GlobalSocketInitializer is now integrated into useUnifiedSocket hook
import { geistSans, geistMono } from "./fonts";
import { Suspense } from "react";
import { PageProvider } from "@/contexts/page-context";

export const metadata: Metadata = {
  title: "sintesaNEXT",
  description: "Dashboard keuangan Indonesia",
  icons: {
    icon: withBasePath("/snext_logoonly_dark.svg"),
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Auth enforcement is handled by:
  // 1. Middleware - redirects unauthenticated users to /login
  // 2. Section layouts (dashboard, profile, users, settings) - server-side session verification
  // User profile is now fetched efficiently in dashboard layout to avoid duplicate requests

  // Skip server-side user fetch - let React Query handle with stale-while-revalidate
  const initialUser: import("@/lib/stores/users-store").User | undefined = undefined;

  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        {/* Preload critical fonts for instant loading */}
        <link
          rel="preload"
          href="/fonts/Geist/webfonts/Geist-Regular.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/Geist/webfonts/Geist-Medium.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/Geist/webfonts/Geist-SemiBold.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/Geist/webfonts/Geist-Bold.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-geist-sans antialiased`}
      >
        <ErrorBoundary>
          <QueryProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
            >
                <ComponentErrorBoundary>
                  <AdminPresenceListener />
                </ComponentErrorBoundary>
                <ComponentErrorBoundary>
                  <MessagingAuthListener />
                </ComponentErrorBoundary>
                <ComponentErrorBoundary>
                  <CheckBackend />
                </ComponentErrorBoundary>
                <ComponentErrorBoundary>
                  <SessionMonitor />
                  <PageProvider>
                    <AppShell {...(initialUser ? { initialUser } : {})}>
                      {/* Use a no-op fallback to avoid global flashing while preserving lazy boundaries */}
                      <Suspense fallback={null}>{children}</Suspense>
                    </AppShell>
                  </PageProvider>
                </ComponentErrorBoundary>
                <ComponentErrorBoundary>
                  <ConnectionStatus />
                </ComponentErrorBoundary>
                <ClientInit />
                <RoutePreloader />
                <ConditionalToaster />
                {/* Optionally show a top-of-page banner when server down via client routes */}
                {/* <ServerDownBanner /> */}
              </ThemeProvider>
          </QueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
