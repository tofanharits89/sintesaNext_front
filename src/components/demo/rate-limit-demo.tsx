/**
 * Rate Limit Notification Demo
 *
 * Component to test and demonstrate rate limit notifications
 * Use this in development to see how notifications look
 */

"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { handleRateLimitError } from "@/utils/rateLimitHandler";
import { AxiosError } from "axios";

export function RateLimitDemo() {
  const simulateLoginLimit = () => {
    const error = {
      response: {
        status: 429,
        data: {
          success: false as const,
          error: "Rate limit exceeded for auth-login",
          retryAfter: 45,
          current: 6,
          limit: 5,
        },
      },
    } as any;

    handleRateLimitError(error);
  };

  const simulateIPBlock = () => {
    const error = {
      response: {
        status: 403,
        data: {
          success: false as const,
          error: "Access temporarily blocked due to suspicious activity",
          code: "IP_BLOCKED",
          expiresIn: 3120, // 52 minutes
          expiresAt: Date.now() + 3120 * 1000,
        },
      },
    } as any;

    handleRateLimitError(error);
  };

  const simulateRefreshLimit = () => {
    const error = {
      response: {
        status: 429,
        data: {
          success: false as const,
          error: "Rate limit exceeded for auth-refresh",
          retryAfter: 30,
        },
      },
    } as any;

    handleRateLimitError(error);
  };

  const simulateRegisterLimit = () => {
    const error = {
      response: {
        status: 429,
        data: {
          success: false as const,
          error: "Rate limit exceeded for auth-register",
          retryAfter: 240, // 4 minutes
        },
      },
    } as any;

    handleRateLimitError(error);
  };

  const simulateAPILimit = () => {
    const error = {
      response: {
        status: 429,
        data: {
          success: false as const,
          error: "Rate limit exceeded for api",
          retryAfter: 480, // 8 minutes
          resetTime: Date.now() + 480 * 1000,
          current: 95,
          limit: 100,
        },
      },
    } as any;

    handleRateLimitError(error);
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Rate Limit Notifications Demo</CardTitle>
        <CardDescription>
          Click the buttons below to see how rate limit notifications appear to
          users
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Button
            onClick={simulateLoginLimit}
            variant="destructive"
            className="w-full"
          >
            Login Rate Limit
            <span className="ml-2 text-xs opacity-70">(5/min)</span>
          </Button>

          <Button
            onClick={simulateIPBlock}
            variant="destructive"
            className="w-full"
          >
            IP Blocked
            <span className="ml-2 text-xs opacity-70">(10 violations)</span>
          </Button>

          <Button
            onClick={simulateRefreshLimit}
            variant="outline"
            className="w-full"
          >
            Refresh Limit
            <span className="ml-2 text-xs opacity-70">(10/min)</span>
          </Button>

          <Button
            onClick={simulateRegisterLimit}
            variant="outline"
            className="w-full"
          >
            Register Limit
            <span className="ml-2 text-xs opacity-70">(3/5min)</span>
          </Button>

          <Button
            onClick={simulateAPILimit}
            variant="secondary"
            className="w-full md:col-span-2"
          >
            General API Limit
            <span className="ml-2 text-xs opacity-70">(100/15min)</span>
          </Button>
        </div>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-semibold mb-2">How to Use:</h4>
          <ul className="text-sm space-y-1 list-disc list-inside">
            <li>Click any button to simulate that rate limit error</li>
            <li>Toast notifications will appear in the bottom-right</li>
            <li>Some notifications have action buttons (click them!)</li>
            <li>Notifications auto-dismiss after a few seconds</li>
          </ul>
        </div>

        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">
            💡 In Production:
          </h4>
          <p className="text-sm text-blue-800 dark:text-blue-200">
            These notifications appear automatically when users hit rate limits.
            No additional code needed - the interceptor handles everything!
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
