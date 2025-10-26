"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Loader2, Database, Search } from "lucide-react";

/**
 * Skeleton loader for query list items
 */
export function QueryListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="p-6 border-b">
          <div className="space-y-3">
            {/* Header with name and actions */}
            <div className="flex items-center justify-between">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-64" />
                <Skeleton className="h-4 w-96" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
            
            {/* Badges */}
            <div className="flex gap-2">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-18" />
            </div>
            
            {/* Filter preview */}
            <div className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <div className="grid grid-cols-3 gap-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            </div>
            
            {/* Timestamps */}
            <div className="flex gap-4">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-36" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Loading spinner for inline operations
 */
export function InlineSpinner({ 
  size = "sm", 
  text,
  className = "" 
}: { 
  size?: "xs" | "sm" | "md" | "lg";
  text?: string;
  className?: string;
}) {
  const sizeClasses = {
    xs: "w-3 h-3",
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin`} />
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  );
}

/**
 * Full page loading state for query management
 */
export function QueryManagementSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Database className="w-6 h-6 text-amber-600" />
          <div className="space-y-1">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <Skeleton className="h-9 w-20" />
      </div>

      {/* Search and Filter Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Skeleton className="h-9 w-full" />
              </div>
              <Skeleton className="h-9 w-20" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Query List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <QueryListSkeleton count={5} />
        </CardContent>
      </Card>

      {/* Pagination */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-40" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-24" />
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-8" />
                ))}
              </div>
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Loading overlay for forms and modals
 */
export function LoadingOverlay({ 
  isVisible, 
  text = "Loading...",
  className = "" 
}: { 
  isVisible: boolean;
  text?: string;
  className?: string;
}) {
  if (!isVisible) return null;

  return (
    <div className={`absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 ${className}`}>
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
        <p className="text-sm text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}

/**
 * Button loading state
 */
export function ButtonSpinner({ className = "" }: { className?: string }) {
  return <Loader2 className={`w-4 h-4 animate-spin ${className}`} />;
}

/**
 * Skeleton for save modal
 */
export function SaveModalSkeleton() {
  return (
    <div className="space-y-4">
      {/* Query Summary */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-18" />
          <Skeleton className="h-6 w-16" />
        </div>
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-9 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>

      {/* Info */}
      <Skeleton className="h-16 w-full" />
    </div>
  );
}

/**
 * Progress indicator for bulk operations
 */
export function BulkOperationProgress({
  completed,
  total,
  failed = 0,
  operation = "Processing",
}: {
  completed: number;
  total: number;
  failed?: number;
  operation?: string;
}) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span>{operation}...</span>
        <span>{completed}/{total}</span>
      </div>
      
      <div className="w-full bg-muted rounded-full h-2">
        <div 
          className="bg-amber-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{percentage}% complete</span>
        {failed > 0 && (
          <span className="text-red-600">{failed} failed</span>
        )}
      </div>
    </div>
  );
}
