"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { X, Grid3X3 } from "lucide-react";
import Kddept from "@/data/kddept.json";
import Kdkanwil from "@/data/kdkanwil.json";
import Kdkppn from "@/data/kdkppn.json";

interface FilterData {
  selectedKementerian: string;
  selectedKanwil: string;
  selectedKppn: string;
  tahun: string;
}

interface FilterProps {
  show: boolean;
  onHide: () => void;
  onFilter: (filterData: FilterData) => void;
}

const Filter = ({ show, onHide, onFilter }: FilterProps) => {
  // Use useAuth to get user data
  const { user } = useAuth();

  const [selectedKementerian, setSelectedKementerian] = useState("00");
  const [selectedKanwil, setSelectedKanwil] = useState("00");
  const [selectedKppn, setSelectedKppn] = useState("00");
  const [tahun, setTahun] = useState("");

  const handleClose = () => {
    onHide();
  };

  const handleFilter = () => {
    const filterData: FilterData = {
      selectedKementerian,
      selectedKanwil,
      selectedKppn,
      tahun,
    };

    // Mengirim hasil filter ke komponen induk
    onFilter(filterData);
    onHide();
  };

  useEffect(() => {
    const currentYear = new Date().getFullYear();
    setTahun(currentYear.toString());
  }, []);

  const handleTahunChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedTahun = event.target.value;
    setTahun(selectedTahun);
  };

  const resetFilter = () => {
    setSelectedKementerian("00");
    setSelectedKanwil("00");
    setSelectedKppn("00");
    // Preserve current year or reset? Original code resets to empty string which means 'Semua Tahun'
    // But useEffect sets it to currentYear on mount.
    // Original resetFilter function set tahun to "" (line 69 of original file)
    // So I will stick to that behavior.

    const filterData: FilterData = {
      selectedKementerian: "00",
      selectedKanwil: "00",
      selectedKppn: "00",
      tahun: "",
    };

    onFilter(filterData);
    setTahun("");
    onHide();
  };

  const role = user?.role;
  const userKdKanwil = user?.kdkanwil;
  const userKdKppn = user?.kdkppn;


  const kanwilOptions = Kdkanwil.filter((kanwil) =>
    role === "kanwil_djpb" ? kanwil.kdkanwil === userKdKanwil : true
  ).map((kdkanwil, index) => (
    <option key={index} value={kdkanwil.kdkanwil}>
      {kdkanwil.kdkanwil} - {kdkanwil.nmkanwil}
    </option>
  ));

  const kppnOptions = Kdkppn.filter((kppn) =>
    role === "kppn" ? kppn.kdkppn === userKdKppn : true
  ).map((kdkppn, index) => (
    <option key={index} value={kdkppn.kdkppn}>
      {kdkppn.kdkppn} - {kdkppn.nmkppn}
    </option>
  ));

  const inputClass = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <Dialog open={show} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-4xl w-[95vw] max-w-7xl sm:max-w-7xl max-h-[90vw] sm:max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <Grid3X3 className="h-5 w-5 text-primary" />
            Filter Data
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-4">
              <Label htmlFor="tahun" className="text-right">Tahun</Label>
            </div>
            <div className="col-span-8">
              <select
                id="tahun"
                className={inputClass}
                value={tahun}
                onChange={handleTahunChange}
              >
                <option value="">Semua Tahun</option>
                <option value="2023">TA 2023</option>
                <option value="2024">TA 2024</option>
                <option value="2025">TA 2025</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-4">
              <Label htmlFor="kementerian" className="text-right">Kementerian</Label>
            </div>
            <div className="col-span-8">
              <select
                id="kementerian"
                className={inputClass}
                value={selectedKementerian}
                onChange={(e) => setSelectedKementerian(e.target.value)}
              >
                <option value="00">Semua Kementerian</option>
                {Kddept.map((dept, index) => (
                  <option key={index} value={dept.kddept}>
                    {dept.kddept} - {dept.nmdept}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {role !== "kppn" && (
            <div className="grid grid-cols-12 gap-4 items-center">
              <div className="col-span-4">
                <Label htmlFor="kanwil" className="text-right">Kanwil</Label>
              </div>
              <div className="col-span-8">
                <select
                  id="kanwil"
                  className={inputClass}
                  value={selectedKanwil}
                  onChange={(e) => setSelectedKanwil(e.target.value)}
                >
                  {role !== "kanwil_djpb" && (
                    <option value="00">Semua Kanwil</option>
                  )}
                  {kanwilOptions}
                </select>
              </div>
            </div>
          )}

          {role === "kppn" && (
            <div className="grid grid-cols-12 gap-4 items-center">
              <div className="col-span-4">
                <Label htmlFor="kppn" className="text-right">KPPN</Label>
              </div>
              <div className="col-span-8">
                <select
                  id="kppn"
                  className={inputClass}
                  value={selectedKppn}
                  onChange={(e) => setSelectedKppn(e.target.value)}
                >
                  {role !== "kppn" && (
                    <option value="00">Semua KPPN</option>
                  )}
                  {kppnOptions}
                </select>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-3">
          <Button variant="outline" onClick={resetFilter}>
            Reset Filter
          </Button>
          <Button variant="destructive" onClick={handleFilter}>
            Terapkan Filter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default Filter;
