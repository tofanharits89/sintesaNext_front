import { MapStatsOverlay } from "@/components/mbg/MapStatsOverlay";

export function MapView({
  mapRef,
  loaded,
  overlayScope,
  overlayName,
  stats,
  statsLoading,
  statsError,
}: {
  mapRef: React.RefObject<HTMLDivElement | null>;
  loaded: boolean;
  overlayScope: "national" | "province" | "regency";
  overlayName?: string;
  stats?: {
    totalAllocation: number;
    totalRealization: number;
    beneficiaries: number;
    coveragePct: number;
  };
  statsLoading: boolean;
  statsError: string | null;
}) {
  return (
    <div className="h-[420px] w-full rounded-md overflow-hidden border relative">
      <div ref={mapRef} className="h-full w-full" />
      {!loaded && (
        <div className="absolute inset-0 grid place-items-center text-muted-foreground text-sm bg-background/50">
          Memuat peta…
        </div>
      )}
      <MapStatsOverlay
        scope={overlayScope}
        scopeName={overlayName}
        stats={stats}
        isLoading={statsLoading}
        error={statsError}
      />
    </div>
  );
}
