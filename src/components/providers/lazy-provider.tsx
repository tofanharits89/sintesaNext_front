"use client";

import { Suspense, ReactNode } from "react";
import { ComponentLoadingFallback } from "@/components/ui/loading-fallback";

interface LazyProviderProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function LazyProvider({ children, fallback }: LazyProviderProps) {
  return (
    <Suspense fallback={fallback || <ComponentLoadingFallback />}>
      {children}
    </Suspense>
  );
}