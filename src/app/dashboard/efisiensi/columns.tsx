import { ColumnDef } from "@tanstack/react-table";

const formatCurrency = (value: number | null | undefined) => {
  if (value === null || value === undefined) return "-";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatPercentage = (value: number | null | undefined) => {
  if (value === null || value === undefined) return "-";
  return `${new Intl.NumberFormat("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value))}%`;
};

export interface EfisiensiRow {
  kddept: string;
  nmdept: string;
  total_pagu: number;
  total_blokir: number;
  avg_potensi_efisiensi: number;
  total_nilai_efisiensi: number;
}

export const columns: ColumnDef<EfisiensiRow>[] = [
  {
    id: "no",
    header: () => <div className="text-center font-medium">No.</div>,
    cell: ({ row }) => <div className="text-center">{row.index + 1}</div>,
  },
  {
    accessorKey: "kddept",
    header: () => <div className="text-center font-medium">Kode K/L</div>,
    cell: ({ row }) => <div className="text-center font-medium">{row.getValue("kddept")}</div>,
  },
  {
    accessorKey: "nmdept",
    header: () => <div className="text-center font-medium">Nama Kementerian/Lembaga</div>,
    cell: ({ row }) => (
      <div 
        className="text-left truncate max-w-[250px] xl:max-w-[400px]" 
        title={row.getValue("nmdept")}
      >
        {row.getValue("nmdept")}
      </div>
    ),
  },
  {
    accessorKey: "total_pagu",
    header: () => <div className="text-center font-medium">Total Pagu</div>,
    cell: ({ row }) => (
      <div className="text-right font-mono tabular-nums pr-2">
        {formatCurrency(row.getValue("total_pagu"))}
      </div>
    ),
  },
  {
    accessorKey: "total_blokir",
    header: () => <div className="text-center font-medium">Total Blokir</div>,
    cell: ({ row }) => (
      <div className="text-right font-mono tabular-nums pr-2">
        {formatCurrency(row.getValue("total_blokir"))}
      </div>
    ),
  },
  {
    accessorKey: "avg_potensi_efisiensi",
    header: () => <div className="text-center font-medium">Rata-rata Potensi Inefisiensi</div>,
    cell: ({ row }) => (
      <div className="text-right font-mono tabular-nums pr-2">
        {formatPercentage(row.getValue("avg_potensi_efisiensi"))}
      </div>
    ),
  },
  {
    accessorKey: "total_nilai_efisiensi",
    header: () => <div className="text-center font-medium">Total Nilai Inefisiensi</div>,
    cell: ({ row }) => (
      <div className="text-right font-mono tabular-nums pr-2">
        {formatCurrency(row.getValue("total_nilai_efisiensi"))}
      </div>
    ),
  },
];
