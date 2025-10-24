export default function RekapEpaLoading() {
  return (
    <div className="space-y-6 md:space-y-8">
      {/* Page Header Skeleton */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
        <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      </div>

      {/* Filter Card Skeleton */}
      <div className="border rounded-lg bg-white dark:bg-neutral-950">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array(4)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Data Table Skeleton */}
      <div className="border rounded-lg bg-white dark:bg-neutral-950">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Table Header Skeleton */}
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded grid grid-cols-18 gap-2">
            {Array(18)
              .fill(0)
              .map((_, i) => (
                <div
                  key={i}
                  className="h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"
                ></div>
              ))}
          </div>

          {/* Table Rows Skeleton */}
          <div className="space-y-1">
            {Array(5)
              .fill(0)
              .map((_, rowIdx) => (
                <div key={rowIdx} className="border-t p-4 grid grid-cols-18 gap-2">
                  {Array(18)
                    .fill(0)
                    .map((_, colIdx) => (
                      <div
                        key={colIdx}
                        className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                      ></div>
                    ))}
                </div>
              ))}
          </div>

          {/* Pagination Skeleton */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
