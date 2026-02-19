"use client";

import React, { useState, useEffect } from "react";
import { Grid3X3, RotateCcw } from "lucide-react";
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

import Kddept from "@/data/kddept.json";
import Kdkanwil from "@/data/kdkanwil.json";
import { useAuth } from "@/hooks/useAuth";

interface FilterCardProps {
  onFilter: (data: FilterResult) => void;
}

export interface FilterResult {
  selectedKementerian: string;
  selectedKanwil: string;
  selectedJenisMp: string;
  tahun: string;
  triwulan: string;
}

const Kdmppnbp = [
  {
    kdmppnbp: "01",
    nmmppnbp: "Terpusat",
  },
  {
    kdmppnbp: "02",
    nmmppnbp: "Tidak Terpusat",
  },
];

export default function FilterCard({ onFilter }: FilterCardProps) {
  const { user } = useAuth();

  const isKanwil = user?.role === "kanwil_djpb";
  const isPusat = ["super_admin", "co_admin", "kantor_pusat", "ditpa"].includes(
    user?.role || "",
  );
  const isKppnOrOther = !isKanwil && !isPusat;

  const defaultKanwil = isKanwil && user?.kdkanwil ? user.kdkanwil : "00";

  const [selectedKementerian, setSelectedKementerian] = useState("00");
  const [selectedKanwil, setSelectedKanwil] = useState(defaultKanwil);
  const [selectedJenisMp, setSelectedJenisMp] = useState("00");
  const [tahun, setTahun] = useState("");
  const [triwulan, setTriwulan] = useState("");

  useEffect(() => {
    if (isKanwil && user?.kdkanwil) {
      setSelectedKanwil(user.kdkanwil);
    }
  }, [isKanwil, user]);

  const resetFilter = () => {
    const resetData: FilterResult = {
      selectedKementerian: "00",
      selectedKanwil: isKanwil && user?.kdkanwil ? user.kdkanwil : "00",
      selectedJenisMp: "00",
      tahun: "",
      triwulan: "",
    };
    setSelectedKementerian("00");
    setSelectedKanwil(isKanwil && user?.kdkanwil ? user.kdkanwil : "00");
    setSelectedJenisMp("00");
    setTahun("");
    setTriwulan("");
    onFilter(resetData);
  };

  const handleFilterChange = (updates: Partial<FilterResult>) => {
    const filterData: FilterResult = {
      selectedKementerian,
      selectedKanwil,
      selectedJenisMp,
      tahun,
      triwulan,
      ...updates,
    };
    onFilter(filterData);
  };

  const kanwilOptions = Kdkanwil.filter((kanwil) =>
    isKanwil ? kanwil.kdkanwil === user?.kdkanwil : true,
  ).map((kdkanwil, index) => (
    <SelectItem key={index} value={kdkanwil.kdkanwil}>
      {kdkanwil.kdkanwil} - {kdkanwil.nmkanwil}
    </SelectItem>
  ));

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Grid3X3 className="w-5 h-5 text-primary" />
            Filter Data
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilter}
            className="h-8 gap-1"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          {/* Tahun */}
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium">Tahun</Label>
            <Select
              value={tahun || "00"}
              onValueChange={(val) => {
                const newTahun = val === "00" ? "" : val;
                setTahun(newTahun);
                handleFilterChange({ tahun: newTahun });
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Semua Tahun" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="00">Semua Tahun</SelectItem>
                <SelectItem value="2025">TA 2025</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Triwulan */}
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium">Triwulan</Label>
            <Select
              value={triwulan || "00"}
              onValueChange={(val) => {
                const newTriwulan = val === "00" ? "" : val;
                setTriwulan(newTriwulan);
                handleFilterChange({ triwulan: newTriwulan });
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Semua Triwulan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="00">Semua Triwulan</SelectItem>
                <SelectItem value="1">Triwulan I</SelectItem>
                <SelectItem value="2">Triwulan II</SelectItem>
                <SelectItem value="3">Triwulan III</SelectItem>
                <SelectItem value="4">Triwulan IV</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Kementerian */}
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium">Kementerian</Label>
            <Select
              value={selectedKementerian}
              onValueChange={(val) => {
                setSelectedKementerian(val);
                handleFilterChange({ selectedKementerian: val });
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Semua Kementerian" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="00">Semua Kementerian</SelectItem>
                {Kddept.map((dept, index) => (
                  <SelectItem key={index} value={dept.kddept}>
                    {dept.kddept} - {dept.nmdept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Kanwil - Hidden for KPPN/Satker roles */}
          {!isKppnOrOther && (
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium">Kanwil</Label>
              <Select
                value={selectedKanwil}
                onValueChange={(val) => {
                  setSelectedKanwil(val);
                  handleFilterChange({ selectedKanwil: val });
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Semua Kanwil" />
                </SelectTrigger>
                <SelectContent>
                  {!isKanwil && (
                    <SelectItem value="00">Semua Kanwil</SelectItem>
                  )}
                  {kanwilOptions}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Jenis PNBP */}
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium">Jenis PNBP</Label>
            <Select
              value={selectedJenisMp}
              onValueChange={(val) => {
                setSelectedJenisMp(val);
                handleFilterChange({ selectedJenisMp: val });
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Semua Jenis MP" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="00">Semua Jenis MP</SelectItem>
                {Kdmppnbp.map((mp, index) => (
                  <SelectItem key={index} value={mp.kdmppnbp}>
                    {mp.nmmppnbp}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
