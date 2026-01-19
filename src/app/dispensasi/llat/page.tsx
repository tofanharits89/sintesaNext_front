"use client";

import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContents, TabsContent } from "@/components/animate-ui/components/animate/tabs";
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
      <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Data Dispensasi LLAT</h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowModalFilter(true)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filter Data
          </Button>
          {role !== "lainnya" && (
            <Button onClick={handleRekam}>
              Rekam Dispensasi
            </Button>
          )}
        </div>
      </div>

      <section>
        <Tabs defaultValue="dispensasi-spm" className="w-full gap-3" onValueChange={handleCek}>
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
