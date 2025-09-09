"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { XIcon } from "lucide-react";

import { cn } from "@/lib/utils";

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className
      )}
      {...props}
    />
  );
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  onInteractOutside,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean;
}) {
  // Detect if a DialogDescription is present in children to keep proper a11y.
  function hasDialogDescription(node: React.ReactNode): boolean {
    const arr = React.Children.toArray(node);
    for (const child of arr) {
      if (!React.isValidElement(child)) continue;
      // Our DialogDescription sets data-slot="dialog-description"
      // Recurse through nested children (e.g., inside DialogHeader)
      // @ts-ignore - data-slot is not in React type defs
      if (child.props?.["data-slot"] === "dialog-description") return true;
      if (child.props?.children && hasDialogDescription(child.props.children))
        return true;
    }
    return false;
  }

  // Preserve consumer overrides while silencing Radix warning when no description is used.
  const hasDesc = hasDialogDescription(children);
  // @ts-ignore - allow aria-describedby passthrough
  const ariaFromUser = (props as any)["aria-describedby"];
  const maybeAria: Record<string, any> =
    ariaFromUser !== undefined
      ? { "aria-describedby": ariaFromUser }
      : !hasDesc
      ? { "aria-describedby": undefined }
      : {};

  // Exclude aria-describedby from props to avoid duplication
  // @ts-ignore - rest extraction for aria-describedby
  const { ["aria-describedby"]: _omit, ...rest } = props as any;

  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-1/2 left-1/2 z-50 w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg",
          // Use grid by default, but allow flex to override
          className?.includes("flex") ? "" : "grid",
          className
        )}
        onInteractOutside={(e) => {
          try {
            const target = (e.target ??
              (e as any).originalEvent?.target) as Node | null;
            if (target) {
              const popovers = document.querySelectorAll(
                '[data-slot="popover-content"]'
              );
              for (const el of Array.from(popovers)) {
                if (el.contains(target)) {
                  e.preventDefault();
                  return;
                }
              }
            }
          } catch {}
          onInteractOutside?.(e);
        }}
        {...maybeAria}
        {...rest}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  );
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-lg leading-none font-semibold", className)}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
