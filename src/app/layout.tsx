import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import AppShell from "@/components/layout/app-shell";
import { ConnectionStatus } from "@/components/connection-status";
import CheckBackend from "@/components/check-backend";
import { QueryProvider } from "@/components/providers/query-provider";
import { ErrorBoundary, ComponentErrorBoundary } from "@/lib/error-boundary";
import { withBasePath, apiPath } from "@/lib/base-path";
import { cookies } from "next/headers";
import { MessagingAuthListener } from "@/components/messaging/messaging-auth-listener";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
  // 2. Section layouts (dashboard, profile, users, settings) - optimized server-side JWT verification
  // User profile is now fetched efficiently in dashboard layout to avoid duplicate requests

  // Skip server-side user fetch - let React Query handle with stale-while-revalidate
  const initialUser: import("@/lib/users-store").User | undefined = undefined;

  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
          <QueryProvider>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
              <ComponentErrorBoundary>
                <MessagingAuthListener />
              </ComponentErrorBoundary>
              <ComponentErrorBoundary>
                <CheckBackend />
              </ComponentErrorBoundary>
              <ComponentErrorBoundary>
                <AppShell {...(initialUser ? { initialUser } : {})}>
                  {children}
                </AppShell>
              </ComponentErrorBoundary>
              <ComponentErrorBoundary>
                <ConnectionStatus />
              </ComponentErrorBoundary>
              <Toaster richColors position="bottom-left" />
              {/* Optionally show a top-of-page banner when server down via client routes */}
              {/* <ServerDownBanner /> */}
            </ThemeProvider>
          </QueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
