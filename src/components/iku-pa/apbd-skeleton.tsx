import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

/**
 * ApbdPageSkeleton
 *
 * Mirrors the full layout of the iku-pa/apbd page:
 *   1. Page header (title + subtitle)
 *   2. Map card — 70/30 split (Leaflet map | legend table)
 *   3. Detail card — table with dynamic columns
 */
export function ApbdPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* ── Page header ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-4 w-80" />
        </div>
      </div>

      <section className="space-y-4 p-1">
        {/* ── Map card ── */}
        <Card className="border shadow-sm overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              {/* Card title */}
              <Skeleton className="h-5 w-56" />
              {/* Triwulan tabs */}
              <div className="flex gap-1 w-full sm:w-auto">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 flex-1 sm:w-24 rounded-lg" />
                ))}
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="flex flex-col lg:flex-row gap-4 items-stretch">
              {/* ── Map area (70%) ── */}
              <div className="relative w-full lg:w-[70%] lg:shrink-0 min-h-[350px] rounded-lg overflow-hidden border">
                <Skeleton className="absolute inset-0 rounded-none" />
                {/* Simulate map tiles pattern */}
                <div className="absolute inset-0 grid grid-cols-4 grid-rows-3 gap-px opacity-20">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <Skeleton key={i} className="rounded-none" />
                  ))}
                </div>
              </div>

              {/* ── Legend card (30%) ── */}
              <Card className="w-full lg:w-[30%] border shadow-sm overflow-hidden flex flex-col py-0 gap-0">
                <CardHeader className="shrink-0 px-4 pb-3 pt-4">
                  <Skeleton className="h-5 w-36" />
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-0">
                  <div className="rounded-md border overflow-hidden">
                    {/* Table header */}
                    <div className="flex items-center gap-2 bg-muted/40 px-3 py-2 border-b">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-3 w-20 ml-auto" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    {/* 10 legend rows */}
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 px-3 py-1.5 border-b last:border-b-0"
                      >
                        {/* Color badge */}
                        <Skeleton className="h-5 w-20 rounded-full" />
                        {/* Tw I–III range */}
                        <Skeleton className="h-3 w-28 ml-auto" />
                        {/* Tw IV range */}
                        <Skeleton className="h-3 w-16" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* ── Detail card ── */}
        <Card className="border shadow-lg overflow-hidden bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <Skeleton className="h-5 w-64" />
            {/* Download button */}
            <Skeleton className="h-8 w-36 rounded-md" />
          </CardHeader>
          <CardContent>
            <ApbdDetailTableSkeleton />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

/**
 * ApbdDetailTableSkeleton
 *
 * Mimics the DataTable inside the detail card.
 * Columns: No | Pemerintah Daerah | Kategori | Kode Akun | Nama Akun |
 *          Pagu | Jan–Mar (3 month cols) | Total | %
 */
export function ApbdDetailTableSkeleton({ rows = 8 }: { rows?: number }) {
  // Simulate Triwulan I columns: No, Pemda, Kategori, Kode, Nama, Pagu, Jan, Feb, Mar, Total, %
  const colWidths = [
    "w-8",   // No
    "w-40",  // Pemerintah Daerah
    "w-24",  // Kategori
    "w-20",  // Kode Akun
    "w-36",  // Nama Akun
    "w-28",  // Pagu
    "w-20",  // Jan
    "w-20",  // Feb
    "w-20",  // Mar
    "w-28",  // Total
    "w-16",  // %
  ];

  return (
    <div className="rounded-md border overflow-hidden text-xs">
      {/* Header */}
      <div className="flex items-center gap-2 bg-muted/50 px-3 py-2.5 border-b">
        {colWidths.map((w, i) => (
          <Skeleton key={i} className={`h-3 ${w} shrink-0`} />
        ))}
      </div>
      {/* Body rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          className={`flex items-center gap-2 px-3 py-2 border-b last:border-b-0 ${
            rowIdx % 2 === 0 ? "bg-white" : "bg-muted/20"
          }`}
        >
          {colWidths.map((w, colIdx) => (
            <Skeleton
              key={colIdx}
              className={`h-3 shrink-0 ${
                colIdx === 1
                  ? // Vary name widths for realism
                    `w-${[32, 28, 36, 24, 32, 28, 36, 24][rowIdx % 8]}`
                  : colIdx === 10
                  ? "w-14 rounded-full h-5" // % badge
                  : w
              }`}
            />
          ))}
        </div>
      ))}
      {/* Pagination row */}
      <div className="flex items-center justify-between px-3 py-2 border-t bg-muted/20">
        <Skeleton className="h-3 w-32" />
        <div className="flex items-center gap-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-7 rounded-md" />
          ))}
        </div>
      </div>
    </div>
  );
}
