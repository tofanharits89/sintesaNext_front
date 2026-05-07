import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { RingkasanData, MonitoringKanwilData, MonitoringKppnData } from "./types";

export const formatRupiah = (value: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatPercent = (value: number) => `${value.toFixed(1)}%`;

export const formatDate = (dateString: string | null) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

interface ColumnHandlers {
  onViewSatkerDetail: (kdsatker: string, namaSatker: string) => void;
  onViewKartu: (kdsatker: string, namaSatker: string) => void;
  onViewTagihan: (kdsatker: string, namaSatker: string) => void;
  onViewTransaksi: (kdsatker: string, namaSatker: string) => void;
  onViewKendala: (item: RingkasanData) => void;
  onViewRingkasan: (item: any) => void;
}

export const getRingkasanKanwilColumns = (handlers: ColumnHandlers, totals?: any) => [
  {
    id: "no",
    header: () => <div className="text-center font-medium">No</div>,
    cell: ({ row }: any) => <div className="text-center">{row.index + 1}</div>,
  },
  {
    accessorKey: "kodeKanwil",
    header: () => <div className="text-center font-medium">Kode Kanwil</div>,
    cell: ({ row }: any) => <div className="text-center">{row.getValue("kodeKanwil")}</div>,
  },
  {
    accessorKey: "namaLokasi",
    header: () => <div className="text-center font-medium">Nama Kanwil</div>,
    cell: ({ row }: any) => (
      <div className="text-center" title={row.getValue("namaLokasi")}>
        {row.getValue("namaLokasi")}
      </div>
    ),
    footer: () => <div className="text-center font-bold">GRAND TOTAL</div>,
  },
  {
    accessorKey: "kodeBA",
    header: () => <div className="text-center font-medium">Kode BA</div>,
    cell: ({ row }: any) => <div className="text-center">{row.getValue("kodeBA")}</div>,
  },
  {
    accessorKey: "kodeSatker",
    header: () => <div className="text-center font-medium">Kode Satker</div>,
    cell: ({ row }: any) => (
      <div
        className="text-center cursor-pointer text-blue-600 hover:underline font-medium"
        onClick={() => handlers.onViewSatkerDetail(row.original.kodeSatker, row.original.namaSatker)}
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
      <div className="text-left" title={row.getValue("namaSatker")}>
        {row.getValue("namaSatker")}
      </div>
    ),
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
        {totals ? formatRupiah(totals.upKkpPerBulan) : formatRupiah(table.getFilteredRowModel().rows.reduce((sum: number, row: any) => sum + (Number(row.getValue("upKkpPerBulan")) || 0), 0))}
      </div>
    ),
  },
  {
    accessorKey: "porsiUpKkp",
    header: () => <div className="text-center font-medium">Porsi UP KKP dari Total UP</div>,
    cell: ({ row }: any) => <div className="text-center">{formatPercent(row.getValue("porsiUpKkp"))}</div>,
  },
  {
    accessorKey: "bankPenerbit",
    header: () => <div className="text-center font-medium">Bank Penerbit KKP</div>,
    cell: ({ row }: any) => <div className="text-center">{row.getValue("bankPenerbit")}</div>,
  },
  {
    accessorKey: "jumlahKartu",
    header: () => <div className="text-center font-medium">Jumlah Kartu</div>,
    cell: ({ row }: any) => (
      <div
        className="text-center cursor-pointer text-blue-600 hover:underline"
        onClick={() => handlers.onViewKartu(row.original.kodeSatker, row.original.namaSatker)}
        title="Lihat detail kartu"
      >
        {row.getValue("jumlahKartu")}
      </div>
    ),
    footer: ({ table }: any) => (
      <div className="text-center font-bold">
        {totals ? totals.jumlahKartu : table.getFilteredRowModel().rows.reduce((sum: number, row: any) => sum + (Number(row.getValue("jumlahKartu")) || 0), 0)}
      </div>
    ),
  },
  {
    accessorKey: "nilaiTagihan",
    header: () => <div className="text-center font-medium">Nilai Tagihan (Rp)</div>,
    cell: ({ row }: any) => (
      <div
        className="text-right font-mono tabular-nums pr-2 cursor-pointer text-blue-600 hover:underline"
        onClick={() => handlers.onViewTagihan(row.original.kodeSatker, row.original.namaSatker)}
        title="Lihat detail tagihan"
      >
        {formatRupiah(row.getValue("nilaiTagihan"))}
      </div>
    ),
    footer: ({ table }: any) => (
      <div className="text-right font-mono tabular-nums pr-2 font-bold text-black">
        {totals ? formatRupiah(totals.nilaiTagihan) : formatRupiah(table.getFilteredRowModel().rows.reduce((sum: number, row: any) => sum + (Number(row.getValue("nilaiTagihan")) || 0), 0))}
      </div>
    ),
  },
  {
    accessorKey: "nilaiTransaksi",
    header: () => <div className="text-center font-medium">Nilai Transaksi KKP (Rp)</div>,
    cell: ({ row }: any) => (
      <div
        className="text-right font-mono tabular-nums pr-2 cursor-pointer text-blue-600 hover:underline"
        onClick={() => handlers.onViewTransaksi(row.original.kodeSatker, row.original.namaSatker)}
        title="Lihat detail transaksi"
      >
        {formatRupiah(row.getValue("nilaiTransaksi"))}
      </div>
    ),
    footer: ({ table }: any) => (
      <div className="text-right font-mono tabular-nums pr-2 font-bold text-black">
        {totals ? formatRupiah(totals.nilaiTransaksi) : formatRupiah(table.getFilteredRowModel().rows.reduce((sum: number, row: any) => sum + (Number(row.getValue("nilaiTransaksi")) || 0), 0))}
      </div>
    ),
  },
  {
    id: "actions",
    header: () => <div className="text-center font-medium">Kendala dan Hambatan</div>,
    cell: ({ row }: any) => (
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0 cursor-pointer"
          onClick={() => handlers.onViewKendala(row.original)}
          title="Lihat Kendala/Hambatan"
        >
          <Eye className="h-4 w-4 text-amber-600" />
        </Button>
      </div>
    ),
  },
];

export const getRingkasanKppnColumns = (handlers: ColumnHandlers, totals?: any) => [
  {
    id: "no",
    header: () => <div className="text-center font-medium">No</div>,
    cell: ({ row }: any) => <div className="text-center">{row.index + 1}</div>,
  },
  {
    accessorKey: "kodeKppn",
    header: () => <div className="text-center font-medium">Kode KPPN</div>,
    cell: ({ row }: any) => <div className="text-center">{row.getValue("kodeKppn")}</div>,
  },
  {
    accessorKey: "namaKppn",
    header: () => <div className="text-center font-medium">Nama KPPN</div>,
    cell: ({ row }: any) => (
      <div className="text-center" title={row.getValue("namaKppn")}>
        {row.getValue("namaKppn")}
      </div>
    ),
    footer: () => <div className="text-center font-bold">GRAND TOTAL</div>,
  },
  {
    accessorKey: "kodeBA",
    header: () => <div className="text-center font-medium">Kode BA</div>,
    cell: ({ row }: any) => <div className="text-center">{row.getValue("kodeBA")}</div>,
  },
  {
    accessorKey: "kodeSatker",
    header: () => <div className="text-center font-medium">Kode Satker</div>,
    cell: ({ row }: any) => (
      <div
        className="text-center cursor-pointer text-blue-600 hover:underline font-medium"
        onClick={() => handlers.onViewSatkerDetail(row.original.kodeSatker, row.original.namaSatker)}
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
      <div className="text-left" title={row.getValue("namaSatker")}>
        {row.getValue("namaSatker")}
      </div>
    ),
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
        {totals ? formatRupiah(totals.upKkpPerBulan) : formatRupiah(table.getFilteredRowModel().rows.reduce((sum: number, row: any) => sum + (Number(row.getValue("upKkpPerBulan")) || 0), 0))}
      </div>
    ),
  },
  {
    accessorKey: "porsiUpKkp",
    header: () => <div className="text-center font-medium">Porsi UP KKP dari Total UP</div>,
    cell: ({ row }: any) => <div className="text-center">{formatPercent(row.getValue("porsiUpKkp"))}</div>,
  },
  {
    accessorKey: "bankPenerbit",
    header: () => <div className="text-center font-medium">Bank Penerbit KKP</div>,
    cell: ({ row }: any) => <div className="text-center">{row.getValue("bankPenerbit")}</div>,
  },
  {
    accessorKey: "jumlahKartu",
    header: () => <div className="text-center font-medium">Jumlah Kartu</div>,
    cell: ({ row }: any) => (
      <div
        className="text-center cursor-pointer text-blue-600 hover:underline"
        onClick={() => handlers.onViewKartu(row.original.kodeSatker, row.original.namaSatker)}
        title="Lihat detail kartu"
      >
        {row.getValue("jumlahKartu")}
      </div>
    ),
    footer: ({ table }: any) => (
      <div className="text-center font-bold">
        {totals ? totals.jumlahKartu : table.getFilteredRowModel().rows.reduce((sum: number, row: any) => sum + (Number(row.getValue("jumlahKartu")) || Number(row.original.jumlahKartu) || 0), 0)}
      </div>
    ),
  },
  {
    accessorKey: "nilaiTagihan",
    header: () => <div className="text-center font-medium">Nilai Tagihan (Rp)</div>,
    cell: ({ row }: any) => (
      <div
        className="text-right font-mono tabular-nums pr-2 cursor-pointer text-blue-600 hover:underline"
        onClick={() => handlers.onViewTagihan(row.original.kodeSatker, row.original.namaSatker)}
        title="Lihat detail tagihan"
      >
        {formatRupiah(row.getValue("nilaiTagihan"))}
      </div>
    ),
    footer: ({ table }: any) => (
      <div className="text-right font-mono tabular-nums pr-2 font-bold text-black">
        {totals ? formatRupiah(totals.nilaiTagihan) : formatRupiah(table.getFilteredRowModel().rows.reduce((sum: number, row: any) => sum + (Number(row.getValue("nilaiTagihan")) || 0), 0))}
      </div>
    ),
  },
  {
    accessorKey: "nilaiTransaksi",
    header: () => <div className="text-center font-medium">Nilai Transaksi KKP (Rp)</div>,
    cell: ({ row }: any) => (
      <div
        className="text-right font-mono tabular-nums pr-2 cursor-pointer text-blue-600 hover:underline"
        onClick={() => handlers.onViewTransaksi(row.original.kodeSatker, row.original.namaSatker)}
        title="Lihat detail transaksi"
      >
        {formatRupiah(row.getValue("nilaiTransaksi"))}
      </div>
    ),
    footer: ({ table }: any) => (
      <div className="text-right font-mono tabular-nums pr-2 font-bold text-black">
        {totals ? formatRupiah(totals.nilaiTransaksi) : formatRupiah(table.getFilteredRowModel().rows.reduce((sum: number, row: any) => sum + (Number(row.getValue("nilaiTransaksi")) || 0), 0))}
      </div>
    ),
  },
  {
    id: "actions",
    header: () => <div className="text-center font-medium">Kendala dan Hambatan</div>,
    cell: ({ row }: any) => (
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0 cursor-pointer"
          onClick={() => handlers.onViewKendala(row.original)}
          title="Lihat Kendala/Hambatan"
        >
          <Eye className="h-4 w-4 text-amber-600" />
        </Button>
      </div>
    ),
  },
];

export const getMonitoringKanwilColumns = (handlers: ColumnHandlers) => [
  {
    id: "no",
    header: () => <div className="text-center font-medium">No</div>,
    cell: ({ row }: any) => <div className="text-center">{row.index + 1}</div>,
  },
  {
    accessorKey: "kdkanwil",
    header: () => <div className="text-center font-medium">Kode Kanwil</div>,
    cell: ({ row }: any) => <div className="text-center">{row.getValue("kdkanwil")}</div>,
  },
  {
    accessorKey: "nmlokasi",
    header: () => <div className="text-center font-medium">Nama Kanwil</div>,
    cell: ({ row }: any) => (
      <div className="text-center" title={row.getValue("nmlokasi")}>
        {row.getValue("nmlokasi")}
      </div>
    ),
    footer: () => <div className="text-center font-bold">GRAND TOTAL</div>,
  },
  {
    accessorKey: "jumlah_kppn",
    header: () => <div className="text-center font-medium">Jumlah KPPN</div>,
    cell: ({ row }: any) => <div className="text-center">{row.getValue("jumlah_kppn")}</div>,
    footer: ({ table }: any) => (
      <div className="text-center font-bold">
        {table.getFilteredRowModel().rows.reduce((sum: number, row: any) => sum + (Number(row.getValue("jumlah_kppn")) || 0), 0)}
      </div>
    ),
  },
  {
    accessorKey: "jumlah_satker_up_kkp",
    header: () => <div className="text-center font-medium">Total Satker UP KKP</div>,
    cell: ({ row }: any) => <div className="text-center">{row.getValue("jumlah_satker_up_kkp")}</div>,
    footer: ({ table }: any) => (
      <div className="text-center font-bold">
        {table.getFilteredRowModel().rows.reduce((sum: number, row: any) => sum + (Number(row.getValue("jumlah_satker_up_kkp")) || 0), 0)}
      </div>
    ),
  },
  {
    accessorKey: "jumlah_satker_transaksi",
    header: () => <div className="text-center font-medium">Satker (Transaksi)</div>,
    cell: ({ row }: any) => <div className="text-center">{row.getValue("jumlah_satker_transaksi")}</div>,
    footer: ({ table }: any) => (
      <div className="text-center font-bold">
        {table.getFilteredRowModel().rows.reduce((sum: number, row: any) => sum + (Number(row.getValue("jumlah_satker_transaksi")) || 0), 0)}
      </div>
    ),
  },
  {
    accessorKey: "nilai_transaksi",
    header: () => <div className="text-center font-medium">Total Nilai Transaksi</div>,
    cell: ({ row }: any) => (
      <div className="text-right font-mono tabular-nums pr-2">
        {formatRupiah(row.getValue("nilai_transaksi"))}
      </div>
    ),
    footer: ({ table }: any) => (
      <div className="text-right font-mono tabular-nums pr-2 font-bold text-black">
        {formatRupiah(table.getFilteredRowModel().rows.reduce((sum: number, row: any) => sum + (Number(row.getValue("nilai_transaksi")) || 0), 0))}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: () => <div className="text-center font-medium">Status</div>,
    cell: ({ row }: any) => {
      const status = row.getValue("status");
      return (
        <div className="flex justify-center">
          <Badge variant={status === "sent" ? "success" : "destructive"}>
            {status === "sent" ? "Sudah Kirim" : "Belum Kirim"}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "tanggalKirim",
    header: () => <div className="text-center font-medium">Tanggal Kirim Laporan</div>,
    cell: ({ row }: any) => <div className="text-center">{formatDate(row.getValue("tanggalKirim"))}</div>,
  },
  {
    id: "actions",
    header: () => <div className="text-center font-medium">Ringkasan Laporan</div>,
    cell: ({ row }: any) => (
      <div className="flex items-center justify-center">
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0 cursor-pointer"
          onClick={() => handlers.onViewRingkasan(row.original)}
          title="Lihat Ringkasan Laporan"
          disabled={row.original.status !== "sent"}
        >
          <Eye className="h-4 w-4 text-amber-600" />
        </Button>
      </div>
    ),
  },
];

export const getMonitoringKppnColumns = (handlers: ColumnHandlers) => [
  {
    id: "no",
    header: () => <div className="text-center font-medium">No</div>,
    cell: ({ row }: any) => <div className="text-center">{row.index + 1}</div>,
  },
  {
    accessorKey: "kdkppn",
    header: () => <div className="text-center font-medium">Kode KPPN</div>,
    cell: ({ row }: any) => <div className="text-center">{row.getValue("kdkppn")}</div>,
  },
  {
    accessorKey: "nmkppn",
    header: () => <div className="text-center font-medium">Nama KPPN</div>,
    cell: ({ row }: any) => (
      <div className="text-center" title={row.getValue("nmkppn")}>
        {row.getValue("nmkppn")}
      </div>
    ),
    footer: () => <div className="text-center font-bold">GRAND TOTAL</div>,
  },
  {
    accessorKey: "jumlah_satker_up_kkp",
    header: () => <div className="text-center font-medium">Jumlah Satker with UP KKP</div>,
    cell: ({ row }: any) => <div className="text-center">{row.getValue("jumlah_satker_up_kkp")}</div>,
    footer: ({ table }: any) => (
      <div className="text-center font-bold">
        {table.getFilteredRowModel().rows.reduce((sum: number, row: any) => sum + (Number(row.getValue("jumlah_satker_up_kkp")) || 0), 0)}
      </div>
    ),
  },
  {
    accessorKey: "jumlah_satker_transaksi",
    header: () => <div className="text-center font-medium">Jumlah Satker (Transaksi)</div>,
    cell: ({ row }: any) => <div className="text-center">{row.getValue("jumlah_satker_transaksi")}</div>,
    footer: ({ table }: any) => (
      <div className="text-center font-bold">
        {table.getFilteredRowModel().rows.reduce((sum: number, row: any) => sum + (Number(row.getValue("jumlah_satker_transaksi")) || 0), 0)}
      </div>
    ),
  },
  {
    accessorKey: "nilai_transaksi",
    header: () => <div className="text-center font-medium">Nilai Transaksi</div>,
    cell: ({ row }: any) => (
      <div className="text-right font-mono tabular-nums pr-2">
        {formatRupiah(row.getValue("nilai_transaksi"))}
      </div>
    ),
    footer: ({ table }: any) => (
      <div className="text-right font-mono tabular-nums pr-2 font-bold text-black">
        {formatRupiah(table.getFilteredRowModel().rows.reduce((sum: number, row: any) => sum + (Number(row.getValue("nilai_transaksi")) || 0), 0))}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: () => <div className="text-center font-medium">Status</div>,
    cell: ({ row }: any) => {
      const status = row.getValue("status");
      return (
        <div className="flex justify-center">
          <Badge variant={status === "sent" ? "success" : "destructive"}>
            {status === "sent" ? "Sudah Kirim" : "Belum Kirim"}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "tanggalKirim",
    header: () => <div className="text-center font-medium">Tanggal Kirim Laporan</div>,
    cell: ({ row }: any) => <div className="text-center">{formatDate(row.getValue("tanggalKirim"))}</div>,
  },
  {
    id: "actions",
    header: () => <div className="text-center font-medium">Ringkasan Laporan</div>,
    cell: ({ row }: any) => (
      <div className="flex items-center justify-center">
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0 cursor-pointer"
          onClick={() => handlers.onViewRingkasan(row.original)}
          title="Lihat Ringkasan Laporan"
          disabled={row.original.status !== "sent"}
        >
          <Eye className="h-4 w-4 text-amber-600" />
        </Button>
      </div>
    ),
  },
];

export const getTransaksiColumns = (totals?: any) => [
  {
    id: "no",
    header: () => <div className="text-center font-medium">No</div>,
    cell: ({ row }: any) => <div className="text-center">{row.index + 1}</div>,
  },
  {
    accessorKey: "nmlokasi",
    header: () => <div className="text-center font-medium">Nama Kanwil</div>,
    cell: ({ row }: any) => (
      <div className="text-center" title={row.getValue("nmlokasi")}>
        {row.getValue("nmlokasi")}
      </div>
    ),
  },
  {
    accessorKey: "nmkppn",
    header: () => <div className="text-center font-medium">Nama KPPN</div>,
    cell: ({ row }: any) => (
      <div className="text-center" title={row.getValue("nmkppn")}>
        {row.getValue("nmkppn")}
      </div>
    ),
  },
  {
    accessorKey: "kdsatker",
    header: () => <div className="text-center font-medium">Kode Satker</div>,
    cell: ({ row }: any) => <div className="text-center font-mono">{row.getValue("kdsatker")}</div>,
  },
  {
    accessorKey: "nmsatker",
    header: () => <div className="text-center font-medium">Nama Satker</div>,
    cell: ({ row }: any) => (
      <div className="text-left" title={row.getValue("nmsatker")}>
        {row.getValue("nmsatker")}
      </div>
    ),
    footer: () => <div className="text-center font-bold">GRAND TOTAL</div>,
  },
  {
    accessorKey: "tg_bast",
    header: () => <div className="text-center font-medium">Tanggal BAST</div>,
    cell: ({ row }: any) => <div className="text-center">{formatDate(row.getValue("tg_bast"))}</div>,
  },
  {
    accessorKey: "no_bast",
    header: () => <div className="text-center font-medium">Nomor BAST</div>,
    cell: ({ row }: any) => <div className="text-center">{row.getValue("no_bast") || "-"}</div>,
  },
  {
    accessorKey: "tg_spm",
    header: () => <div className="text-center font-medium">Tanggal SPM</div>,
    cell: ({ row }: any) => <div className="text-center">{formatDate(row.getValue("tg_spm"))}</div>,
  },
  {
    accessorKey: "no_spm",
    header: () => <div className="text-center font-medium">Nomor SPM</div>,
    cell: ({ row }: any) => <div className="text-center">{row.getValue("no_spm") || "-"}</div>,
  },
  {
    accessorKey: "tg_sp2d",
    header: () => <div className="text-center font-medium">Tanggal SP2D</div>,
    cell: ({ row }: any) => <div className="text-center">{formatDate(row.getValue("tg_sp2d"))}</div>,
  },
  {
    accessorKey: "no_sp2d",
    header: () => <div className="text-center font-medium">Nomor SP2D</div>,
    cell: ({ row }: any) => <div className="text-center font-mono">{row.getValue("no_sp2d")}</div>,
  },
  {
    accessorKey: "nilai_transaksi",
    header: () => <div className="text-center font-medium">Nilai Transaksi KKP (Rp)</div>,
    cell: ({ row }: any) => (
      <div className="text-right font-mono tabular-nums pr-2">
        {formatRupiah(row.getValue("nilai_transaksi"))}
      </div>
    ),
    footer: ({ table }: any) => (
      <div className="text-right font-mono tabular-nums pr-2 font-bold text-black">
        {totals ? formatRupiah(totals.nilaiTransaksi) : formatRupiah(table.getFilteredRowModel().rows.reduce((sum: number, row: any) => sum + (Number(row.getValue("nilai_transaksi")) || 0), 0))}
      </div>
    ),
  },
  {
    accessorKey: "jns_kkp_prinsipal",
    header: () => <div className="text-center font-medium">Jenis SPM/SP2D</div>,
    cell: ({ row }: any) => <div className="text-center">{row.getValue("jns_kkp_prinsipal")}</div>,
  },
  {
    id: "program_akun",
    header: () => <div className="text-center font-medium">Program/Kegiatan/Output/Akun</div>,
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
    header: () => <div className="text-center font-medium">Total Transaksi KKP (Rp)</div>,
    cell: ({ row }: any) => (
      <div className="text-right font-mono tabular-nums pr-2">
        {formatRupiah(row.getValue("nilai_transaksi"))}
      </div>
    ),
    footer: ({ table }: any) => (
      <div className="text-right font-mono tabular-nums pr-2 font-bold text-black">
        {totals ? formatRupiah(totals.nilaiTransaksi) : formatRupiah(table.getFilteredRowModel().rows.reduce((sum: number, row: any) => sum + (Number(row.getValue("nilai_transaksi")) || 0), 0))}
      </div>
    ),
  },
];
