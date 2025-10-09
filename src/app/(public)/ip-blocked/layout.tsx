import { Metadata } from "next";
import { geistSans, geistMono } from "../fonts";
import "../globals.css";

export const metadata: Metadata = {
  title: "IP Blocked - Access Temporarily Restricted",
  description: "Your IP address has been temporarily blocked due to suspicious activity.",
};

/**
 * Minimal layout for IP blocked page
 * Bypasses all auth checks, socket connections, and API calls
 * to ensure the page loads even when IP is blocked
 */
export default function IPBlockedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
