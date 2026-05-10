"use client";

import React from "react";
import { cn } from "@/lib/utils/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted/50",
        className
      )}
      {...props}
    />
  );
}

// Dashboard-specific skeleton components
export function DashboardHeaderSkeleton() {
  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
}

export function QuickStatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-lg border p-6 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-4 rounded" />
          </div>
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton({ height = "h-80" }: { height?: string }) {
  return (
    <div className="rounded-lg border p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-20" />
        </div>
        <Skeleton className={cn("w-full", height)} />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-lg border border-zinc-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 bg-zinc-100/80 px-4 py-3 border-b border-zinc-200">
        <div className="h-3 w-4 rounded bg-zinc-300/70 animate-pulse" />
        <div className="h-3 flex-1 rounded bg-zinc-300/70 animate-pulse" />
        <div className="h-3 w-20 rounded bg-zinc-300/70 animate-pulse" />
        <div className="h-3 w-16 rounded bg-zinc-300/70 animate-pulse" />
        <div className="h-3 w-16 rounded bg-zinc-300/70 animate-pulse" />
      </div>
      {/* Body rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "flex items-center gap-3 px-4 py-2.5 border-b border-zinc-200 last:border-b-0",
            i % 2 === 0 ? "bg-white" : "bg-zinc-50/40"
          )}
        >
          <div className="h-3 w-4 rounded bg-zinc-200/80 animate-pulse" />
          <div className="h-3 rounded bg-zinc-200/80 animate-pulse" style={{ width: `${35 + (i * 9) % 30}%` }} />
          <div className="h-3 w-20 rounded bg-zinc-200/80 animate-pulse ml-auto" />
          <div className="h-3 w-16 rounded bg-zinc-200/80 animate-pulse" />
          <div className="h-5 w-16 rounded-full bg-zinc-200/80 animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-lg border p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-4 rounded" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}

export function UserProfileSkeleton() {
  return (
    <div className="flex items-center space-x-3">
      <Skeleton className="h-8 w-8 rounded-full" />
      <div className="space-y-1">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

export function NavigationSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3 p-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}

// Loading page component
export function DashboardLoadingSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <DashboardHeaderSkeleton />
      <QuickStatsSkeleton />
      <div className="grid gap-6 md:grid-cols-2">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
      <TableSkeleton />
    </div>
  );
}

// Streaming component wrapper
interface StreamingWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  isLoading?: boolean;
}

export function StreamingWrapper({ 
  children, 
  fallback, 
  isLoading = false 
}: StreamingWrapperProps) {
  if (isLoading) {
    return <>{fallback || <Skeleton className="h-20 w-full" />}</>;
  }
  
  return <>{children}</>;
}
