"use client";

import React, { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface QueryErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorCount: number;
}

interface QueryErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

/**
 * Specialized Error Boundary for query-related components
 * Handles infinite loop errors and provides recovery options
 */
export class QueryErrorBoundary extends Component<QueryErrorBoundaryProps, QueryErrorBoundaryState> {
  private resetTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: QueryErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<QueryErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState(prevState => ({
      error,
      errorCount: prevState.errorCount + 1,
    }));

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error for debugging
    console.error("QueryErrorBoundary caught an error:", error, errorInfo);

    // Auto-reset after 5 seconds for infinite loop errors
    if (error.message.includes("Maximum update depth exceeded")) {
      this.resetTimeoutId = setTimeout(() => {
        this.handleRetry();
      }, 5000);
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  handleRetry = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
      this.resetTimeoutId = null;
    }

    this.setState({
      hasError: false,
      error: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isInfiniteLoop = this.state.error?.message.includes("Maximum update depth exceeded");
      const isFrequentError = this.state.errorCount > 3;

      // Default error UI
      return (
        <Card className="max-w-lg mx-auto mt-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              {isInfiniteLoop ? "Terjadi Loop Tak Terbatas" : "Terjadi Kesalahan"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {isInfiniteLoop ? (
                <p className="text-sm text-muted-foreground">
                  Komponen mengalami loop tak terbatas. Sistem akan mencoba memulihkan secara otomatis.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Terjadi kesalahan saat memuat data query. Silakan coba lagi.
                </p>
              )}
              
              {isFrequentError && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                  <p className="text-xs text-amber-800">
                    Kesalahan terjadi berulang kali. Mungkin ada masalah dengan koneksi atau data.
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={this.handleRetry} 
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Coba Lagi
              </Button>
              
              {isFrequentError && (
                <Button 
                  variant="outline" 
                  onClick={this.handleReload} 
                  size="sm"
                >
                  Muat Ulang Halaman
                </Button>
              )}
            </div>

            {isInfiniteLoop && (
              <div className="text-xs text-muted-foreground">
                Auto-reset dalam 5 detik...
              </div>
            )}
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

/**
 * HOC wrapper for components that might experience query-related errors
 */
export function withQueryErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WrappedComponent(props: P) {
    return (
      <QueryErrorBoundary fallback={fallback}>
        <Component {...props} />
      </QueryErrorBoundary>
    );
  };
}