"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { logger } from "./utils";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorId?: string;
  errorCount?: number;
}

export class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: number | null = null;
  private errorTimestamps: number[] = [];

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorCount: 0 };
  }

  static getDerivedStateFromError(error: Error): State {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Check if this is an infinite loop error
    const isInfiniteLoop = error.message.includes(
      "Maximum update depth exceeded",
    );

    return {
      hasError: true,
      error,
      errorId,
      errorCount: isInfiniteLoop ? 999 : 1,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { errorId, errorCount } = this.state;

    // Track error timestamps to detect rapid error loops
    const now = Date.now();
    this.errorTimestamps.push(now);

    // Keep only errors from the last 5 seconds
    this.errorTimestamps = this.errorTimestamps.filter(
      (timestamp) => now - timestamp < 5000,
    );

    // If we have more than 5 errors in 5 seconds, it's an infinite loop
    if (this.errorTimestamps.length > 5) {
      logger.error("Infinite error loop detected - preventing retry", error, {
        errorId,
        errorCount: this.errorTimestamps.length,
        componentStack: errorInfo.componentStack,
        errorBoundary: this.constructor.name,
      });

      // Update state to prevent retry button from working
      this.setState({ errorCount: 999 });
      return;
    }

    logger.error("React Error Boundary caught an error", error, {
      errorId,
      errorCount,
      componentStack: errorInfo.componentStack,
      errorBoundary: this.constructor.name,
    });

    this.props.onError?.(error, errorInfo);
  }

  componentWillUnmount() {
    if (this.resetTimeoutId !== null) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  handleRetry = () => {
    const { errorCount = 0 } = this.state;

    // Prevent retry if we've detected an infinite loop
    if (errorCount > 10) {
      logger.warn("Retry blocked - too many errors detected");
      return;
    }

    // Increment error count
    this.setState({
      hasError: false,
      errorCount: errorCount + 1,
    });

    // Reset error count after 10 seconds if no new errors
    if (this.resetTimeoutId !== null) {
      clearTimeout(this.resetTimeoutId);
    }
    this.resetTimeoutId = window.setTimeout(() => {
      this.setState({ errorCount: 0 });
    }, 10000);
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { errorCount = 0 } = this.state;
      const isInfiniteLoop =
        errorCount > 10 ||
        this.state.error?.message.includes("Maximum update depth exceeded");

      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="max-w-md w-full mx-4">
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <AlertTriangle className="h-16 w-16 text-destructive" />
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-foreground">
                  {isInfiniteLoop
                    ? "Critical Error Detected"
                    : "Something went wrong"}
                </h1>
                <p className="text-muted-foreground">
                  {isInfiniteLoop
                    ? "An infinite loop was detected. Please reload the page to continue."
                    : "An unexpected error occurred. Please try again or reload the page."}
                </p>
                {process.env.NODE_ENV === "development" && this.state.error && (
                  <details className="mt-4 p-4 bg-muted rounded-lg text-left">
                    <summary className="cursor-pointer font-medium">
                      Error Details (Development)
                    </summary>
                    <pre className="mt-2 text-sm overflow-auto max-h-48">
                      {this.state.error.stack}
                    </pre>
                    {isInfiniteLoop && (
                      <div className="mt-2 p-2 bg-destructive/10 rounded text-xs text-destructive">
                        <strong>Infinite Loop Detected:</strong> This error was
                        caught {errorCount} times. The &quot;Try Again&quot;
                        button has been disabled to prevent further issues.
                      </div>
                    )}
                  </details>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {!isInfiniteLoop && (
                  <Button onClick={this.handleRetry} variant="default">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                )}
                <Button
                  onClick={this.handleReload}
                  variant={isInfiniteLoop ? "default" : "outline"}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reload Page
                </Button>
              </div>

              {this.state.errorId && (
                <p className="text-xs text-muted-foreground">
                  Error ID: {this.state.errorId}
                </p>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Specialized error boundaries for different contexts
export function ComponentErrorBoundary({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return <ErrorBoundary fallback={fallback}>{children}</ErrorBoundary>;
}

// Hook for functional components
export function useErrorHandler() {
  return (error: Error, errorInfo?: unknown) => {
    logger.error("Unhandled error in component", error, errorInfo);

    // You could also trigger a toast notification here
    // toast.error('An unexpected error occurred');
  };
}
