export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="h-6 w-48 rounded bg-muted animate-pulse" />
          <div className="h-4 w-80 rounded bg-muted animate-pulse" />
        </div>
        <div className="h-9 w-36 rounded-md bg-muted animate-pulse" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-md border p-4">
          <div className="h-4 w-28 rounded bg-muted animate-pulse mb-2" />
          <div className="h-8 w-24 rounded bg-muted animate-pulse" />
        </div>
        <div className="rounded-md border p-4">
          <div className="h-4 w-28 rounded bg-muted animate-pulse mb-2" />
          <div className="h-8 w-24 rounded bg-muted animate-pulse" />
        </div>
        <div className="rounded-md border p-4">
          <div className="h-4 w-28 rounded bg-muted animate-pulse mb-2" />
          <div className="h-8 w-24 rounded bg-muted animate-pulse" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-md border p-4">
          <div className="h-4 w-56 rounded bg-muted animate-pulse mb-4" />
          <div className="h-[280px] w-full rounded bg-muted animate-pulse" />
        </div>
        <div className="rounded-md border p-4">
          <div className="h-4 w-56 rounded bg-muted animate-pulse mb-4" />
          <div className="h-[280px] w-full rounded bg-muted animate-pulse" />
        </div>
      </div>

      <div className="rounded-md border p-4">
        <div className="h-4 w-56 rounded bg-muted animate-pulse mb-4" />
        <div className="h-[320px] w-full rounded bg-muted animate-pulse" />
      </div>
    </div>
  );
}
