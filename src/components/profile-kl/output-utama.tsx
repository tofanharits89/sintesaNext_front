"use client";

import { useState, useEffect } from "react";
import { directBackendClient } from "@/lib/api/httpClient";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/animate-ui/components/radix/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Trash2, Loader2, Plus } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";

export interface OutputRow {
  id_output: number;
  idedit: number;
  namaoutput: string;
  catatan: string;
  tahun: string;
  pagu: string;
  realisasi: string;
  persen: string;
  username: string;
  createdAt: string;
}

interface FilterData {
  thang: string;
  periode: string;
  dept: string;
}

interface OutputProps {
  show: boolean;
  handleClose: () => void;
  data: FilterData;
  isi: OutputRow[];
  updateReload: () => void;
}

interface OutputForm {
  namaoutput: string;
  catatan: string;
  tahun1: string;
  pagu1: string;
  realisasi1: string;
  persen1: string;
  tahun2: string;
  pagu2: string;
  realisasi2: string;
  persen2: string;
  tahun3: string;
  pagu3: string;
  realisasi3: string;
  persen3: string;
  id_output: number | "";
  idedit1: number | "";
  idedit2: number | "";
  idedit3: number | "";
}

const emptyForm = (): OutputForm => ({
  namaoutput: "",
  catatan: "",
  tahun1: "",
  pagu1: "",
  realisasi1: "",
  persen1: "",
  tahun2: "",
  pagu2: "",
  realisasi2: "",
  persen2: "",
  tahun3: "",
  pagu3: "",
  realisasi3: "",
  persen3: "",
  id_output: "",
  idedit1: "",
  idedit2: "",
  idedit3: "",
});

function filterItem<T extends Record<string, unknown>>(
  arr: T[],
  idx: number,
  key: keyof T,
): string {
  return arr[idx]?.[key] != null ? String(arr[idx]![key]) : "";
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function OutputUtama({
  show,
  handleClose,
  data,
  isi,
  updateReload,
}: OutputProps) {
  const [loading, setLoading] = useState(false);
  const [updateInfo, setUpdateInfo] = useState("");
  const [formData, setFormData] = useState<OutputForm>(emptyForm);

  useEffect(() => {
    if (isi.length > 0 && isi[0]) {
      setUpdateInfo(
        `Diupdate terakhir oleh ${isi[0].username} tanggal ${formatDate(isi[0].createdAt)}`,
      );
    } else {
      setUpdateInfo("");
    }
  }, [isi]);

  const uniqueOutputs = isi.reduce<
    { id_output: number; namaoutput: string; catatan: string }[]
  >((acc, curr) => {
    if (!acc.find((x) => x.id_output === curr.id_output)) {
      acc.push({
        id_output: curr.id_output,
        namaoutput: curr.namaoutput,
        catatan: curr.catatan,
      });
    }
    return acc;
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await directBackendClient.post("/kinerja/output", { ...formData, data });
      setFormData(emptyForm());
      updateReload();
      handleClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleHapus = async (id_output: number) => {
    if (!confirm("Anda yakin ingin menghapus data ini?")) return;
    try {
      await directBackendClient.delete(`/kinerja/output/${id_output}`);
      updateReload();
      handleClose();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (id_output: number) => {
    const filtered = isi.filter(
      (r) => r.id_output === id_output,
    ) as unknown as Record<string, unknown>[];
    setFormData({
      namaoutput: filterItem(filtered, 0, "namaoutput"),
      catatan: filterItem(filtered, 0, "catatan"),
      tahun1: filterItem(filtered, 0, "tahun"),
      pagu1: filterItem(filtered, 0, "pagu"),
      realisasi1: filterItem(filtered, 0, "realisasi"),
      persen1: filterItem(filtered, 0, "persen"),
      tahun2: filterItem(filtered, 1, "tahun"),
      pagu2: filterItem(filtered, 1, "pagu"),
      realisasi2: filterItem(filtered, 1, "realisasi"),
      persen2: filterItem(filtered, 1, "persen"),
      tahun3: filterItem(filtered, 2, "tahun"),
      pagu3: filterItem(filtered, 2, "pagu"),
      realisasi3: filterItem(filtered, 2, "realisasi"),
      persen3: filterItem(filtered, 2, "persen"),
      id_output,
      idedit1: isi.filter((r) => r.id_output === id_output)[0]?.idedit ?? "",
      idedit2: isi.filter((r) => r.id_output === id_output)[1]?.idedit ?? "",
      idedit3: isi.filter((r) => r.id_output === id_output)[2]?.idedit ?? "",
    });
  };

  const yearGroups = [
    {
      label: "Tahun Anggaran 1",
      y: "tahun1" as const,
      p: "pagu1" as const,
      r: "realisasi1" as const,
      pct: "persen1" as const,
    },
    {
      label: "Tahun Anggaran 2",
      y: "tahun2" as const,
      p: "pagu2" as const,
      r: "realisasi2" as const,
      pct: "persen2" as const,
    },
    {
      label: "Tahun Anggaran 3",
      y: "tahun3" as const,
      p: "pagu3" as const,
      r: "realisasi3" as const,
      pct: "persen3" as const,
    },
  ];

  const columns: ColumnDef<any>[] = [
    {
      id: "no",
      header: () => <div className="text-center font-medium">No</div>,
      cell: ({ row }) => <div className="text-center">{row.index + 1}</div>,
    },
    {
      accessorKey: "namaoutput",
      header: () => <div className="text-center font-medium">Nama Output</div>,
      cell: ({ row }) => (
        <div className="text-left font-medium max-w-[300px] whitespace-normal break-words">
          {row.getValue("namaoutput")}
        </div>
      ),
    },
    {
      accessorKey: "catatan",
      header: () => <div className="text-center font-medium">Keterangan</div>,
      cell: ({ row }) => (
        <div className="text-left text-muted-foreground max-w-[300px] whitespace-normal break-words">
          {row.getValue("catatan")}
        </div>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-center font-medium">Aksi</div>,
      cell: ({ row }) => (
        <div className="flex items-center justify-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEdit(row.original.id_output)}
            className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleHapus(row.original.id_output)}
            className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Dialog open={show} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent showCloseButton={false} className="max-w-7xl sm:max-w-7xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Rekam Output Utama Belanja K/L</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6">
          <form
            id="output-utama-form"
            onSubmit={handleSubmit}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="namaoutput" className="text-sm font-semibold">
                  Nama Output
                </Label>
                <Textarea
                  id="namaoutput"
                  name="namaoutput"
                  rows={3}
                  value={formData.namaoutput}
                  onChange={handleChange}
                  placeholder="Masukkan nama output utama..."
                  className="resize-none"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="catatan" className="text-sm font-semibold">
                  Keterangan / Catatan
                </Label>
                <Textarea
                  id="catatan"
                  name="catatan"
                  rows={3}
                  value={formData.catatan}
                  onChange={handleChange}
                  placeholder="Masukkan keterangan tambahan..."
                  className="resize-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {yearGroups.map(({ label, y, p, r, pct }) => (
                <div
                  key={y}
                  className="space-y-4 rounded-xl border bg-muted/30 p-4"
                >
                  <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">
                    {label}
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor={y} className="text-[11px] font-medium uppercase text-muted-foreground">Tahun</Label>
                      <Input
                        id={y}
                        name={y}
                        type="text"
                        value={formData[y]}
                        onChange={handleChange}
                        placeholder="YYYY"
                        className="h-9 bg-background"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={p} className="text-[11px] font-medium uppercase text-muted-foreground">Pagu</Label>
                      <Input
                        id={p}
                        name={p}
                        type="text"
                        maxLength={5}
                        value={formData[p]}
                        onChange={handleChange}
                        placeholder="0.00"
                        className="h-9 bg-background"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={r} className="text-[11px] font-medium uppercase text-muted-foreground">Realisasi</Label>
                      <Input
                        id={r}
                        name={r}
                        type="text"
                        maxLength={5}
                        value={formData[r]}
                        onChange={handleChange}
                        placeholder="0.00"
                        className="h-9 bg-background"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={pct} className="text-[11px] font-medium uppercase text-muted-foreground">Persen (%)</Label>
                      <Input
                        id={pct}
                        name={pct}
                        type="text"
                        maxLength={6}
                        value={formData[pct]}
                        onChange={handleChange}
                        placeholder="0.00"
                        className="h-9 bg-background"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </form>

          <div className="my-10 border-t" />

          {/* Table */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Daftar Output Terdaftar
              </h3>
            </div>
            <DataTable 
              columns={columns} 
              data={uniqueOutputs} 
              initialPageSize={10}
              emptyMessage="Belum ada data output utama."
            />
          </div>

          {updateInfo && (
            <p className="mt-8 text-xs italic text-muted-foreground border-t pt-4">
              {updateInfo}
            </p>
          )}
        </div>

        <DialogFooter className="p-6 pt-4 gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
            className="px-6"
          >
            Batal
          </Button>
          <Button
            type="submit"
            form="output-utama-form"
            disabled={loading}
            className="px-8"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <span className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Simpan
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
