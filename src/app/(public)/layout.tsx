import type { Metadata } from "next";
import { QueryProvider } from "@/components/providers/query-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { ConditionalToaster } from "@/components/ui/conditional-toaster";
import { ErrorBoundary, ComponentErrorBoundary } from "@/lib/ui/error-boundary";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { RoutePreloader } from "@/components/ui/route-preloader";
import { ClientInit } from "@/components/ClientInit";
import { geistSans, geistMono } from "@/app/fonts";
import "../globals.css";

export const metadata: Metadata = {
  title: "sintesaNEXT",
  description: "Dashboard keuangan Indonesia",
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-100 dark:bg-black`}
      >
        <ErrorBoundary>
          <QueryProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
            >
              <ComponentErrorBoundary>
                <ConnectionStatus />
              </ComponentErrorBoundary>
              <ComponentErrorBoundary>
                <ClientInit />
              </ComponentErrorBoundary>
              <ComponentErrorBoundary>
                <RoutePreloader />
              </ComponentErrorBoundary>
              <ConditionalToaster />
              {children}
            </ThemeProvider>
          </QueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
