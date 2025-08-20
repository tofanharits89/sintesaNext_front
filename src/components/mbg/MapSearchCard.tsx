"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ProvinceSelect, RegencySelect, useProvinceRegency } from "./ProvinceRegencySelectors";
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
      existing.addEventListener("error", () => setError("Gagal memuat Google Maps"));
      return;
    }

    const script = document.createElement("script");
    script.id = "gmaps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=id&region=ID`;
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
  const markerRef = useRef<google.maps.Marker | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const { provinceId, setProvinceId, regencyId, setRegencyId, selectedProvince, selectedRegency } = useProvinceRegency();

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
    });
    mapInstanceRef.current = map;
  }, [loaded]);

  // Setup Places autocomplete restricted to Indonesia; prefer regions/cities
  useEffect(() => {
    if (!loaded || !mapInstanceRef.current) return;
    const input = document.getElementById("mbg-map-search") as HTMLInputElement | null;
    if (!input) return;

    const ac = new google.maps.places.Autocomplete(input, {
      fields: ["geometry", "name", "types"],
      componentRestrictions: { country: "id" },
      types: ["(regions)"]
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
        markerRef.current = new google.maps.Marker({ map: mapInstanceRef.current! });
      }
      markerRef.current.setPosition(loc);
    });

    return () => {
      google.maps.event.clearInstanceListeners(ac);
    };
  }, [loaded]);

  // Pan/zoom when province/regency changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (selectedRegency?.centroid) {
      map.panTo(selectedRegency.centroid);
      map.setZoom(10);
      if (!markerRef.current) {
        markerRef.current = new google.maps.Marker({ map });
      }
      markerRef.current.setPosition(selectedRegency.centroid);
      return;
    }

    if (selectedProvince?.centroid) {
      map.panTo(selectedProvince.centroid);
      map.setZoom(7);
      if (!markerRef.current) {
        markerRef.current = new google.maps.Marker({ map });
      }
      markerRef.current.setPosition(selectedProvince.centroid);
      return;
    }
  }, [selectedProvince, selectedRegency]);

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
          <Input id="mbg-map-search" placeholder="Cari provinsi/kabupaten/kota (Indonesia)" />
          <ProvinceSelect value={provinceId} onChange={(v) => { setProvinceId(v); setRegencyId(""); }} />
          <RegencySelect value={regencyId} onChange={setRegencyId} provinceId={provinceId} />
        </div>
        <div className="h-[420px] w-full rounded-md overflow-hidden border">
          <div ref={mapRef} className="h-full w-full" />
          {!loaded && (
            <div className="h-full w-full grid place-items-center text-muted-foreground text-sm">Memuat peta…</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

