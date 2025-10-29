import { Metadata } from "next";
import "../../globals.css";

export const metadata: Metadata = {
  title: "IP Blocked - Access Temporarily Restricted",
  description:
    "Your IP address has been temporarily blocked due to suspicious activity.",
};

// Note: Nested layouts must NOT include <html>/<body>. Those belong only to the root layout.
export default function IPBlockedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children as React.ReactElement;
}
