import { MapStatsOverlay } from "@/components/mbg/MapStatsOverlay";
import type { MapStats, MbgIndicatorKey } from "@/features/mbg/types/domain";

export function MapView({
  mapRef,
  loaded,
  overlayScope,
  indicator,
  overlayName,
  stats,
  statsLoading,
  statsError,
}: {
  mapRef: React.RefObject<HTMLDivElement | null>;
  loaded: boolean;
  overlayScope: "national" | "province" | "regency";
  indicator: MbgIndicatorKey;
  overlayName?: string;
  stats?: MapStats | null;
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
        indicator={indicator}
        {...(overlayName !== undefined ? { scopeName: overlayName } : {})}
        {...(typeof stats !== 'undefined' ? { stats } : {})}
        isLoading={statsLoading}
        {...(statsError !== null ? { error: statsError } : {})}
      />
    </div>
  );
}
