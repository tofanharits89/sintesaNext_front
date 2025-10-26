import { ComponentLoadingFallback } from "@/components/ui/loading-fallback";

export default function TransferDaerahLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-56 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-80 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
      <div className="space-y-4">
        <div className="flex space-x-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
        <ComponentLoadingFallback />
      </div>
    </div>
  );
}
