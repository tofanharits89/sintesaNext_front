import { ColumnDef } from "@tanstack/react-table";

const fmt = (v: number | string) => new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(Number(v));

export interface PengendalianBelanjaRow {
  kode_ba: string;
  nama_ba: string;
  pagu_dipa: number;
  blokir: number;
  pagu_dipa_efektif: number;
  realisasi_basis_kas: number;
  pagu_kontrak: number;
  real_kontrak: number;
  outs_kontrak: number;
  outs_uptup: number;
  belum_sp2d: number;
  nilai_spp_spm: number;
  total_kas_dan_outstanding: number;
  sisa_pagu_efektif: number;
}

export const columns: ColumnDef<PengendalianBelanjaRow>[] = [
  {
    id: "no",
    header: () => <div className="text-center font-medium">No.</div>,
    cell: ({ row }) => <div className="text-center">{row.index + 1}</div>,
  },
  {
    accessorKey: "kode_ba",
    header: () => <div className="text-center font-medium">Kode BA</div>,
    cell: ({ row }) => <div className="text-center">{row.getValue("kode_ba")}</div>,
  },
  {
    accessorKey: "nama_ba",
    header: () => <div className="text-center font-medium">Nama BA</div>,
    cell: ({ row }) => (
      <div className="text-left max-w-[280px] truncate" title={row.getValue("nama_ba") as string}>
        {row.getValue("nama_ba")}
      </div>
    ),
    footer: () => <div className="text-center font-bold">Grand Total</div>,
  },
  {
    accessorKey: "pagu_dipa",
    header: () => <div className="text-center font-medium">Pagu DIPA</div>,
    cell: ({ row }) => (
      <div className="text-right font-mono tabular-nums pr-2">
        {fmt(row.getValue("pagu_dipa") as number)}
      </div>
    ),
    footer: ({ table }) => (
      <div className="text-right font-mono tabular-nums pr-2 font-bold text-black">
        {fmt(
          table
            .getFilteredRowModel()
            .rows.reduce(
              (sum, row) => sum + (Number(row.getValue("pagu_dipa")) || 0),
              0
            )
        )}
      </div>
    ),
  },
  {
    accessorKey: "blokir",
    header: () => <div className="text-center font-medium">Blokir</div>,
    cell: ({ row }) => (
      <div className="text-right font-mono tabular-nums pr-2">
        {fmt(row.getValue("blokir") as number)}
      </div>
    ),
    footer: ({ table }) => (
      <div className="text-right font-mono tabular-nums pr-2 font-bold text-black">
        {fmt(
          table
            .getFilteredRowModel()
            .rows.reduce(
              (sum, row) => sum + (Number(row.getValue("blokir")) || 0),
              0
            )
        )}
      </div>
    ),
  },
  {
    accessorKey: "pagu_dipa_efektif",
    header: () => <div className="text-center font-medium">Pagu DIPA Efektif</div>,
    cell: ({ row }) => (
      <div className="text-right font-mono tabular-nums pr-2">
        {fmt(row.getValue("pagu_dipa_efektif") as number)}
      </div>
    ),
    footer: ({ table }) => (
      <div className="text-right font-mono tabular-nums pr-2 font-bold text-black">
        {fmt(
          table
            .getFilteredRowModel()
            .rows.reduce(
              (sum, row) => sum + (Number(row.getValue("pagu_dipa_efektif")) || 0),
              0
            )
        )}
      </div>
    ),
  },
  {
    accessorKey: "realisasi_basis_kas",
    header: () => <div className="text-center font-medium">Realisasi Basis Kas</div>,
    cell: ({ row }) => (
      <div className="text-right font-mono tabular-nums pr-2">
        {fmt(row.getValue("realisasi_basis_kas") as number)}
      </div>
    ),
    footer: ({ table }) => (
      <div className="text-right font-mono tabular-nums pr-2 font-bold text-black">
        {fmt(
          table
            .getFilteredRowModel()
            .rows.reduce(
              (sum, row) => sum + (Number(row.getValue("realisasi_basis_kas")) || 0),
              0
            )
        )}
      </div>
    ),
  },
  {
    accessorKey: "outs_kontrak",
    header: () => <div className="text-center font-medium">Outstanding Kontrak</div>,
    cell: ({ row }) => (
      <div className="text-right font-mono tabular-nums pr-2">
        {fmt(row.getValue("outs_kontrak") as number)}
      </div>
    ),
    footer: ({ table }) => (
      <div className="text-right font-mono tabular-nums pr-2 font-bold text-black">
        {fmt(
          table
            .getFilteredRowModel()
            .rows.reduce(
              (sum, row) => sum + (Number(row.getValue("outs_kontrak")) || 0),
              0
            )
        )}
      </div>
    ),
  },
  {
    accessorKey: "outs_uptup",
    header: () => <div className="text-center font-medium">Outstanding UP/TUP</div>,
    cell: ({ row }) => (
      <div className="text-right font-mono tabular-nums pr-2">
        {fmt(row.getValue("outs_uptup") as number)}
      </div>
    ),
    footer: ({ table }) => (
      <div className="text-right font-mono tabular-nums pr-2 font-bold text-black">
        {fmt(
          table
            .getFilteredRowModel()
            .rows.reduce(
              (sum, row) => sum + (Number(row.getValue("outs_uptup")) || 0),
              0
            )
        )}
      </div>
    ),
  },
  {
    accessorKey: "total_kas_dan_outstanding",
    header: () => <div className="text-center font-medium">Total Kas &amp; Outstanding</div>,
    cell: ({ row }) => (
      <div className="text-right font-mono tabular-nums pr-2 font-semibold">
        {fmt(row.getValue("total_kas_dan_outstanding") as number)}
      </div>
    ),
    footer: ({ table }) => (
      <div className="text-right font-mono tabular-nums pr-2 font-bold text-black">
        {fmt(
          table
            .getFilteredRowModel()
            .rows.reduce(
              (sum, row) => sum + (Number(row.getValue("total_kas_dan_outstanding")) || 0),
              0
            )
        )}
      </div>
    ),
  },
  {
    accessorKey: "belum_sp2d",
    header: () => <div className="text-center font-medium">Belum SP2D</div>,
    cell: ({ row }) => (
      <div className="text-right font-mono tabular-nums pr-2">
        {fmt(row.getValue("belum_sp2d") as number)}
      </div>
    ),
    footer: ({ table }) => (
      <div className="text-right font-mono tabular-nums pr-2 font-bold text-black">
        {fmt(
          table
            .getFilteredRowModel()
            .rows.reduce(
              (sum, row) => sum + (Number(row.getValue("belum_sp2d")) || 0),
              0
            )
        )}
      </div>
    ),
  },
  {
    accessorKey: "nilai_spp_spm",
    header: () => <div className="text-center font-medium">Nilai SPP/SPM</div>,
    cell: ({ row }) => (
      <div className="text-right font-mono tabular-nums pr-2">
        {fmt(row.getValue("nilai_spp_spm") as number)}
      </div>
    ),
    footer: ({ table }) => (
      <div className="text-right font-mono tabular-nums pr-2 font-bold text-black">
        {fmt(
          table
            .getFilteredRowModel()
            .rows.reduce(
              (sum, row) => sum + (Number(row.getValue("nilai_spp_spm")) || 0),
              0
            )
        )}
      </div>
    ),
  },
  {
    accessorKey: "sisa_pagu_efektif",
    header: () => <div className="text-center font-medium">Sisa Pagu Efektif</div>,
    cell: ({ row }) => {
      const val = Number(row.getValue("sisa_pagu_efektif"));
      return (
        <div
          className={`text-right font-mono tabular-nums pr-2 font-semibold ${
            val < 0 ? "text-red-600" : "text-green-600"
          }`}
        >
          {fmt(val)}
        </div>
      );
    },
    footer: ({ table }) => {
      const total = table
        .getFilteredRowModel()
        .rows.reduce(
          (sum, row) => sum + (Number(row.getValue("sisa_pagu_efektif")) || 0),
          0
        );
      return (
        <div
          className={`text-right font-mono tabular-nums pr-2 font-bold ${
            total < 0 ? "text-red-600" : "text-green-600"
          }`}
        >
          {fmt(total)}
        </div>
      );
    },
  },
];
