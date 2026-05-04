import { ReactNode } from "react";

export interface SelectOption {
  label: string;
  value: string;
}

export interface DDHeaderData {
  thang: string;
  kdkanwil: string;
  nmkanwil: string;
  kdkppn: string;
  nmkppn: string;
  kdlokasi: string;
  nmkabkota: string;
  pagu: number;
  Januari: number;
  Februari: number;
  Maret: number;
  April: number;
  Mei: number;
  Juni: number;
  Juli: number;
  Agustus: number;
  September: number;
  Oktober: number;
  November: number;
  Desember: number;
  total_nilai: number;
  [key: string]: any;
}

export interface ButtonRowProps {
  onTayang: () => void;
  onShowSQL: () => void;
  role: string;
  loadingResults: boolean;
  onDownloadCSV: () => void;
  onDownloadExcel: () => void;
  onDownloadPDF: () => void;
  onRefresh: () => void;
}

export interface DDHeaderFiltersProps {
  selectedYear: string;
  setSelectedYear: (val: string) => void;
  yearOptions: SelectOption[];
  selectedkanwil: string;
  setSelectedkanwil: (val: string) => void;
  kanwilOptions: SelectOption[];
  selectedkppn: string;
  setSelectedkppn: (val: string) => void;
  kppnOptions: SelectOption[];
  selectedLokasi: string;
  setSelectedLokasi: (val: string) => void;
  lokasiOptions: SelectOption[];
  startMonth: string;
  setStartMonth: (val: string) => void;
  endMonth: string;
  setEndMonth: (val: string) => void;
  role: string;
  onTayang: () => void;
  onDownloadCSV: () => void;
  onDownloadExcel: () => void;
  onDownloadPDF: () => void;
  onRefresh: () => void;
  onShowSQL: () => void;
  loadingResults: boolean;
}

export interface DDHeaderTableProps {
  tableData: DDHeaderData[];
  currentPage: number;
  setCurrentPage: (page: number) => void;
  itemsPerPage: number;
}

export interface SQLModalProps {
  isOpen: boolean;
  onClose: () => void;
  sqlQuery: string;
  isCopied: boolean;
  onCopy: () => void;
}
