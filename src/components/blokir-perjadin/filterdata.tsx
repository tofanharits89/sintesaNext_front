import React, { useState, useEffect } from "react";
import Kddept from "../../data/kddept.json";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface FilterDataProps {
  show: boolean;
  onHide: () => void;
  onFilter: (filterData: any) => void;
  role?: string;
  kdkanwil?: string;
  kdkppn?: string;
}

const FilterData: React.FC<FilterDataProps> = ({
  show,
  onHide,
  onFilter,
  role = "",
  kdkanwil = "",
  kdkppn = "",
}) => {
  const [selectedKementerian, setSelectedKementerian] = useState("00");
  const [tahun, setTahun] = useState<string | number>("");

  useEffect(() => {
    const currentYear = new Date().getFullYear();
    setTahun(currentYear);
  }, []);

  const handleFilter = () => {
    const filterData = {
      selectedKementerian,
      tahun,
    };

    onFilter(filterData);
    onHide();
  };

  const resetFilter = () => {
    setSelectedKementerian("00");

    const filterData = {
      selectedKementerian: "00",
      tahun: "",
    };

    onFilter(filterData);
    onHide();
    // Also reset local state if needed, though state update is async
  };

  return (
    <Dialog open={show} onOpenChange={(open) => !open && onHide()}>
      <DialogContent
        showCloseButton={false}
        className="w-[95vw] max-w-7xl sm:max-w-7xl max-h-[90vw] sm:max-h-[90vh] flex flex-col overflow-hidden"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <i className="bi bi-grid-3x3-gap-fill text-primary" />
            Filter Data
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4 flex-1 overflow-y-auto">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="kementerian" className="text-right">
              Kementerian
            </Label>
            <div className="col-span-3">
              <Select
                value={selectedKementerian}
                onValueChange={setSelectedKementerian}
              >
                <SelectTrigger id="kementerian" className="w-full">
                  <SelectValue placeholder="Pilih Kementerian" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="00">Semua Kementerian</SelectItem>
                  {Kddept.map((dept: any, index: number) => (
                    <SelectItem key={index} value={dept.kddept}>
                      {dept.kddept} - {dept.nmdept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onHide}>
            Tutup
          </Button>
          <Button variant="secondary" onClick={resetFilter}>
            Reset Filter
          </Button>
          <Button variant="default" onClick={handleFilter}>
            Terapkan Filter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FilterData;
