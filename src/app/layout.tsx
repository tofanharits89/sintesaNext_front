import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import AppShell from "@/components/layout/app-shell";
import { ConnectionStatus } from "@/components/connection-status";
import CheckBackend from "@/components/check-backend";
import { QueryProvider } from "@/components/providers/query-provider";
import { withBasePath } from "@/lib/base-path";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Auth enforcement is handled by:
  // 1. Middleware - redirects unauthenticated users to /login
  // 2. Section layouts (dashboard, profile, users, settings) - server-side JWT verification
  // This avoids the /login redirect loop issue

  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <CheckBackend />
            <AppShell>{children}</AppShell>
            <ConnectionStatus />
            <Toaster richColors position="bottom-left" />
            {/* Optionally show a top-of-page banner when server down via client routes */}
            {/* <ServerDownBanner /> */}
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
