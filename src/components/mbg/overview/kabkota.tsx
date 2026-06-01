"use client";

import { useState, useEffect } from "react";
import numeral from "numeral";
import { motion } from "motion/react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import type { PenerimaKabItem } from "./jumlahpenerimaKab";

const ITEMS_PER_PAGE = 10;

const KabKota = ({ data }: { data: PenerimaKabItem[] }) => {
  const safeData = Array.isArray(data) ? data : [];
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(safeData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentData = safeData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [data]);

  const handlePrev = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  return (
    <TooltipProvider>
      <div className="mt-4 mb-0">
        {currentData.map((item, idx) => (
          <motion.div
            key={idx}
            className="mb-1"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05, duration: 0.3 }}
          >
            <div className="mt-3 w-full cursor-pointer rounded-md border border-border bg-muted/50 shadow-sm transition-all duration-200 hover:shadow-md">
              <div className="flex items-center justify-between gap-1 px-2 py-1 flex-wrap">
                <div className="flex items-center">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <h6 className="m-0 p-0 text-[0.85em]">
                        {item.kabkota.length > 15
                          ? item.kabkota.slice(0, 15) + "..."
                          : item.kabkota}
                      </h6>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      {item.kabkota}
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[1em] font-bold">
                    {numeral(item.penerimakab).format("0,0")}{" "}
                    <span className="mx-2 inline-block rounded bg-destructive px-1.5 py-0.5 text-[0.8em] font-bold text-destructive-foreground">
                      {numeral(item.persenpenerimakab).format("0,0")} %
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        {totalPages > 1 && (
          <div className="mt-4 mb-0 flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrev}
              disabled={currentPage === 1}
            >
              ‹
            </Button>
            <span className="text-sm text-muted-foreground">
              Halaman {currentPage} dari {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              disabled={currentPage === totalPages}
            >
              ›
            </Button>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default KabKota;
