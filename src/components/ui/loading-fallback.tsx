import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Loader2, Search } from "lucide-react";

export function ComponentLoadingFallback() {
  return (
    <div className="min-h-svh bg-slate-100 dark:bg-black flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

export function TableLoadingFallback() {
  return (
    <Card>
      <CardContent className="px-6 py-2">
        <div className="flex flex-col gap-4 mb-4 mt-2">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <Skeleton className="h-9 w-full max-w-xl" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-40" />
              <Skeleton className="h-9 w-40" />
            </div>
          </div>
        </div>

        <div className="rounded-md border">
          <div className="h-10 border-b flex items-center px-4 bg-muted/30">
            <Skeleton className="h-4 w-4 mr-6" />
            <Skeleton className="h-4 w-8 mr-6" />
            <Skeleton className="h-4 w-32 mr-6" />
            <Skeleton className="h-4 w-24 mr-6" />
            <Skeleton className="h-4 w-40 mr-6" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="divide-y overflow-hidden">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-12 flex items-center px-4">
                <Skeleton className="h-4 w-4 mr-6" />
                <Skeleton className="h-4 w-8 mr-6" />
                <Skeleton className="h-4 w-32 mr-6" />
                <Skeleton className="h-4 w-24 mr-6" />
                <Skeleton className="h-4 w-40 mr-6" />
                <div className="flex gap-2 ml-auto">
                  <Skeleton className="h-8 w-8 rounded-md" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between py-4 mt-2">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-8 w-40" />
        </div>
      </CardContent>
    </Card>
  );
}

export function ChartLoadingFallback() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-64 w-full" />
      </CardContent>
    </Card>
  );
}

export function UsersPageSkeleton() {
  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-40" />
        </div>
      </div>

      <TableLoadingFallback />
    </div>
  );
}
