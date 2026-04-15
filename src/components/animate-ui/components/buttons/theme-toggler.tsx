"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";
import { VariantProps } from "class-variance-authority";

import {
  ThemeToggler as ThemeTogglerPrimitive,
  type ThemeTogglerProps as ThemeTogglerPrimitiveProps,
  type ThemeSelection,
  type Resolved,
} from "@/components/animate-ui/primitives/effects/theme-toggler";
import { buttonVariants } from "@/components/animate-ui/components/buttons/icon";
import { cn } from "@/lib/utils";

const getIcon = (
  effective: ThemeSelection | undefined,
  resolved: Resolved,
  modes: ThemeSelection[],
) => {
  const effectiveTheme = effective as ThemeSelection;
  const theme = !effectiveTheme
    ? "light"
    : modes.includes("system")
      ? effectiveTheme
      : resolved;
  return theme === "system" ? (
    <Monitor />
  ) : theme === "dark" ? (
    <Moon />
  ) : (
    <Sun />
  );
};

type ThemeTogglerButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    modes?: ThemeSelection[];
    onImmediateChange?: ThemeTogglerPrimitiveProps["onImmediateChange"];
    direction?: ThemeTogglerPrimitiveProps["direction"];
  };

function ThemeTogglerButton({
  variant = "default",
  size = "default",
  modes = ["light", "dark", "system"],
  direction = "ltr",
  onImmediateChange,
  onClick,
  className,
  ...props
}: ThemeTogglerButtonProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <ThemeTogglerPrimitive
      theme={(theme ?? "system") as ThemeSelection}
      resolvedTheme={(resolvedTheme ?? "light") as Resolved}
      setTheme={setTheme}
      direction={direction}
    >
      {({ effective, resolved, toggleTheme }) => {
        const safeEffective: ThemeSelection = effective ?? "light";
        const safeModes: ThemeSelection[] =
          modes.length > 0 ? modes : ["light", "dark", "system"];
        return (
          <button
            data-slot="theme-toggler-button"
            className={cn(buttonVariants({ variant, size, className }))}
            onClick={(e) => {
              onClick?.(e);
              const i = safeModes.indexOf(safeEffective);
              const nextTheme =
                i >= 0 ? safeModes[(i + 1) % safeModes.length] : safeModes[0];
              toggleTheme(nextTheme as ThemeSelection);
            }}
            {...props}
          >
            {mounted ? (
              getIcon(safeEffective, resolved, safeModes)
            ) : (
              <Monitor />
            )}
          </button>
        );
      }}
    </ThemeTogglerPrimitive>
  );
}

export { ThemeTogglerButton, type ThemeTogglerButtonProps };
