"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMapStats } from "@/features/mbg/hooks/useMapStats";
import { useMapChoropleth } from "@/features/mbg/hooks/useMapChoropleth";
import { MapStatsOverlay } from "@/components/mbg/MapStatsOverlay";
import {
  MBG_INDICATOR_OPTIONS,
  type MbgIndicatorKey,
} from "@/features/mbg/types/domain";
import type { MbgProvChoroplethRow } from "@/features/mbg/api/services";
import useJumlahPenerimaKab, {
  type PenerimaKabItem,
} from "@/components/mbg/overview/jumlahpenerimaKab";
import provinces from "@/data/indonesia/provinces.json";

import indoData from "@/components/mbg/overview/indobaru.json";
import provkabkotaData from "@/components/mbg/overview/provkabkota.json";

// ─── Color helpers ──────────────────────────────────────────────────────────

function normalizeName(value?: string | null): string {
  if (!value) return "";
  return value
    .toUpperCase()
    .replace(/\bPROVINSI\b/g, "")
    .replace(/\bKEPULAUAN\b/g, "")
    .replace(/\bKEP\b/g, "")
    .replace(/\bDAERAH\b/g, "")
    .replace(/\bISTIMEWA\b/g, "")
    .replace(/\bKHUSUS\b/g, "")
    .replace(/\bDKI\b/g, "")
    .replace(/\bDI\b/g, "")
    .replace(/[^A-Z0-9]/g, "");
}

function getColorByIndicator(
  value: number,
  indicator: MbgIndicatorKey,
): string {
  if (indicator === "jumlahpenerima") {
    if (value > 1_500_000) return "#c0392b";
    if (value > 1_000_000) return "#d7301f";
    if (value > 500_000) return "#ef6548";
    if (value > 200_000) return "#fc8d59";
    if (value > 100_000) return "#fdbb84";
    if (value > 50_000) return "#fdd49e";
    if (value > 20_000) return "#fee8c8";
    if (value > 0) return "#fff7ec";
    return "#e8e8e8";
  }
  if (indicator === "jumlahsppg") {
    if (value > 300) return "#990000";
    if (value > 200) return "#d7301f";
    if (value > 100) return "#ef6548";
    if (value > 50) return "#fc8d59";
    if (value > 0) return "#fdd49e";
    return "#e8e8e8";
  }
  // Generic blue scale for petugas, supplier, kelompok, mitra
  if (value > 10_000) return "#1a5276";
  if (value > 5_000) return "#1f618d";
  if (value > 2_000) return "#2980b9";
  if (value > 1_000) return "#5dade2";
  if (value > 200) return "#a9cce3";
  if (value > 0) return "#d6eaf8";
  return "#e8e8e8";
}

const LEGEND_ITEMS: Record<
  MbgIndicatorKey,
  { color: string; label: string }[]
> = {
  jumlahpenerima: [
    { color: "#c0392b", label: "> 1,5 juta" },
    { color: "#d7301f", label: "1 – 1,5 juta" },
    { color: "#ef6548", label: "500 rb – 1 juta" },
    { color: "#fc8d59", label: "200 – 500 ribu" },
    { color: "#fdbb84", label: "100 – 200 ribu" },
    { color: "#fdd49e", label: "50 – 100 ribu" },
    { color: "#fee8c8", label: "20 – 50 ribu" },
    { color: "#fff7ec", label: "0 – 20 ribu" },
    { color: "#e8e8e8", label: "Tidak ada data" },
  ],
  jumlahsppg: [
    { color: "#990000", label: "> 300" },
    { color: "#d7301f", label: "201 – 300" },
    { color: "#ef6548", label: "101 – 200" },
    { color: "#fc8d59", label: "51 – 100" },
    { color: "#fdd49e", label: "1 – 50" },
    { color: "#e8e8e8", label: "0" },
  ],
  jumlahpetugas: [
    { color: "#1a5276", label: "> 10.000" },
    { color: "#1f618d", label: "5.001 – 10.000" },
    { color: "#2980b9", label: "2.001 – 5.000" },
    { color: "#5dade2", label: "1.001 – 2.000" },
    { color: "#a9cce3", label: "201 – 1.000" },
    { color: "#d6eaf8", label: "1 – 200" },
    { color: "#e8e8e8", label: "0" },
  ],
  jumlahsupplier: [
    { color: "#1a5276", label: "> 10.000" },
    { color: "#1f618d", label: "5.001 – 10.000" },
    { color: "#2980b9", label: "2.001 – 5.000" },
    { color: "#5dade2", label: "1.001 – 2.000" },
    { color: "#a9cce3", label: "201 – 1.000" },
    { color: "#d6eaf8", label: "1 – 200" },
    { color: "#e8e8e8", label: "0" },
  ],
  jumlahkelompok: [
    { color: "#1a5276", label: "> 10.000" },
    { color: "#1f618d", label: "5.001 – 10.000" },
    { color: "#2980b9", label: "2.001 – 5.000" },
    { color: "#5dade2", label: "1.001 – 2.000" },
    { color: "#a9cce3", label: "201 – 1.000" },
    { color: "#d6eaf8", label: "1 – 200" },
    { color: "#e8e8e8", label: "0" },
  ],
  jumlahmitra: [
    { color: "#1a5276", label: "> 10.000" },
    { color: "#1f618d", label: "5.001 – 10.000" },
    { color: "#2980b9", label: "2.001 – 5.000" },
    { color: "#5dade2", label: "1.001 – 2.000" },
    { color: "#a9cce3", label: "201 – 1.000" },
    { color: "#d6eaf8", label: "1 – 200" },
    { color: "#e8e8e8", label: "0" },
  ],
};

// ─── Component ───────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(n);

export function MapSearch() {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const provLayerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const kabLayerRef = useRef<any>(null);

  const [provinceId, setProvinceId] = useState<string>("");
  const [indicator, setIndicator] = useState<MbgIndicatorKey>("jumlahpenerima");
  // Tracks when Leaflet map is ready — prevents layers firing before map init
  const [mapReady, setMapReady] = useState(false);

  const { data: choroplethData } = useMapChoropleth();

  // Lookup province name from id
  const selectedProvince = useMemo(
    () =>
      (
        provinces as {
          id: string;
          name: string;
          centroid?: { lat: number; lng: number };
        }[]
      ).find((p) => p.id === provinceId) ?? null,
    [provinceId],
  );

  // Prefer DB wilnama for prov parameter (matches a_mbg_penerima_2026.nmprov better)
  const provNameForKab = useMemo(() => {
    if (!provinceId) return "";
    const dbRow = (choroplethData ?? []).find((r) => r.wilkode === provinceId);
    return dbRow?.nama_provinsi ?? selectedProvince?.name ?? "";
  }, [provinceId, choroplethData, selectedProvince]);

  // Kab-level penerima data (uses jumlahpenerimaKab hook → /penerima-by-regency)
  const { dataPenerimaKab } = useJumlahPenerimaKab(provNameForKab);

  // Kab penerima lookup: normalized kabkota → data
  const penerimaKabMap = useMemo(() => {
    const m = new Map<string, PenerimaKabItem>();
    dataPenerimaKab.forEach((item) => {
      m.set(normalizeName(item.kabkota), item);
    });
    return m;
  }, [dataPenerimaKab]);

  // Build choropleth map keyed by wilkode (reliable) + normalized name (fallback)
  const choroplethMap = useMemo(() => {
    const m = new Map<string, MbgProvChoroplethRow>();
    (choroplethData ?? []).forEach((row) => {
      const kode = String(row.wilkode ?? "").trim();
      if (kode) m.set(kode, row);
      m.set(normalizeName(row.nama_provinsi), row);
    });
    return m;
  }, [choroplethData]);

  // Stats overlay params
  const overlayScope = selectedProvince ? "province" : "national";
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
  } = useMapStats(
    overlayScope,
    provinceId || undefined,
    selectedProvince?.name,
  );
  const overlayError = statsError ? (statsError as Error).message : null;

  // ─── Init Leaflet map ────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let destroyed = false;

    import("leaflet").then(({ default: L }) => {
      if (destroyed || !containerRef.current) return;
      const map = L.map(containerRef.current, {
        attributionControl: false,
        scrollWheelZoom: true,
        zoomControl: true,
      }).setView([-2.5, 118], 5);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      mapRef.current = map;
      setMapReady(true); // ← signals layer effects to run
    });

    return () => {
      destroyed = true;
      mapRef.current?.remove();
      mapRef.current = null;
      provLayerRef.current = null;
      kabLayerRef.current = null;
      setMapReady(false);
    };
  }, []);

  // ─── Update province choropleth layer ────────────────────────────────────
  const updateProvLayer = useCallback(() => {
    if (!mapRef.current) return;

    import("leaflet").then(({ default: L }) => {
      if (!mapRef.current) return;

      if (provLayerRef.current) {
        provLayerRef.current.remove();
        provLayerRef.current = null;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const layer = L.geoJSON(indoData as any, {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        style: (feature: any) => {
          const kodeProv = (feature?.properties?.KODE_PROV as string) ?? "";
          const name = (feature?.properties?.WADMKK as string) ?? "";
          // Code-based match first (wilkode), fallback to name
          const row =
            choroplethMap.get(kodeProv) ??
            choroplethMap.get(normalizeName(name));
          const value = row ? (row[indicator] as number) : 0;
          const isSelected =
            selectedProvince && kodeProv === selectedProvince.id;

          return {
            fillColor: isSelected
              ? "#f39c12"
              : getColorByIndicator(value, indicator),
            color: "#ffffff",
            weight: isSelected ? 2.5 : 0.8,
            fillOpacity: 0.8,
          };
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onEachFeature: (feature: any, lyr: any) => {
          const name = (feature?.properties?.WADMKK as string) ?? "";
          const kodeProv = (feature?.properties?.KODE_PROV as string) ?? "";
          const row =
            choroplethMap.get(kodeProv) ??
            choroplethMap.get(normalizeName(name));
          const value = row ? (row[indicator] as number) : 0;

          const indicatorLabel =
            MBG_INDICATOR_OPTIONS.find((o) => o.value === indicator)?.label ??
            indicator;

          lyr.bindTooltip(
            `<div style="font-size:12px;line-height:1.6">
              <strong>${name}</strong><br/>
              ${indicatorLabel}: <strong>${fmt(value)}</strong>
            </div>`,
            { sticky: true, opacity: 0.97 },
          );

          lyr.on("mouseover", function (this: typeof lyr) {
            this.setStyle({ weight: 2 });
          });
          lyr.on("mouseout", function (this: typeof lyr) {
            layer.resetStyle(this);
            if (selectedProvince && kodeProv === selectedProvince.id) {
              this.setStyle({
                color: "#ffffff",
                weight: 2.5,
                fillColor: "#f39c12",
                fillOpacity: 0.8,
              });
            }
          });
          lyr.on("click", () => {
            const prov = (provinces as { id: string; name: string }[]).find(
              (p) => p.id === kodeProv,
            );
            if (prov) setProvinceId(prov.id);
          });
        },
      });

      layer.addTo(mapRef.current);
      provLayerRef.current = layer;
    });
  }, [choroplethMap, indicator, selectedProvince]);

  // ─── Update kabupaten layer ───────────────────────────────────────────────
  const updateKabLayer = useCallback(() => {
    if (!mapRef.current) return;

    if (kabLayerRef.current) {
      kabLayerRef.current.remove();
      kabLayerRef.current = null;
    }

    if (!selectedProvince) return;

    import("leaflet").then(({ default: L }) => {
      if (!mapRef.current || !selectedProvince) return;

      const provNameNorm = normalizeName(selectedProvince.name);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const features = (provkabkotaData as any).features.filter(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (f: any) => normalizeName(f?.properties?.WADMPR) === provNameNorm,
      );

      if (!features.length) return;

      const kabGeoJSON = { type: "FeatureCollection", features };
      const showPenerima =
        indicator === "jumlahpenerima" && penerimaKabMap.size > 0;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const layer = L.geoJSON(kabGeoJSON as any, {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        style: (feature: any) => {
          const kabName = (feature?.properties?.WADMKK as string) ?? "";
          const kabRow = penerimaKabMap.get(normalizeName(kabName));
          const fillColor =
            showPenerima && kabRow
              ? getColorByIndicator(kabRow.penerimakab, "jumlahpenerima")
              : "#3498db";
          return {
            fillColor,
            fillOpacity: 0.65,
            color: "#2c3e50",
            weight: 0.8,
          };
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onEachFeature: (feature: any, lyr: any) => {
          const kabName = (feature?.properties?.WADMKK as string) ?? "Kab/Kota";
          const kabRow = penerimaKabMap.get(normalizeName(kabName));
          const tooltipExtra =
            showPenerima && kabRow
              ? `<br/>Penerima: <strong>${fmt(kabRow.penerimakab)}</strong> (${Number(kabRow.persenpenerimakab).toFixed(1)}%)`
              : "";
          lyr.bindTooltip(
            `<div style="font-size:12px;line-height:1.6"><strong>${kabName}</strong>${tooltipExtra}</div>`,
            { sticky: true, opacity: 0.97 },
          );
          lyr.on("mouseover", function (this: typeof lyr) {
            this.setStyle({ fillOpacity: 0.9, weight: 2 });
          });
          lyr.on("mouseout", function (this: typeof lyr) {
            layer.resetStyle(this);
          });
        },
      });

      layer.addTo(mapRef.current);
      kabLayerRef.current = layer;

      try {
        const bounds = layer.getBounds();
        if (bounds.isValid())
          mapRef.current.fitBounds(bounds, { padding: [20, 20] });
      } catch {
        // ignore
      }
    });
  }, [selectedProvince, penerimaKabMap, indicator]);

  // Trigger province layer update — wait for mapReady + data/indicator changes
  useEffect(() => {
    if (!mapReady) return;
    const t = setTimeout(updateProvLayer, 80);
    return () => clearTimeout(t);
  }, [updateProvLayer, mapReady]);

  // Trigger kabupaten layer update — wait for mapReady
  useEffect(() => {
    if (!mapReady) return;
    const t = setTimeout(updateKabLayer, 80);
    return () => clearTimeout(t);
  }, [updateKabLayer, mapReady]);

  // Pan back to national view when province is cleared
  useEffect(() => {
    if (!provinceId && mapRef.current) {
      mapRef.current.setView([-2.5, 118], 5);
    }
  }, [provinceId]);

  // ─── Province dropdown change ─────────────────────────────────────────────
  const handleProvinceChange = (val: string) => {
    setProvinceId(val === "all" ? "" : val);
  };

  const internalProvinceValue = !provinceId ? "all" : provinceId;

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Peta Distribusi MBG</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {/* Province selector */}
          <Select
            value={internalProvinceValue}
            onValueChange={handleProvinceChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih Provinsi" />
            </SelectTrigger>
            <SelectContent className="z-[9999]">
              <SelectItem value="all">Semua Provinsi</SelectItem>
              {(provinces as { id: string; name: string }[]).map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Indicator selector */}
          <Select
            value={indicator}
            onValueChange={(val) => setIndicator(val as MbgIndicatorKey)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih Indikator" />
            </SelectTrigger>
            <SelectContent className="z-[9999]">
              {MBG_INDICATOR_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Map container */}
        <div
          className="relative w-full rounded-md overflow-hidden border"
          style={{ height: 420 }}
        >
          <div ref={containerRef} className="h-full w-full" />

          {/* Back to national button */}
          {selectedProvince && (
            <button
              type="button"
              onClick={() => setProvinceId("")}
              className="absolute top-2 left-12 z-[1000] px-2 py-1 text-xs font-semibold bg-white border border-gray-300 rounded shadow hover:bg-gray-50 transition-colors"
            >
              ← Nasional
            </button>
          )}

          {/* Legend */}
          <div
            className="absolute bottom-2 right-2 z-[1000] bg-white/90 backdrop-blur rounded border p-2 text-[10px] leading-snug shadow-sm"
            style={{ minWidth: 130 }}
          >
            <div className="font-semibold mb-1 text-[11px]">
              {MBG_INDICATOR_OPTIONS.find((o) => o.value === indicator)?.label}
            </div>
            {LEGEND_ITEMS[indicator].map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <span
                  className="inline-block w-3 h-3 rounded-sm flex-shrink-0 border border-gray-200"
                  style={{ background: item.color }}
                />
                <span>{item.label}</span>
              </div>
            ))}
          </div>

          {/* Stats overlay */}
          <MapStatsOverlay
            scope={overlayScope}
            indicator={indicator}
            {...(selectedProvince?.name
              ? { scopeName: selectedProvince.name }
              : {})}
            {...(typeof stats !== "undefined" ? { stats } : {})}
            isLoading={statsLoading}
            {...(overlayError !== null ? { error: overlayError } : {})}
          />
        </div>
      </CardContent>
    </Card>
  );
}
