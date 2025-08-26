"use client";

import React from "react";
import { AlertTriangle, RefreshCw, Wifi, WifiOff, Server, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ErrorFallbackProps {
  error?: Error | string | null;
  onRetry?: () => void;
  onReset?: () => void;
  title?: string;
  description?: string;
  showRetry?: boolean;
  showReset?: boolean;
  variant?: "network" | "server" | "validation" | "generic";
  className?: string;
}

/**
 * Reusable error fallback component for different error scenarios
 * Provides contextual error messages and recovery actions
 */
export function ErrorFallback({
  error,
  onRetry,
  onReset,
  title,
  description,
  showRetry = true,
  showReset = false,
  variant = "generic",
  className = "",
}: ErrorFallbackProps) {
  // Determine error type and appropriate messaging
  const getErrorConfig = () => {
    const errorMessage = typeof error === "string" ? error : error?.message || "";
    
    // Network errors
    if (variant === "network" || /network|connection|fetch|timeout/i.test(errorMessage)) {
      return {
        icon: WifiOff,
        title: title || "Masalah Koneksi",
        description: description || "Tidak dapat terhubung ke server. Periksa koneksi internet Anda.",
        color: "text-orange-600",
        bgColor: "bg-orange-50",
        borderColor: "border-orange-200",
      };
    }
    
    // Server errors
    if (variant === "server" || /server|5\d\d|internal.*error/i.test(errorMessage)) {
      return {
        icon: Server,
        title: title || "Masalah Server",
        description: description || "Server sedang mengalami masalah. Silakan coba lagi dalam beberapa saat.",
        color: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
      };
    }
    
    // Validation errors
    if (variant === "validation" || /validation|invalid|required/i.test(errorMessage)) {
      return {
        icon: AlertCircle,
        title: title || "Data Tidak Valid",
        description: description || "Periksa kembali data yang Anda masukkan.",
        color: "text-yellow-600",
        bgColor: "bg-yellow-50",
        borderColor: "border-yellow-200",
      };
    }
    
    // Generic errors
    return {
      icon: AlertTriangle,
      title: title || "Terjadi Kesalahan",
      description: description || "Terjadi kesalahan yang tidak terduga. Silakan coba lagi.",
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
    };
  };

  const config = getErrorConfig();
  const IconComponent = config.icon;

  return (
    <div className={`flex flex-col items-center justify-center p-6 ${className}`}>
      <Card className={`max-w-md w-full ${config.borderColor}`}>
        <CardHeader className="text-center">
          <div className={`mx-auto w-12 h-12 ${config.bgColor} rounded-full flex items-center justify-center mb-4`}>
            <IconComponent className={`w-6 h-6 ${config.color}`} />
          </div>
          <CardTitle className={`text-lg ${config.color}`}>
            {config.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground text-sm">
            {config.description}
          </p>
          
          {/* Show error details if it's a string or has a message */}
          {error && typeof error === "string" && error !== config.description && (
            <Alert>
              <AlertDescription className="text-xs">
                {error}
              </AlertDescription>
            </Alert>
          )}
          
          {error && typeof error === "object" && error.message && error.message !== config.description && (
            <Alert>
              <AlertDescription className="text-xs">
                {error.message}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2 justify-center">
            {showRetry && onRetry && (
              <Button onClick={onRetry} size="sm" className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Coba Lagi
              </Button>
            )}
            {showReset && onReset && (
              <Button onClick={onReset} variant="outline" size="sm">
                Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Inline error message component for form fields and smaller areas
 */
export function InlineError({
  error,
  onRetry,
  className = "",
}: {
  error: Error | string | null;
  onRetry?: () => void;
  className?: string;
}) {
  if (!error) return null;

  const errorMessage = typeof error === "string" ? error : error.message;

  return (
    <Alert className={`${className}`} variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span className="text-sm">{errorMessage}</span>
        {onRetry && (
          <Button
            onClick={onRetry}
            size="sm"
            variant="outline"
            className="ml-2 h-6 px-2 text-xs"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Retry
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

/**
 * Network status indicator component
 */
export function NetworkStatus({ isOnline }: { isOnline: boolean }) {
  if (isOnline) return null;

  return (
    <Alert className="mb-4" variant="destructive">
      <WifiOff className="h-4 w-4" />
      <AlertDescription>
        Tidak ada koneksi internet. Beberapa fitur mungkin tidak berfungsi dengan baik.
      </AlertDescription>
    </Alert>
  );
}