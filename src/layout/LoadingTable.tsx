import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

const LoadingTable = () => (
  <div className="space-y-2">
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-full" />
  </div>
);

const Loading2 = () => (
  <div className="space-y-2">
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-full" />
  </div>
);

const Loading1 = () => <Skeleton className="h-4 w-full" />;

const LoadingData = () => (
  <div className="space-y-2">
    {Array.from({ length: 8 }).map((_, i) => (
      <Skeleton key={i} className="h-4 w-full" />
    ))}
  </div>
);

const TableSkeleton = LoadingTable;

export { LoadingTable, Loading2, Loading1, LoadingData, TableSkeleton };
