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

export const getRingkasanKanwilColumns = (handlers: ColumnHandlers) => [
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
      <div className="text-left max-w-[200px] truncate" title={row.getValue("namaLokasi")}>
        {row.getValue("namaLokasi")}
      </div>
    ),
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
      <div className="text-left max-w-[200px] truncate" title={row.getValue("namaSatker")}>
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

export const getRingkasanKppnColumns = (handlers: ColumnHandlers) => [
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
      <div className="text-left max-w-[150px] truncate" title={row.getValue("namaKppn")}>
        {row.getValue("namaKppn")}
      </div>
    ),
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
      <div className="text-left max-w-[200px] truncate" title={row.getValue("namaSatker")}>
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
      <div className="text-left max-w-[200px] truncate" title={row.getValue("nmlokasi")}>
        {row.getValue("nmlokasi")}
      </div>
    ),
    footer: () => <div className="text-right font-bold pr-4">GRAND TOTAL</div>,
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
      <div className="text-right font-mono tabular-nums pr-2 font-bold text-blue-600">
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
      <div className="text-left max-w-[200px] truncate" title={row.getValue("nmkppn")}>
        {row.getValue("nmkppn")}
      </div>
    ),
    footer: () => <div className="text-right font-bold pr-4">GRAND TOTAL</div>,
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
      <div className="text-right font-mono tabular-nums pr-2 font-bold text-blue-600">
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
