"use client";

import React, { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TableSkeleton } from "@/components/ui/skeleton-loader";
import { toast } from "sonner";
import { http } from "@/lib/api/httpClient";
import { DataTable } from "@/components/ui/data-table";
import FilterCard, { FilterResult } from "./filter-card";
import { columns, PengendalianBelanjaRow } from "./columns";

export default function PengendalianBelanja() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<PengendalianBelanjaRow[]>([]);
  const [filter, setFilter] = useState<FilterResult>({
    tahun: String(new Date().getFullYear()),
    kddept: "00",
    exclude999: false,
  });

  const fetchData = async (f: FilterResult, bustCache = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (f.tahun) params.set("tahun", f.tahun);
      if (f.kddept && f.kddept !== "00") params.set("kddept", f.kddept);
      if (f.exclude999) params.set("exclude999", "true");
      if (bustCache) params.set("_t", String(Date.now()));

      const res = await http.get(
        `/api/v1/pengendalian-belanja${params.toString() ? `?${params}` : ""}`,
      );
      setData(res.data?.result ?? []);
    } catch (err: any) {
      toast.error(
        err?.message || "Terjadi Permasalahan Koneksi atau Server Backend",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData(filter, true);
  };

  useEffect(() => {
    fetchData(filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilter = (f: FilterResult) => {
    setFilter(f);
    fetchData(f);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Dashboard Pengendalian Belanja
          </h1>
          <p className="text-sm text-muted-foreground">
            Monitoring pagu, realisasi, kontrak, dan outstanding per
            Kementerian/Lembaga.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-9 self-start sm:self-auto"
          onClick={handleRefresh}
          disabled={refreshing || loading}
        >
          <RefreshCw
            className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Filter Card */}
      <FilterCard onFilter={handleFilter} />

      {/* Data Table */}
      <section>
        <Card className="border shadow-sm">
          <CardContent className="px-8 py-4">
            {loading ? (
              <div className="p-2">
                <TableSkeleton rows={10} />
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={data}
                initialPageSize={25}
                showFooter={true}
              />
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
