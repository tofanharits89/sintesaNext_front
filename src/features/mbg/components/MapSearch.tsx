"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProvinceRegency } from "@/components/mbg/ProvinceRegencySelectors";
import { toast } from "sonner";
import { SearchAutocomplete } from "@/features/mbg/components/SearchAutocomplete";
import { Filters } from "@/features/mbg/components/Filters";
import { useMapStats } from "@/features/mbg/hooks/useMapStats";
import { useGoogleMaps } from "@/features/mbg/hooks/useGoogleMaps";
import { MapView } from "@/features/mbg/components/MapView";



export function MapSearch() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const { loaded, error } = useGoogleMaps(apiKey);

  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any | null>(null);
  const markerRef = useRef<any | null>(null);

  const { provinceId, setProvinceId, regencyId, setRegencyId, selectedProvince, selectedRegency } = useProvinceRegency();
  const [searchText, setSearchText] = useState("");

  const [overlayScope, setOverlayScope] = useState<"national" | "province" | "regency">("national");
  const [overlayName, setOverlayName] = useState<string | undefined>(undefined);

  // Derive query parameters for stats
  const statScope = overlayScope;
  const statId = statScope === "regency" ? regencyId : statScope === "province" ? provinceId : undefined;
  const { data: stats, isLoading: statsLoading, error: statsError } = useMapStats(statScope, statId);
  const overlayError = statsError ? (statsError as Error).message : null;

  // Initialize map once
  useEffect(() => {
    if (!loaded || !mapRef.current || mapInstanceRef.current) return;
    const center = { lat: -2.5, lng: 118.0 };
    const map = new google.maps.Map(mapRef.current, {
      center,
      zoom: 5,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      mapId: "mbg-map",
    });
    mapInstanceRef.current = map;
  }, [loaded]);

  // Handle place selection from autocomplete
  const handlePlaceSelected = (place: any) => {
    const map = mapInstanceRef.current;
    if (!map || !place.geometry || !place.geometry.location) return;

    const loc = place.geometry.location;
    map.panTo(loc);
    map.setZoom(8);

    if (!markerRef.current) {
      markerRef.current = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: loc,
      });
    } else {
      markerRef.current.position = loc;
    }

    // Sync state: clear dropdowns, set overlay scope by place granularity
    setProvinceId("");
    setRegencyId("");
    setOverlayScope("province");
    setOverlayName(place.name);
  };

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
      } else {
        setOverlayScope("national");
        setOverlayName(undefined);
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
          <SearchAutocomplete
            value={searchText}
            onChange={(v) => {
              setSearchText(v);
              if (!v) {
                // Reset map to national view and clear markers
                const map = mapInstanceRef.current;
                if (map) {
                  map.panTo({ lat: -2.5, lng: 118.0 });
                  map.setZoom(5);
                }
                if (markerRef.current) {
                  markerRef.current.map = null;
                  markerRef.current = null;
                }
                setProvinceId("");
                setRegencyId("");
                setOverlayScope("national");
              }
            }}
            onPlaceSelected={handlePlaceSelected}
            disabled={!loaded}
          />
          <Filters
            provinceId={provinceId}
            regencyId={regencyId}
            onProvinceChange={(v) => {
              setProvinceId(v);
              setRegencyId("");
            }}
            onRegencyChange={setRegencyId}
          />
        </div>
        <MapView
          mapRef={mapRef}
          loaded={loaded}
          overlayScope={overlayScope}
          overlayName={overlayName}
          stats={stats}
          statsLoading={statsLoading}
          statsError={overlayError}
        />
      </CardContent>
    </Card>
  );
}
