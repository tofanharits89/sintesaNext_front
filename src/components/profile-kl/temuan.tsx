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

export interface TemuanRow {
  id_temuan: number;
  id: number;
  idtemuan: number;
  iddetailtemuan: number;
  temuan: string;
  nilai: string;
  isu: string;
  username: string;
  createdAt: string;
}

interface FilterData {
  thang: string;
  periode: string;
  dept: string;
}

interface TemuanProps {
  show: boolean;
  handleClose: () => void;
  data: FilterData;
  isi: TemuanRow[];
  updateReload: () => void;
}

interface TemuanForm {
  temuan: string;
  nilai: string;
  input3: string;
  input4: string;
  input5: string;
  input6: string;
  idedit: number | "";
  idedit1: number | "";
  idedit2: number | "";
  idedit3: number | "";
  idedit4: number | "";
}

const emptyForm = (): TemuanForm => ({
  temuan: "",
  nilai: "",
  input3: "",
  input4: "",
  input5: "",
  input6: "",
  idedit: "",
  idedit1: "",
  idedit2: "",
  idedit3: "",
  idedit4: "",
});

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

function filterItem<T extends Record<string, unknown>>(
  arr: T[],
  idx: number,
  key: keyof T,
): string {
  return arr[idx]?.[key] != null ? String(arr[idx]![key]) : "";
}

export default function Temuan({
  show,
  handleClose,
  data,
  isi,
  updateReload,
}: TemuanProps) {
  const [loading, setLoading] = useState(false);
  const [updateInfo, setUpdateInfo] = useState("");
  const [formData, setFormData] = useState<TemuanForm>(emptyForm);

  useEffect(() => {
    if (isi.length > 0 && isi[0]) {
      setUpdateInfo(
        `Diupdate terakhir oleh ${isi[0].username} tanggal ${formatDate(isi[0].createdAt)}`,
      );
    } else {
      setUpdateInfo("");
    }
  }, [isi]);

  const uniqueTemuan = isi.reduce<
    {
      temuan: string;
      nilai: string;
      id_temuan: number;
      iddetailtemuan: number;
    }[]
  >((acc, curr) => {
    if (!acc.find((x) => x.id_temuan === curr.id_temuan)) {
      acc.push({
        temuan: curr.temuan,
        nilai: curr.nilai,
        id_temuan: curr.id_temuan,
        iddetailtemuan: curr.iddetailtemuan,
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
      await directBackendClient.post("/kinerja/temuan", { ...formData, data });
      setFormData(emptyForm());
      updateReload();
      handleClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleHapus = async (id: number) => {
    if (!confirm("Anda yakin ingin menghapus data ini?")) return;
    try {
      await directBackendClient.delete(`/kinerja/temuan/${id}`);
      updateReload();
      handleClose();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (id_temuan: number) => {
    const filtered = isi.filter((r) => r.id_temuan === id_temuan);
    setFormData({
      temuan: filterItem(
        filtered as unknown as Record<string, unknown>[],
        0,
        "temuan",
      ),
      nilai: filterItem(
        filtered as unknown as Record<string, unknown>[],
        0,
        "nilai",
      ),
      input3: filterItem(
        filtered as unknown as Record<string, unknown>[],
        0,
        "isu",
      ),
      input4: filterItem(
        filtered as unknown as Record<string, unknown>[],
        1,
        "isu",
      ),
      input5: filterItem(
        filtered as unknown as Record<string, unknown>[],
        2,
        "isu",
      ),
      input6: filterItem(
        filtered as unknown as Record<string, unknown>[],
        3,
        "isu",
      ),
      idedit: id_temuan,
      idedit1: filtered[0]?.iddetailtemuan ?? "",
      idedit2: filtered[1]?.iddetailtemuan ?? "",
      idedit3: filtered[2]?.iddetailtemuan ?? "",
      idedit4: filtered[3]?.iddetailtemuan ?? "",
    });
  };

  const columns: ColumnDef<any>[] = [
    {
      id: "no",
      header: () => <div className="text-center font-medium">No</div>,
      cell: ({ row }) => <div className="text-center">{row.index + 1}</div>,
    },
    {
      accessorKey: "temuan",
      header: () => <div className="text-center font-medium">Temuan BPK</div>,
      cell: ({ row }) => (
        <div className="text-left font-medium max-w-[400px] whitespace-normal break-words">
          {row.getValue("temuan")}
        </div>
      ),
    },
    {
      accessorKey: "nilai",
      header: () => <div className="text-center font-medium">Nilai</div>,
      cell: ({ row }) => (
        <div className="text-left text-muted-foreground max-w-[200px] whitespace-normal break-words">
          {row.getValue("nilai")}
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
            onClick={() => handleEdit(row.original.id_temuan)}
            className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleHapus(row.original.id_temuan)}
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
      <DialogContent showCloseButton={false} className="max-w-7xl sm:max-w-7xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Rekam Data Temuan BPK</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6">
          <form id="temuan-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
              {/* Temuan */}
              <div className="md:col-span-4 space-y-2">
                <Label htmlFor="temuan" className="text-sm font-semibold">
                  Temuan BPK
                </Label>
                <Textarea
                  id="temuan"
                  name="temuan"
                  rows={4}
                  placeholder="Deskripsikan temuan BPK..."
                  value={formData.temuan}
                  onChange={handleChange}
                  className="resize-none"
                />
              </div>

              {/* Nilai */}
              <div className="md:col-span-3 space-y-2">
                <Label htmlFor="nilai" className="text-sm font-semibold">
                  Nilai Temuan
                </Label>
                <Textarea
                  id="nilai"
                  name="nilai"
                  rows={4}
                  placeholder="Masukkan nilai temuan..."
                  value={formData.nilai}
                  onChange={handleChange}
                  className="resize-none"
                />
              </div>

              {/* Tindak Lanjut */}
              <div className="md:col-span-5 space-y-2">
                <Label className="text-sm font-semibold">
                  Tindak Lanjut Isu
                </Label>
                <div className="grid grid-cols-1 gap-2">
                  {(["input3", "input4", "input5", "input6"] as const).map(
                    (n, idx) => (
                      <Input
                        key={n}
                        name={n}
                        type="text"
                        placeholder={`Tindak Lanjut ${idx + 1}...`}
                        value={formData[n]}
                        onChange={handleChange}
                        className="bg-background"
                      />
                    ),
                  )}
                </div>
              </div>
            </div>
          </form>

          <div className="my-8 border-t" />

          {/* Table */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Daftar Temuan Terdaftar
              </h3>
            </div>
            <DataTable 
              columns={columns} 
              data={uniqueTemuan} 
              initialPageSize={10}
              emptyMessage="Belum ada data temuan."
            />
          </div>

          {updateInfo && (
            <p className="mt-6 text-xs italic text-muted-foreground border-t pt-4">
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
            form="temuan-form"
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
