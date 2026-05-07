import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Eye, Trash2 } from "lucide-react";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";

// Formatting helpers
export const formatRupiah = (value: number) => {
  if (value === 0) return "0";
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatPercent = (value: number) => {
  return `${value.toFixed(1)}%`;
};

export const formatDate = (dateString: string | null) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

interface ColumnHandlers {
  onEditKendala: (item: any) => void;
  onViewKendala: (item: any) => void;
  onDeleteKendala: (item: any) => void;
  onViewSatkerDetail: (kdsatker: string, namaSatker: string) => void;
  onViewKartu: (kdsatker: string, namaSatker: string) => void;
  onViewTagihan: (kdsatker: string, namaSatker: string) => void;
  onViewTransaksi: (kdsatker: string, namaSatker: string) => void;
  statusLaporan?: string;
}

export const getRingkasanColumns = (handlers: ColumnHandlers, totals?: any) => [
  {
    id: "no",
    header: () => <div className="text-center font-medium">No</div>,
    cell: ({ row }: any) => <div className="text-center">{row.index + 1}</div>,
  },
  {
    accessorKey: "kodeBA",
    header: () => <div className="text-center font-medium">Kode BA</div>,
    cell: ({ row }: any) => (
      <div className="text-center">{row.getValue("kodeBA")}</div>
    ),
  },
  {
    accessorKey: "kodeSatker",
    header: () => <div className="text-center font-medium">Kode Satker</div>,
    cell: ({ row }: any) => (
      <div
        className="text-center cursor-pointer text-blue-600 hover:underline font-medium"
        onClick={() =>
          handlers.onViewSatkerDetail(
            row.original.kodeSatker,
            row.original.namaSatker,
          )
        }
        title="Lihat detail satker"
      >
        {row.getValue("kodeSatker")}
      </div>
    ),
  },
  {
    accessorKey: "namaSatker",
    header: () => <div className="text-center font-medium">Nama Satker</div>,
    cell: ({ row }: any) => (
      <div
        className="text-left max-w-[200px] truncate"
        title={row.getValue("namaSatker")}
      >
        {row.getValue("namaSatker")}
      </div>
    ),
    footer: () => <div className="text-center font-bold">GRAND TOTAL</div>,
  },
  {
    accessorKey: "upKkpPerBulan",
    header: () => <div className="text-center font-medium">UP KKP Per Bulan (Rp)</div>,
    cell: ({ row }: any) => (
      <div className="text-right font-mono tabular-nums pr-2">
        {formatRupiah(row.getValue("upKkpPerBulan"))}
      </div>
    ),
    footer: ({ table }: any) => (
      <div className="text-right font-mono tabular-nums pr-2 font-bold text-black">
        {formatRupiah(
          totals
            ? totals.upKkpPerBulan
            : table
                .getFilteredRowModel()
                .rows.reduce(
                  (sum: number, row: any) =>
                    sum + (Number(row.getValue("upKkpPerBulan")) || 0),
                  0,
                ),
        )}
      </div>
    ),
  },
  {
    accessorKey: "porsiUpKkp",
    header: () => (
      <div className="text-center font-medium">Porsi UP KKP dari Total UP</div>
    ),
    cell: ({ row }: any) => (
      <div className="text-center">
        {formatPercent(row.getValue("porsiUpKkp"))}
      </div>
    ),
  },
  {
    accessorKey: "bankPenerbit",
    header: () => <div className="text-center font-medium">Bank Penerbit KKP</div>,
    cell: ({ row }: any) => (
      <div className="text-center">{row.getValue("bankPenerbit")}</div>
    ),
  },
  {
    accessorKey: "jumlahKartu",
    header: () => <div className="text-center font-medium">Jumlah Kartu</div>,
    cell: ({ row }: any) => (
      <div
        className="text-center cursor-pointer text-blue-600 hover:underline"
        onClick={() =>
          handlers.onViewKartu(row.original.kodeSatker, row.original.namaSatker)
        }
        title="Lihat detail kartu"
      >
        {row.getValue("jumlahKartu")}
      </div>
    ),
    footer: ({ table }: any) => (
      <div className="text-center font-bold">
        {totals
          ? (totals.jumlahKartu || 0).toLocaleString("id-ID")
          : table
              .getFilteredRowModel()
              .rows.reduce(
                (sum: number, row: any) =>
                  sum + (Number(row.getValue("jumlahKartu")) || 0),
                0,
              )
              .toLocaleString("id-ID")}
      </div>
    ),
  },
  {
    accessorKey: "nilaiTagihan",
    header: () => <div className="text-center font-medium">Nilai Tagihan (Rp)</div>,
    cell: ({ row }: any) => (
      <div
        className="text-right font-mono tabular-nums pr-2 cursor-pointer text-blue-600 hover:underline"
        onClick={() =>
          handlers.onViewTagihan(
            row.original.kodeSatker,
            row.original.namaSatker,
          )
        }
        title="Lihat detail tagihan"
      >
        {formatRupiah(row.getValue("nilaiTagihan"))}
      </div>
    ),
    footer: ({ table }: any) => (
      <div className="text-right font-mono tabular-nums pr-2 font-bold text-black">
        {formatRupiah(
          totals
            ? totals.nilaiTagihan
            : table
                .getFilteredRowModel()
                .rows.reduce(
                  (sum: number, row: any) =>
                    sum + (Number(row.getValue("nilaiTagihan")) || 0),
                  0,
                ),
        )}
      </div>
    ),
  },
  {
    accessorKey: "nilaiTransaksi",
    header: () => (
      <div className="text-center font-medium">Nilai Transaksi KKP (Rp)</div>
    ),
    cell: ({ row }: any) => (
      <div
        className="text-right font-mono tabular-nums pr-2 cursor-pointer text-blue-600 hover:underline"
        onClick={() =>
          handlers.onViewTransaksi(
            row.original.kodeSatker,
            row.original.namaSatker,
          )
        }
        title="Lihat detail transaksi"
      >
        {formatRupiah(row.getValue("nilaiTransaksi"))}
      </div>
    ),
    footer: ({ table }: any) => (
      <div className="text-right font-mono tabular-nums pr-2 font-bold text-black">
        {formatRupiah(
          totals
            ? totals.nilaiTransaksi
            : table
                .getFilteredRowModel()
                .rows.reduce(
                  (sum: number, row: any) =>
                    sum + (Number(row.getValue("nilaiTransaksi")) || 0),
                  0,
                ),
        )}
      </div>
    ),
  },
  {
    id: "actions",
    header: () => (
      <div className="text-center font-medium">Kendala dan Hambatan</div>
    ),
    cell: ({ row }: any) => {
      const hasKendalaData =
        row.original.kendala && row.original.kendala.trim() !== "";
      return (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 cursor-pointer"
            onClick={() => handlers.onEditKendala(row.original)}
            title={
              handlers.statusLaporan === "sent"
                ? "Laporan sudah dikirim, tidak dapat mengedit"
                : hasKendalaData
                  ? "Edit Kendala/Hambatan (Sudah diisi)"
                  : "Edit Kendala/Hambatan"
            }
            disabled={handlers.statusLaporan === "sent"}
          >
            <Pencil
              className={`h-4 w-4 ${hasKendalaData ? "text-green-600" : "text-blue-600"}`}
            />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 cursor-pointer"
            onClick={() => handlers.onViewKendala(row.original)}
            title="Lihat Kendala/Hambatan"
          >
            <Eye className="h-4 w-4 text-amber-600" />
          </Button>
          {hasKendalaData && handlers.statusLaporan !== "sent" && (
            <ConfirmationModal
              trigger={
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-8 w-8 p-0 cursor-pointer"
                  title="Hapus Kendala/Hambatan"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              }
              title="Hapus Kendala?"
              description={`Apakah Anda yakin ingin menghapus data kendala untuk satker ${row.original.namaSatker}? Tindakan ini tidak dapat dibatalkan.`}
              confirmText="Ya, Hapus"
              cancelText="Batal"
              variant="destructive"
              onConfirm={() => handlers.onDeleteKendala(row.original)}
            />
          )}
        </div>
      );
    },
  },
];

export const getTransaksiColumns = (totals?: any) => [
  {
    id: "no",
    header: () => <div className="text-center font-medium">No</div>,
    cell: ({ row }: any) => <div className="text-center">{row.index + 1}</div>,
  },
  {
    accessorKey: "kdsatker",
    header: () => <div className="text-center font-medium">Kode Satker</div>,
    cell: ({ row }: any) => (
      <div className="text-center font-mono">{row.getValue("kdsatker")}</div>
    ),
  },
  {
    accessorKey: "nmsatker",
    header: () => <div className="text-center font-medium">Nama Satker</div>,
    cell: ({ row }: any) => (
      <div
        className="text-left truncate max-w-[300px]"
        title={row.getValue("nmsatker")}
      >
        {row.getValue("nmsatker")}
      </div>
    ),
    footer: () => <div className="text-center font-bold">GRAND TOTAL</div>,
  },
  {
    accessorKey: "jml_transaksi",
    header: () => (
      <div className="text-center font-medium">Jumlah Transaksi (BAST)</div>
    ),
    cell: ({ row }: any) => (
      <div className="text-center">{row.getValue("jml_transaksi") || 0}</div>
    ),
    footer: ({ table }: any) => (
      <div className="text-center font-bold text-black">
        {totals
          ? (totals.jmlTransaksi || 0).toLocaleString("id-ID")
          : table
              .getFilteredRowModel()
              .rows.reduce(
                (sum: number, row: any) =>
                  sum + (Number(row.getValue("jml_transaksi")) || 0),
                0,
              )
              .toLocaleString("id-ID")}
      </div>
    ),
  },
  {
    accessorKey: "tg_spm",
    header: () => <div className="text-center font-medium">Tanggal SPM</div>,
    cell: ({ row }: any) => (
      <div className="text-center">{formatDate(row.getValue("tg_spm"))}</div>
    ),
  },
  {
    accessorKey: "no_spm",
    header: () => <div className="text-center font-medium">Nomor SPM</div>,
    cell: ({ row }: any) => (
      <div className="text-center">{row.getValue("no_spm") || "-"}</div>
    ),
  },
  {
    accessorKey: "tg_sp2d",
    header: () => <div className="text-center font-medium">Tanggal SP2D</div>,
    cell: ({ row }: any) => (
      <div className="text-center">{formatDate(row.getValue("tg_sp2d"))}</div>
    ),
  },
  {
    accessorKey: "no_sp2d",
    header: () => <div className="text-center font-medium">Nomor SP2D</div>,
    cell: ({ row }: any) => (
      <div className="text-center font-mono">{row.getValue("no_sp2d")}</div>
    ),
  },
  {
    accessorKey: "nilai_transaksi",
    header: () => (
      <div className="text-center font-medium">Nilai Transaksi KKP (Rp)</div>
    ),
    cell: ({ row }: any) => (
      <div className="text-right font-mono tabular-nums pr-2">
        {formatRupiah(row.getValue("nilai_transaksi"))}
      </div>
    ),
    footer: ({ table }: any) => (
      <div className="text-right font-mono tabular-nums pr-2 font-bold text-black">
        {totals
          ? formatRupiah(totals.nilaiTransaksi)
          : formatRupiah(
              table
                .getFilteredRowModel()
                .rows.reduce(
                  (sum: number, row: any) =>
                    sum + (Number(row.getValue("nilai_transaksi")) || 0),
                  0,
                ),
            )}
      </div>
    ),
  },
  {
    accessorKey: "jns_kkp_prinsipal",
    header: () => <div className="text-center font-medium">Jenis SPM/SP2D</div>,
    cell: ({ row }: any) => (
      <div className="text-center">{row.getValue("jns_kkp_prinsipal")}</div>
    ),
  },
  {
    id: "program_akun",
    header: () => (
      <div className="text-center font-medium">Program/Kegiatan/Output/Akun</div>
    ),
    cell: ({ row }: any) => {
      const { kdprogram, kdgiat, kdoutput, kdakun } = row.original;
      return (
        <div className="text-center font-mono text-[10px]">
          {kdprogram || "XX"}.{kdgiat || "XXXX"}.{kdoutput || "XXX"}.{kdakun}
        </div>
      );
    },
  },
  {
    accessorKey: "nilai_transaksi_total",
    header: () => (
      <div className="text-center font-medium">Total Transaksi KKP (Rp)</div>
    ),
    cell: ({ row }: any) => (
      <div className="text-right font-mono tabular-nums pr-2">
        {formatRupiah(row.getValue("nilai_transaksi"))}
      </div>
    ),
    footer: ({ table }: any) => (
      <div className="text-right font-mono tabular-nums pr-2 font-bold text-black">
        {formatRupiah(
          totals
            ? totals.nilaiTransaksi
            : table
                .getFilteredRowModel()
                .rows.reduce(
                  (sum: number, row: any) =>
                    sum + (Number(row.getValue("nilai_transaksi")) || 0),
                  0,
                ),
        )}
      </div>
    ),
  },
];
