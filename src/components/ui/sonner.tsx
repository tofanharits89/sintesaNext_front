"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme()
  const resolvedTheme = (theme ?? "system") as "light" | "dark" | "system"

  return (
    <Sonner
      theme={resolvedTheme}
      className="toaster group"
      position="bottom-left"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--toast-font-size": "1rem",
          "--toast-title-font-size": "1.0625rem",
          "--toast-description-font-size": "0.9375rem",
        } as React.CSSProperties
      }
      toastOptions={{
        style: {
          fontSize: "1rem",
          lineHeight: "1.5",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
