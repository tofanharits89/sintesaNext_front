"use client";

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DispenSPM from "@/components/dispensasi/dispen-spm";
import DispenKontrak from "@/components/dispensasi/dispen-kontrak";
import DispenTUP from "@/components/dispensasi/dispen-tup";
import Monitoring from "@/components/dispensasi/monitoring-dispen";
import FilterData from "@/components/dispensasi/filter";
import Rekam from "@/components/dispensasi/rekam";
import { useAuth } from "@/hooks/useAuth";
import { Grid, FileText, Layers, LayoutDashboard, Filter } from "lucide-react";

const DispensasiPage: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role;

  const [cek, setCek] = useState(false);
  const [id, setId] = useState("");
  const [where, setWhere] = useState("");
  const [showModalFilter, setShowModalFilter] = useState(false);
  const [showModalRekam, setShowModalRekam] = useState(false);
  const [filter, setFilter] = useState({
    selectedKementerian: "00",
    selectedKanwil: "00",
    selectedKppn: "00",
    tahun: "",
  });

  const handleCek = () => {
    setCek(!cek);
  };

  const handleFilterResult = (filterData: any) => {
    const { selectedKementerian, selectedKanwil, selectedKppn, tahun } =
      filterData;

    let FilterWhere = "";

    const addFilterClause = (filterVal: string, columnName: string) => {
      if (filterVal !== "00" && filterVal !== "") {
        return `${columnName} = '${filterVal}'`;
      }
      return "";
    };

    setFilter(filterData);

    const whereClauses = [
      addFilterClause(selectedKementerian, "a.kddept"),
      addFilterClause(selectedKanwil, "a.kdkanwil"),
      addFilterClause(tahun, "a.thang"),
      addFilterClause(selectedKppn, "a.kdkppn"),
    ].filter(Boolean);

    if (whereClauses.length > 0) {
      FilterWhere = "  " + whereClauses.join(" AND ");
    }

    setWhere(FilterWhere);
    handleCek();
  };

  const handleRekam = () => {
    setShowModalRekam(true);
  };

  return (
    <>
      <main className="container mx-auto p-4 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Data Dispensasi LLAT</h1>
            <nav className="flex items-center text-sm text-muted-foreground mt-1">
              <a href="/" className="hover:text-primary transition-colors">Home</a>
              <span className="mx-2">/</span>
              <span className="font-medium text-foreground">Dispensasi</span>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            {role !== "lainnya" && (
              <Button onClick={handleRekam}>
                Rekam Dispensasi
              </Button>
            )}
          </div>
        </div>

        <section>
          <Tabs defaultValue="dispensasi-spm" className="w-full space-y-4" onValueChange={handleCek}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-2">
              <TabsList className="bg-transparent p-0 h-auto flex flex-wrap gap-2 justify-start">
                <TabsTrigger
                  value="dispensasi-spm"
                  className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-md px-3 py-2 h-auto"
                >
                  <Grid className="w-4 h-4 mr-2" />
                  Dispensasi SPM
                </TabsTrigger>
                <TabsTrigger
                  value="dispensasi-kontrak"
                  className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-md px-3 py-2 h-auto"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Dispensasi Kontrak
                </TabsTrigger>
                <TabsTrigger
                  value="dispensasi-tup"
                  className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-md px-3 py-2 h-auto"
                >
                  <Layers className="w-4 h-4 mr-2" />
                  Dispensasi TUP
                </TabsTrigger>
                {(role === "super_admin" ||
                  role === "kanwil_djpb" ||
                  role === "kppn") && (
                    <TabsTrigger
                      value="monitoring-spm"
                      className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-md px-3 py-2 h-auto"
                    >
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      Monitoring
                    </TabsTrigger>
                  )}

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto py-2 px-3 text-muted-foreground hover:text-primary"
                  onClick={() => setShowModalFilter(true)}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filter Data
                </Button>
              </TabsList>
            </div>

            {/* Active Filters Display */}
            <div className="flex flex-wrap items-center gap-2 empty:hidden">
              {(filter.selectedKanwil !== "00" ||
                filter.selectedKementerian !== "00" ||
                filter.selectedKppn !== "00" ||
                filter.tahun !== "") && (
                  <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                    Filter Aktif
                  </Badge>
                )}
              {filter.tahun !== "" && (
                <Badge variant="secondary">
                  Tahun {filter.tahun}
                </Badge>
              )}
              {filter.selectedKementerian !== "00" && (
                <Badge variant="secondary">
                  Kementerian {filter.selectedKementerian}
                </Badge>
              )}
              {filter.selectedKanwil !== "00" && (
                <Badge variant="secondary">
                  Kanwil {filter.selectedKanwil}
                </Badge>
              )}
              {filter.selectedKppn !== "00" && (
                <Badge variant="secondary">
                  KPPN {filter.selectedKppn}
                </Badge>
              )}
            </div>

            <TabsContent value="dispensasi-spm" className="mt-0">
              <Card>
                <CardContent className="p-4">
                  <DispenSPM cek={cek} id={id} where={where} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="dispensasi-kontrak" className="mt-0">
              <Card>
                <CardContent className="p-4">
                  <DispenKontrak cek={cek} id={id} where={where} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="dispensasi-tup" className="mt-0">
              <Card>
                <CardContent className="p-4">
                  <DispenTUP cek={cek} id={id} where={where} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="monitoring-spm" className="mt-0">
              <Card>
                <CardContent className="p-4">
                  <Monitoring cek={cek} id={id} where={where} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </section>
      </main>

      <Rekam show={showModalRekam} onHide={() => setShowModalRekam(false)} />

      <FilterData
        show={showModalFilter}
        onHide={() => setShowModalFilter(false)}
        onFilter={handleFilterResult}
      />
    </>
  );
};

export default DispensasiPage;
