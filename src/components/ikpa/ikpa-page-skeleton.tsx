import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-6 w-16" />
          </div>
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
}

function ShareCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>
          <Skeleton className="h-4 w-40" />
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <Skeleton className="h-[250px] w-full" />
        <div className="mt-4 rounded-md border p-3 space-y-2">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={`share-row-${idx}`} className="flex items-center justify-between">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-3 w-8" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function DetailCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded-sm" />
          <CardTitle>
            <Skeleton className="h-4 w-36" />
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={`detail-row-${idx}`} className="flex items-center justify-between border-b border-muted pb-2">
              <div className="space-y-1">
                <Skeleton className="h-3 w-36" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-5 w-10" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function IkpaPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="mt-2 h-4 w-72 max-w-full" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-10" />
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              <Skeleton className="h-6 w-24" />
            </CardTitle>
            <Skeleton className="h-9 w-20" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={`filter-${idx}`} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6 mb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <StatCardSkeleton key={`stat-${idx}`} />
          ))}
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>
              <Skeleton className="h-6 w-56" />
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[250px] p-4">
            <Skeleton className="h-full w-full" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-8 space-y-6">
          <Card>
            <CardHeader className="pb-2 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-9 w-16" />
                  <Skeleton className="h-9 w-20" />
                  <Skeleton className="h-9 w-16" />
                </div>
                <Skeleton className="h-4 w-28" />
              </div>
            </CardHeader>
            <CardContent className="px-6">
              <div className="rounded-md border p-4 space-y-3">
                {Array.from({ length: 7 }).map((_, idx) => (
                  <div key={`table-row-${idx}`} className="grid grid-cols-9 gap-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))}
              </div>
              <div className="p-4 border-t flex items-center justify-between">
                <Skeleton className="h-3 w-24" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DetailCardSkeleton />
            <DetailCardSkeleton />
          </div>
        </div>

        <div className="xl:col-span-4 space-y-6">
          <ShareCardSkeleton />
          <ShareCardSkeleton />
        </div>
      </div>
    </div>
  );
}

export default IkpaPageSkeleton;
