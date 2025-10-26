"use client";

import React, { Suspense } from "react";
import { cn } from "@/lib/utils/utils";
import { Skeleton } from "./skeleton";

interface StreamingWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
  delay?: number;
}

/**
 * StreamingWrapper - Enhanced wrapper for progressive loading with streaming UI
 * Provides smooth transitions and optimized loading states
 */
export function StreamingWrapper({
  children,
  fallback,
  className,
  delay = 0,
}: StreamingWrapperProps) {
  const defaultFallback = (
    <div className={cn("animate-pulse space-y-4", className)}>
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-20 w-full" />
    </div>
  );

  return (
    <Suspense fallback={fallback || defaultFallback}>
      {delay > 0 ? (
        <DelayedContent delay={delay}>{children}</DelayedContent>
      ) : (
        children
      )}
    </Suspense>
  );
}

/**
 * DelayedContent - Adds artificial delay for smoother perceived performance
 * Useful for preventing flash of loading states on fast connections
 */
function DelayedContent({
  children,
  delay,
}: {
  children: React.ReactNode;
  delay: number;
}) {
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  if (!show) {
    return (
      <div className="animate-pulse space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Progressive loading wrapper for dashboard sections
 * Implements staggered loading for better UX
 */
interface ProgressiveLoaderProps {
  sections: Array<{
    id: string;
    content: React.ReactNode;
    skeleton?: React.ReactNode;
    delay?: number;
  }>;
  className?: string;
}

export function ProgressiveLoader({
  sections,
  className,
}: ProgressiveLoaderProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {sections.map((section, index) => (
        <StreamingWrapper
          key={section.id}
          fallback={section.skeleton}
          delay={section.delay || index * 100} // Stagger by 100ms
        >
          {section.content}
        </StreamingWrapper>
      ))}
    </div>
  );
}

/**
 * Enhanced loading state with progress indication
 */
interface LoadingStateProps {
  message?: string;
  progress?: number;
  className?: string;
}

export function LoadingState({
  message = "Loading...",
  progress,
  className,
}: LoadingStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 space-y-4", className)}>
      <div className="relative">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        {progress !== undefined && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-medium">{Math.round(progress)}%</span>
          </div>
        )}
      </div>
      <p className="text-sm text-muted-foreground animate-pulse">{message}</p>
      {progress !== undefined && (
        <div className="w-full max-w-xs bg-secondary rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Optimized image loading with skeleton
 */
interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  skeletonClassName?: string;
}

export function OptimizedImage({
  src,
  alt,
  className,
  skeletonClassName,
}: OptimizedImageProps) {
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState(false);

  return (
    <div className="relative">
      {!loaded && !error && (
        <Skeleton className={cn("absolute inset-0", skeletonClassName)} />
      )}
      <img
        src={src}
        alt={alt}
        className={cn(
          "transition-opacity duration-300",
          loaded ? "opacity-100" : "opacity-0",
          className
        )}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
      {error && (
        <div className={cn("flex items-center justify-center bg-muted text-muted-foreground", className)}>
          <span className="text-sm">Failed to load image</span>
        </div>
      )}
    </div>
  );
}
