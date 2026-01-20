import React, { useState, useEffect } from "react";
// import { Modal, Button, Form, Col, Row } from "react-bootstrap";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/utils"; // Assuming utils exists

import Kddept from "@/data/kddept.json";
import Kdkanwil from "@/data/kdkanwil.json";
import { useAuth } from "@/hooks/useAuth";

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

interface FilterDataProps {
  show: boolean;
  onHide: () => void;
  onFilter: (data: FilterResult) => void;
}

interface FilterResult {
  selectedKementerian: string;
  selectedKanwil: string;
  selectedJenisMp: string;
  tahun: string;
  triwulan: string;
}

const FilterData: React.FC<FilterDataProps> = ({ show, onHide, onFilter }) => {
  const { user } = useAuth();

  // Mapping deprecated 'role' logic to new system
  // Role '2' was Kanwil (restricted to own kanwil)
  // Role '3' was likely KPPN/Satker (hidden Kanwil dropdown)
  // Others (1, etc.) were Pusat (full access)

  const isKanwil = user?.role === "kanwil_djpb";
  const isPusat = ["super_admin", "co_admin", "kantor_pusat"].includes(
    user?.role || "",
  );
  const isKppnOrOther = !isKanwil && !isPusat; // Equivalent to role "3"

  const defaultKanwil = isKanwil && user?.kdkanwil ? user.kdkanwil : "00";

  const [selectedKementerian, setSelectedKementerian] = useState("00");
  const [selectedKanwil, setSelectedKanwil] = useState(defaultKanwil);
  const [selectedJenisMp, setSelectedJenisMp] = useState("00");
  const [tahun, setTahun] = useState("");
  const [triwulan, setTriwulan] = useState("");

  const handleClose = () => {
    onHide();
  };

  const handleFilter = () => {
    const filterData: FilterResult = {
      selectedKementerian,
      selectedKanwil,
      selectedJenisMp,
      tahun,
      triwulan,
    };

    // Mengirim hasil filter ke komponen induk
    onFilter(filterData);

    onHide();
  };

  useEffect(() => {
    // const currentYear = new Date().getFullYear();
    setTahun("");
    // setTriwulan("1");
    if (isKanwil && user?.kdkanwil) {
      setSelectedKanwil(user.kdkanwil);
    }
  }, [isKanwil, user]);

  const handleTahunChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedTahun = event.target.value;
    setTahun(selectedTahun);
  };

  const handleTriwulanChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const selectedTriwulan = event.target.value;
    setTriwulan(selectedTriwulan);
  };

  const resetFilter = () => {
    setSelectedKementerian("00");
    setSelectedKanwil(isKanwil && user?.kdkanwil ? user.kdkanwil : "00");
    setSelectedJenisMp("00");
    setTahun(""); // Mengatur kembali tahun ke "Semua Tahun"
    setTriwulan(""); // Mengatur kembali triwulan ke "Semua Triwulan"

    const filterData: FilterResult = {
      selectedKementerian: "00",
      selectedKanwil: isKanwil && user?.kdkanwil ? user.kdkanwil : "00",
      selectedJenisMp: "00",
      tahun: "",
      triwulan: "",
    };

    // Mengirim hasil filter yang direset ke komponen induk
    onFilter(filterData);

    onHide();
  };

  const kanwilOptions = Kdkanwil.filter((kanwil) =>
    isKanwil ? kanwil.kdkanwil === user?.kdkanwil : true,
  ).map((kdkanwil, index) => (
    <option key={index} value={kdkanwil.kdkanwil}>
      {kdkanwil.kdkanwil} - {kdkanwil.nmkanwil}
    </option>
  ));

  return (
    <Dialog open={show} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center text-lg gap-2">
            <i className="bi bi-grid-3x3-gap-fill text-primary font-bold"></i>
            Filter Data
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-12 md:col-span-4">
              <Label className="text-dark">Tahun</Label>
            </div>
            <div className="col-span-12 md:col-span-8">
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={tahun}
                onChange={handleTahunChange}
              >
                <option value="">Semua Tahun</option>
                {/* <option value="2023">TA 2023</option>
                    <option value="2024">TA 2024</option> */}
                <option value="2025">TA 2025</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-12 md:col-span-4">
              <Label className="text-dark">Triwulan</Label>
            </div>
            <div className="col-span-12 md:col-span-8">
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={triwulan}
                onChange={handleTriwulanChange}
              >
                <option value="">Semua Triwulan</option>
                <option value="1">Triwulan I</option>
                <option value="2">Triwulan II</option>
                <option value="3">Triwulan III</option>
                <option value="4">Triwulan IV</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-12 md:col-span-4">
              <Label className="text-dark">Kementerian</Label>
            </div>
            <div className="col-span-12 md:col-span-8">
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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

          {!isKppnOrOther && (
            <div className="grid grid-cols-12 gap-4 items-center">
              <div className="col-span-12 md:col-span-4">
                <Label className="text-dark">Kanwil</Label>
              </div>
              <div className="col-span-12 md:col-span-8">
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={selectedKanwil}
                  onChange={(e) => setSelectedKanwil(e.target.value)}
                >
                  {!isKanwil && <option value="00">Semua Kanwil</option>}
                  {kanwilOptions}
                </select>
              </div>
            </div>
          )}

          <div className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-12 md:col-span-4">
              <Label className="text-dark">Jenis PNBP</Label>
            </div>
            <div className="col-span-12 md:col-span-8">
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={selectedJenisMp}
                onChange={(e) => setSelectedJenisMp(e.target.value)}
              >
                <option value="00">Semua Jenis MP</option>
                {Kdmppnbp.map((mp, index) => (
                  <option key={index} value={mp.kdmppnbp}>
                    {mp.nmmppnbp}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-end gap-2">
          <Button variant="destructive" size="sm" onClick={handleFilter}>
            Terapkan Filter
          </Button>
          <Button variant="secondary" size="sm" onClick={resetFilter}>
            Reset Filter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FilterData;
