"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import { usePathname } from "next/navigation";

function applyStoredTheme() {
  if (typeof window === "undefined") return "system" as const;
  try {
    const stored = localStorage.getItem("theme");
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = stored && (stored === "light" || stored === "dark")
      ? stored
      : systemDark ? "dark" : "light";
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    return theme as "light" | "dark";
  } catch {
    return "system" as const;
  }
}

function ThemeSync() {
  const { setTheme } = useTheme();
  const pathname = usePathname();

  const apply = React.useCallback(() => {
    const t = applyStoredTheme();
    if (t === "light" || t === "dark") setTheme(t);
  }, [setTheme]);

  React.useEffect(() => {
    apply();
    window.addEventListener("auth:login", apply as EventListener);
    window.addEventListener("storage", apply);
    return () => {
      window.removeEventListener("auth:login", apply as EventListener);
      window.removeEventListener("storage", apply);
    };
  }, [apply]);

  // Re-apply on route change to avoid any interim resets
  React.useEffect(() => {
    apply();
  }, [pathname, apply]);

  return null;
}

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey="theme"
      disableTransitionOnChange
      {...props}
    >
      <ThemeSync />
      {children}
    </NextThemesProvider>
  );
}

