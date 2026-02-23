"use client";

import { RekamWeeklyReportModal } from "@/components/laporan/rekam-weekly-report-modal";

interface RekamMonthlyReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function RekamMonthlyReportModal({
  open,
  onOpenChange,
  onSuccess,
}: RekamMonthlyReportModalProps) {
  return (
    <RekamWeeklyReportModal
      open={open}
      onOpenChange={onOpenChange}
      {...(onSuccess ? { onSuccess } : {})}
      defaultPeriode="bulanan"
    />
  );
}
