import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Loader2, Search, Settings, Shield, MessageCircle, Users, Clock, Menu } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils/utils";

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

export function LogUserOnlineSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </CardHeader>
      <CardContent>
        {/* Connection status placeholder matches the list view spacing */}
        <div className="space-y-4">
          <div className="hidden md:block overflow-x-auto rounded-md border">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-800">
                <TableRow>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <TableHead key={i}><Skeleton className="h-4 w-full" /></TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="md:hidden space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 border rounded-lg space-y-3 bg-white dark:bg-neutral-900 shadow-sm">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex gap-2 pt-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function LogUserHistorySkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-80 w-full flex items-end gap-2 overflow-hidden px-4 pb-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className={cn("flex-1", ['h-24', 'h-40', 'h-32', 'h-56', 'h-48', 'h-20', 'h-36'][i % 7])} />
            ))}
          </div>
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Skeleton className="size-8 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
              <div className="text-right space-y-1">
                <Skeleton className="h-4 w-20 ml-auto" />
                <Skeleton className="h-3 w-16 ml-auto" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function LogUserMenuSkeleton() {
  return (
    <Card className="animate-in fade-in duration-500">
      <CardHeader>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-9 w-40" />
          </div>
          <Skeleton className="h-9 w-24" />
        </div>
        <Skeleton className="h-6 w-56" />
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader className="bg-slate-600">
              <TableRow>
                <TableHead><Skeleton className="h-4 w-24 bg-white/20" /></TableHead>
                <TableHead className="text-right"><Skeleton className="h-4 w-16 bg-white/20 ml-auto" /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-3/4" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export function LogUserShellSkeleton() {
  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-8 w-40" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-32 rounded-full" />
          <Skeleton className="h-9 w-9 rounded-md" />
        </div>
      </div>

      <div className="border-b border-border/50 pb-3 mb-0">
        <div className="w-full h-auto md:h-14 p-2 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-0 bg-muted/10 opacity-70">
          <div className="h-10 md:h-full rounded-lg mx-1 flex items-center justify-center gap-2 px-4 shadow-sm bg-white dark:bg-neutral-900 border border-border/50">
            <Users className="h-4 w-4 text-muted-foreground/50" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="h-10 md:h-full rounded-lg mx-1 flex items-center justify-center gap-2 px-4">
            <Clock className="h-4 w-4 text-muted-foreground/30" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="h-10 md:h-full rounded-lg mx-1 flex items-center justify-center gap-2 px-4">
            <Menu className="h-4 w-4 text-muted-foreground/30" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </div>

      <div className="mt-4">
        <LogUserOnlineSkeleton />
      </div>
    </div>
  );
}
