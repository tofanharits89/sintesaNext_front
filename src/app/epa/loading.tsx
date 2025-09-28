import { ChartLoadingFallback } from "@/components/ui/loading-fallback";

export default function EpaLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="h-96 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="lg:col-span-3">
          <ChartLoadingFallback />
        </div>
      </div>
    </div>
  );
}