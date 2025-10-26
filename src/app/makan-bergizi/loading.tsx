import { ChartLoadingFallback } from "@/components/ui/loading-fallback";

export default function MakanBergiziLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-56 bg-gray-200 rounded animate-pulse" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="h-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-32 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="lg:col-span-2">
          <div className="h-96 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
      <ChartLoadingFallback />
    </div>
  );
}
