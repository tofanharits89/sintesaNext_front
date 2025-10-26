"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { withBasePath } from "@/lib/config/base-path";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[100svh] w-full flex items-center justify-center bg-gradient-to-b from-background to-muted/40 p-6">
      <div className="max-w-xl w-full">
        <Card className="border-2 shadow-xl">
          <CardHeader className="space-y-2 text-center">
            <div className="mx-auto h-14 w-14 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <CardTitle className="text-2xl">Terjadi kesalahan</CardTitle>
            <CardDescription>
              Maaf, aplikasi mengalami masalah tak terduga.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md bg-muted p-4 text-sm leading-relaxed">
              <p className="font-medium">Detail:</p>
              <p className="text-muted-foreground break-words">
                {error?.message || "Unknown error"}
              </p>
              {error?.digest && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Ref: {error.digest}
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex items-center justify-between">
            <Button variant="outline" onClick={() => reset()}>
              Coba lagi
            </Button>
            <Button asChild>
              <Link href={withBasePath("/dashboard")}>Ke Dashboard</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
