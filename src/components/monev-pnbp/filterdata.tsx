import React, { useState, useEffect } from "react";
// import { Modal, Button, Form, Col, Row } from "react-bootstrap";
import { Grid3X3 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
    <SelectItem key={index} value={kdkanwil.kdkanwil}>
      {kdkanwil.kdkanwil} - {kdkanwil.nmkanwil}
    </SelectItem>
  ));

  return (
    <Dialog open={show} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center text-lg gap-2">
            <Grid3X3 className="w-5 h-5 text-primary font-bold" />
            Filter Data
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-12 md:col-span-4">
              <Label className="text-foreground">Tahun</Label>
            </div>
            <div className="col-span-12 md:col-span-8">
              <Select
                value={tahun || "00"}
                onValueChange={(val) => setTahun(val === "00" ? "" : val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Semua Tahun" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="00">Semua Tahun</SelectItem>
                  {/* <SelectItem value="2023">TA 2023</SelectItem>
                    <SelectItem value="2024">TA 2024</SelectItem> */}
                  <SelectItem value="2025">TA 2025</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-12 md:col-span-4">
              <Label className="text-foreground">Triwulan</Label>
            </div>
            <div className="col-span-12 md:col-span-8">
              <Select
                value={triwulan || "00"}
                onValueChange={(val) => setTriwulan(val === "00" ? "" : val)}
              >
                <SelectTrigger>
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
          </div>

          <div className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-12 md:col-span-4">
              <Label className="text-foreground">Kementerian</Label>
            </div>
            <div className="col-span-12 md:col-span-8">
              <Select
                value={selectedKementerian}
                onValueChange={setSelectedKementerian}
              >
                <SelectTrigger>
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
          </div>

          {!isKppnOrOther && (
            <div className="grid grid-cols-12 gap-4 items-center">
              <div className="col-span-12 md:col-span-4">
                <Label className="text-foreground">Kanwil</Label>
              </div>
              <div className="col-span-12 md:col-span-8">
                <Select
                  value={selectedKanwil}
                  onValueChange={setSelectedKanwil}
                >
                  <SelectTrigger>
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
            </div>
          )}

          <div className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-12 md:col-span-4">
              <Label className="text-foreground">Jenis PNBP</Label>
            </div>
            <div className="col-span-12 md:col-span-8">
              <Select
                value={selectedJenisMp}
                onValueChange={setSelectedJenisMp}
              >
                <SelectTrigger>
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
