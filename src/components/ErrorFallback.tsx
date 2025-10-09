"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorFallbackProps {
  error?: Error;
  resetError: () => void;
  title?: string;
  description?: string;
}

export function ErrorFallback({
  error,
  resetError,
  title = "Something went wrong",
  description = "This component encountered an error. Please try again.",
}: ErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center space-y-4 border border-destructive/20 rounded-lg bg-destructive/5">
      <AlertTriangle className="h-8 w-8 text-destructive" />
      <div className="space-y-2">
        <h3 className="font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
        {process.env.NODE_ENV === 'development' && error && (
          <details className="mt-2 text-left">
            <summary className="cursor-pointer text-xs text-muted-foreground">
              Error Details
            </summary>
            <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-auto">
              {error.message}
            </pre>
          </details>
        )}
      </div>
      <Button onClick={resetError} size="sm" variant="outline">
        <RefreshCw className="h-3 w-3 mr-1" />
        Try Again
      </Button>
    </div>
  );
}