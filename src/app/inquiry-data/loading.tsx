import { ComponentLoadingFallback } from "@/components/ui/loading-fallback";

export default function InquiryDataLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-56 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-96 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
      <div className="space-y-6">
        <ComponentLoadingFallback />
        <ComponentLoadingFallback />
        <ComponentLoadingFallback />
      </div>
    </div>
  );
}