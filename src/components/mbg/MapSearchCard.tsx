"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ProvinceSelect,
  RegencySelect,
  useProvinceRegency,
} from "./ProvinceRegencySelectors";
import { MapStatsOverlay, OverlayStats } from "./MapStatsOverlay";
import { X } from "lucide-react";
import { toast } from "sonner";

// Lightweight Google Maps loader
function useGoogleMaps(apiKey?: string) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!apiKey) {
      setError("API key tidak tersedia");
      return;
    }

    if (typeof window === "undefined") return;
    if ((window as any).google?.maps) {
      setLoaded(true);
      return;
    }

    const existing = document.getElementById("gmaps-script");
    if (existing) {
      existing.addEventListener("load", () => setLoaded(true));
      existing.addEventListener("error", () =>
        setError("Gagal memuat Google Maps")
      );
      return;
    }

    const script = document.createElement("script");
    script.id = "gmaps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker&language=id&region=ID`;
    script.async = true;
    script.defer = true;
    script.onload = () => setLoaded(true);
    script.onerror = () => setError("Gagal memuat Google Maps");
    document.body.appendChild(script);
  }, [apiKey]);

  return { loaded, error };
}

export function MapSearchCard() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const { loaded, error } = useGoogleMaps(apiKey);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(
    null
  );
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const {
    provinceId,
    setProvinceId,
    regencyId,
    setRegencyId,
    selectedProvince,
    selectedRegency,
  } = useProvinceRegency();
  const [searchText, setSearchText] = useState("");

  const [overlayScope, setOverlayScope] = useState<
    "national" | "province" | "regency"
  >("national");
  const [overlayName, setOverlayName] = useState<string | undefined>(undefined);
  const [overlayStats, setOverlayStats] = useState<OverlayStats | undefined>(
    undefined
  );
  const [overlayLoading, setOverlayLoading] = useState<boolean>(false);
  const [overlayError, setOverlayError] = useState<string | null>(null);

  // Initialize map once
  useEffect(() => {
    if (!loaded || !mapRef.current || mapInstanceRef.current) return;
    const center = { lat: -2.5, lng: 118.0 }; // Indonesia center
    const map = new google.maps.Map(mapRef.current, {
      center,
      zoom: 5,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      mapId: "mbg-map", // Required for AdvancedMarkerElement
    });
    mapInstanceRef.current = map;
  }, [loaded]);

  // Setup Places autocomplete restricted to Indonesia; prefer regions/cities
  useEffect(() => {
    if (!loaded || !mapInstanceRef.current) return;
    const input = document.getElementById(
      "mbg-map-search"
    ) as HTMLInputElement | null;
    if (!input) return;

    const ac = new google.maps.places.Autocomplete(input, {
      fields: ["geometry", "name", "types", "address_components"],
      componentRestrictions: { country: "id" },
      types: ["(regions)"],
    });
    autocompleteRef.current = ac;

    ac.addListener("place_changed", () => {
      const place = ac.getPlace();
      if (!place.geometry || !place.geometry.location) {
        toast.error("Lokasi tidak ditemukan");
        return;
      }
      const loc = place.geometry.location;
      mapInstanceRef.current!.panTo(loc);
      mapInstanceRef.current!.setZoom(8);

      if (!markerRef.current) {
        markerRef.current = new google.maps.marker.AdvancedMarkerElement({
          map: mapInstanceRef.current!,
          position: loc,
        });
      } else {
        markerRef.current.position = loc;
      }

      // Sync state: clear dropdowns, set overlay scope by place granularity
      setProvinceId("");
      setRegencyId("");
      setOverlayError(null);
      setOverlayLoading(true);
      setOverlayScope("province");
      setOverlayName(place.name);
      // TODO: replace with real fetch for province-level stats
      setTimeout(() => {
        setOverlayStats({
          totalAllocation: 1250000000000,
          totalRealization: 980000000000,
          beneficiaries: 2450120,
          coveragePct: 78.4,
        });
        setOverlayLoading(false);
      }, 400);
    });

    return () => {
      google.maps.event.clearInstanceListeners(ac);
    };
  }, [loaded]);

  // Pan/zoom when province/regency changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // If a dropdown selection happens, clear search input
    if (provinceId || regencyId) setSearchText("");

    if (selectedRegency?.centroid) {
      map.panTo(selectedRegency.centroid);
      map.setZoom(10);
      if (!markerRef.current) {
        markerRef.current = new google.maps.marker.AdvancedMarkerElement({
          map,
          position: selectedRegency.centroid,
        });
      } else {
        markerRef.current.position = selectedRegency.centroid;
      }
      // Overlay: regency
      setOverlayScope("regency");
      setOverlayName(selectedRegency.name);
      setOverlayLoading(true);
      setOverlayError(null);
      setTimeout(() => {
        setOverlayStats({
          totalAllocation: 25000000000,
          totalRealization: 18000000000,
          beneficiaries: 12045,
          coveragePct: 74.2,
        });
        setOverlayLoading(false);
      }, 300);
      return;
    }

    if (selectedProvince?.centroid || provinceId === "") {
      const center = selectedProvince?.centroid ?? { lat: -2.5, lng: 118.0 };
      const zoom = selectedProvince ? 7 : 5;
      map.panTo(center);
      map.setZoom(zoom);

      if (markerRef.current && !selectedProvince) {
        markerRef.current.map = null;
        markerRef.current = null;
      } else if (selectedProvince) {
        if (!markerRef.current) {
          markerRef.current = new google.maps.marker.AdvancedMarkerElement({
            map,
            position: selectedProvince.centroid!,
          });
        } else {
          markerRef.current.position = selectedProvince.centroid!;
        }
      }

      // Overlay: province or national
      if (selectedProvince) {
        setOverlayScope("province");
        setOverlayName(selectedProvince.name);
        setOverlayLoading(true);
        setOverlayError(null);
        setTimeout(() => {
          setOverlayStats({
            totalAllocation: 120000000000,
            totalRealization: 98000000000,
            beneficiaries: 245012,
            coveragePct: 78.4,
          });
          setOverlayLoading(false);
        }, 300);
      } else {
        setOverlayScope("national");
        setOverlayName(undefined);
        setOverlayLoading(true);
        setOverlayError(null);
        setTimeout(() => {
          setOverlayStats({
            totalAllocation: 3000000000000,
            totalRealization: 2100000000000,
            beneficiaries: 12500120,
            coveragePct: 75.1,
          });
          setOverlayLoading(false);
        }, 300);
      }
      return;
    }
  }, [provinceId, regencyId, selectedProvince, selectedRegency]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Peta Distribusi MBG</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div className="relative">
            <Input
              id="mbg-map-search"
              placeholder="Cari provinsi/kabupaten/kota (Indonesia)"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            {searchText && (
              <button
                type="button"
                aria-label="Bersihkan pencarian"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setSearchText("");
                  if (autocompleteRef.current) {
                    (
                      document.getElementById(
                        "mbg-map-search"
                      ) as HTMLInputElement
                    ).value = "";
                  }
                  // Reset map to national view and clear markers
                  if (mapInstanceRef.current) {
                    mapInstanceRef.current.panTo({ lat: -2.5, lng: 118.0 });
                    mapInstanceRef.current.setZoom(5);
                  }
                  if (markerRef.current) {
                    markerRef.current.map = null;
                    markerRef.current = null;
                  }
                  // Also reset dropdowns
                  setProvinceId("");
                  setRegencyId("");
                  setOverlayScope("national");
                }}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <ProvinceSelect
            value={provinceId}
            onChange={(v) => {
              setProvinceId(v);
              setRegencyId("");
            }}
          />
          <RegencySelect
            value={regencyId}
            onChange={setRegencyId}
            provinceId={provinceId}
          />
        </div>
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
            stats={overlayStats}
            isLoading={overlayLoading}
            error={overlayError}
          />
        </div>
      </CardContent>
    </Card>
  );
}
