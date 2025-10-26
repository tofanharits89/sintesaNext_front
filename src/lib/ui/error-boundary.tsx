"use client";

import React, { ReactNode } from "react";
import { ErrorBoundary as UIErrorBoundary } from "@/components/ui/error-boundary";
export { UIErrorBoundary as ErrorBoundary };

export function ComponentErrorBoundary({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return <UIErrorBoundary fallback={fallback}>{children}</UIErrorBoundary>;
}

export function useErrorHandler() {
  return (error: Error, errorInfo?: unknown) => {
    // Align with UI error boundary simple logging
    console.error("Unhandled error in component", error, errorInfo);
  };
}
