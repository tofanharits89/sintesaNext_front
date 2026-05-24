"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContents, TabsContent } from "@/components/animate-ui/components/animate/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { ResetButton } from "@/components/ui/reset-button";
import DispenSPM from "@/components/dispensasi/dispen-spm";
import DispenKontrak from "@/components/dispensasi/dispen-kontrak";
import DispenTUP from "@/components/dispensasi/dispen-tup";
import Monitoring from "@/components/dispensasi/monitoring-dispen";
import Rekam from "@/components/dispensasi/rekam";
import { useAuth } from "@/hooks/useAuth";
import { Grid, FileText, Layers, LayoutDashboard, Filter } from "lucide-react";
import Kddept from "@/data/kddept.json";
import Kdkanwil from "@/data/kdkanwil.json";
import Kdkppn from "@/data/kdkppn.json";

const DispensasiPage: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role;
  const userKdKanwil = user?.kdkanwil;
  const userKdKppn = user?.kdkppn;

  const [cek, setCek] = useState(0);
  const [id, setId] = useState("");
  const [where, setWhere] = useState("");
  const [showModalRekam, setShowModalRekam] = useState(false);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2021 }, (_, i) =>
    (currentYear - i).toString()
  );

  const [selectedTahun, setSelectedTahun] = useState(currentYear.toString());
  const [selectedKementerian, setSelectedKementerian] = useState("00");
  const [selectedKanwil, setSelectedKanwil] = useState("00");
  const [selectedKppn, setSelectedKppn] = useState("00");

  // Build filter WHERE clause whenever filter values change
  const buildWhereClause = useCallback(() => {
    const addFilterClause = (filterVal: string, columnName: string) => {
      if (filterVal !== "00" && filterVal !== "") {
        return `${columnName} = '${filterVal}'`;
      }
      return "";
    };

    const whereClauses = [
      addFilterClause(selectedKementerian, "a.kddept"),
      addFilterClause(selectedKanwil, "a.kdkanwil"),
      addFilterClause(selectedTahun, "a.thang"),
      addFilterClause(selectedKppn, "a.kdkppn"),
    ].filter(Boolean);

    if (whereClauses.length > 0) {
      return "  " + whereClauses.join(" AND ");
    }
    return "";
  }, [selectedKementerian, selectedKanwil, selectedTahun, selectedKppn]);

  // Apply filter whenever selections change
  useEffect(() => {
    const newWhere = buildWhereClause();
    setWhere(newWhere);
    setCek((prev) => prev + 1);
  }, [buildWhereClause]);

  const handleReset = () => {
    setSelectedTahun(currentYear.toString());
    setSelectedKementerian("00");
    setSelectedKanwil("00");
    setSelectedKppn("00");
  };

  const handleRekam = () => {
    setShowModalRekam(true);
  };

  // Build options for Kanwil (filtered by role)
  const kanwilOptions = useMemo(() => {
    const filtered = Kdkanwil.filter((kanwil) =>
      role === "kanwil_djpb" ? kanwil.kdkanwil === userKdKanwil : true
    );
    return [
      { value: "00", label: "Semua Kanwil" },
      ...filtered.map((k) => ({
        value: k.kdkanwil,
        label: `${k.kdkanwil} - ${k.nmkanwil}`,
      })),
    ];
  }, [role, userKdKanwil]);

  // Build options for KPPN (filtered by role)
  const kppnOptions = useMemo(() => {
    const filtered = Kdkppn.filter((kppn) =>
      role === "kppn" ? kppn.kdkppn === userKdKppn : true
    );
    return [
      ...(role !== "kppn" ? [{ value: "00", label: "Semua KPPN" }] : []),
      ...filtered.map((k) => ({
        value: k.kdkppn,
        label: `${k.kdkppn} - ${k.nmkppn}`,
      })),
    ];
  }, [role, userKdKppn]);

  // Build options for Kementerian
  const kementerianOptions = useMemo(() => {
    return [
      { value: "00", label: "Semua Kementerian" },
      ...Kddept.map((dept) => ({
        value: dept.kddept,
        label: `${dept.kddept} - ${dept.nmdept}`,
      })),
    ];
  }, []);

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Data Dispensasi LLAT</h1>
            <p className="text-sm text-muted-foreground">
              Kelola data dispensasi SPM, Kontrak, dan TUP
            </p>
          </div>

          <div className="flex items-center gap-2">
            {role !== "lainnya" && (
              <Button onClick={handleRekam}>
                Rekam Dispensasi
              </Button>
            )}
          </div>
        </div>

        {/* Filter Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <CardTitle>Filter Data</CardTitle>
              </div>
              <ResetButton onReset={handleReset} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <div className="space-y-1.5 flex-1 min-w-[200px]">
                <Label htmlFor="filter-tahun" className="text-sm font-medium">Tahun</Label>
                <Select value={selectedTahun} onValueChange={setSelectedTahun}>
                  <SelectTrigger id="filter-tahun" className="w-full">
                    <SelectValue placeholder="Semua Tahun" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="00">Semua Tahun</SelectItem>
                    {years.map((year) => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 flex-1 min-w-[200px]">
                <Label htmlFor="filter-kementerian" className="text-sm font-medium">Kementerian</Label>
                <SearchableSelect
                  options={kementerianOptions}
                  value={selectedKementerian}
                  onValueChange={setSelectedKementerian}
                  placeholder="Semua Kementerian"
                  searchPlaceholder="Cari Kementerian..."
                  emptyMessage="Kementerian tidak ditemukan."
                />
              </div>

              {role !== "kppn" && (
                <div className="space-y-1.5 flex-1 min-w-[200px]">
                  <Label htmlFor="filter-kanwil" className="text-sm font-medium">Kanwil</Label>
                  <SearchableSelect
                    options={kanwilOptions}
                    value={selectedKanwil}
                    onValueChange={setSelectedKanwil}
                    placeholder="Semua Kanwil"
                    searchPlaceholder="Cari Kanwil..."
                    emptyMessage="Kanwil tidak ditemukan."
                    disabled={role === "kanwil_djpb"}
                  />
                </div>
              )}

              {role === "kppn" && (
                <div className="space-y-1.5 flex-1 min-w-[200px]">
                  <Label htmlFor="filter-kppn" className="text-sm font-medium">KPPN</Label>
                  <SearchableSelect
                    options={kppnOptions}
                    value={selectedKppn}
                    onValueChange={setSelectedKppn}
                    placeholder="Semua KPPN"
                    searchPlaceholder="Cari KPPN..."
                    emptyMessage="KPPN tidak ditemukan."
                    disabled={role === "kppn"}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <section>
          <Tabs defaultValue="dispensasi-spm" className="w-full gap-3">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <TabsList className="w-full h-auto p-2 rounded-xl grid grid-cols-2 lg:flex lg:flex-wrap gap-2">
                <TabsTrigger value="dispensasi-spm" className="px-4 py-2 h-auto">
                  <Grid className="w-4 h-4 mr-2" />
                  Dispensasi SPM
                </TabsTrigger>
                <TabsTrigger value="dispensasi-kontrak" className="px-4 py-2 h-auto">
                  <FileText className="w-4 h-4 mr-2" />
                  Dispensasi Kontrak
                </TabsTrigger>
                <TabsTrigger value="dispensasi-tup" className="px-4 py-2 h-auto">
                  <Layers className="w-4 h-4 mr-2" />
                  Dispensasi TUP
                </TabsTrigger>
                {(role === "super_admin" ||
                  role === "kanwil_djpb" ||
                  role === "kppn") && (
                    <TabsTrigger value="monitoring-spm" className="px-4 py-2 h-auto">
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      Monitoring
                    </TabsTrigger>
                  )}
              </TabsList>
            </div>

            <TabsContents>
              <TabsContent value="dispensasi-spm">
                <Card>
                  <CardContent className="p-4">
                    <DispenSPM cek={cek} id={id} where={where} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="dispensasi-kontrak">
                <Card>
                  <CardContent className="p-4">
                    <DispenKontrak cek={cek} id={id} where={where} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="dispensasi-tup">
                <Card>
                  <CardContent className="p-4">
                    <DispenTUP cek={cek} id={id} where={where} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="monitoring-spm">
                <Card>
                  <CardContent className="p-4">
                    <Monitoring cek={cek} id={id} where={where} />
                  </CardContent>
                </Card>
              </TabsContent>
            </TabsContents>
          </Tabs>
        </section>
      </div>

      <Rekam show={showModalRekam} onHide={() => setShowModalRekam(false)} onSuccess={() => setCek((prev) => prev + 1)} />
    </>
  );
};

export default DispensasiPage;
