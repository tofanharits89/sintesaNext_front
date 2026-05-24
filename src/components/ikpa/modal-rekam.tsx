"use client";

import React, { useState, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { apiClient } from "@/lib/api/httpClient";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { FilePlus, Loader2, Save } from "lucide-react";
import satkerData from "@/data/carisatker.json";
import kppnData from "@/data/kdkppn.json";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { filterSatkerByUserAccess } from "@/utils/satker-rbac";
import { AxiosError } from "axios";

interface SatkerItem {
    kdsatker: string;
    nmsatker: string;
    kdkppn: string;
    kdkanwil: string;
    nmkanwil?: string;
    nmkppn?: string;
}

// Schema based on the SQL provided
const formSchema = z.object({
    thang: z.string().min(4).max(4),
    tg_nd: z.date({ error: "Tanggal ND wajib diisi" }),
    no_nd: z.string().min(1, "Nomor ND wajib diisi"),
    kdsatker: z.string().min(1, "Satker wajib dipilih"),
    nm_indikator: z.string().min(1, "Indikator wajib dipilih"),
    no_doc: z.string().min(1, "Nomor dokumen wajib diisi"),
    keterangan: z.string().optional(),
    kronologis: z.string().optional(),
    perbaikan: z.string().optional(),
    file: z.any().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ModalRekamProps {
    isOpen: boolean;
    onClose: () => void;
}

const INDIKATOR_OPTIONS = [
    { label: "Revisi DIPA", value: "Revisi DIPA", code: "01" },
    { label: "Deviasi Halaman III DIPA", value: "Deviasi Halaman III DIPA", code: "02" },
    { label: "Penyerapan Anggaran", value: "Penyerapan Anggaran", code: "03" },
    { label: "Belanja Kontraktual", value: "Belanja Kontraktual", code: "04" },
    { label: "Penyelesaian Tagihan", value: "Penyelesaian Tagihan", code: "05" },
    { label: "Pengelolaan UP dan TUP", value: "Pengelolaan UP dan TUP", code: "06" },
    { label: "Dispensasi SPM", value: "Dispensasi SPM", code: "07" },
    { label: "Capaian Output", value: "Capaian Output", code: "08" },
];

export function ModalRekamIkpa({ isOpen, onClose }: ModalRekamProps) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const filteredSatkerList = useMemo(() => {
        return filterSatkerByUserAccess(
            satkerData as SatkerItem[],
            user
        );
    }, [user]);

    const satkerOptions = useMemo(() => {
        return filteredSatkerList.map(s => ({
            value: s.kdsatker,
            label: `${s.kdsatker} - ${s.nmsatker}`
        }));
    }, [filteredSatkerList]);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            thang: new Date().getFullYear().toString(),
            tg_nd: new Date(),
            no_nd: "",
            kdsatker: "",
            nm_indikator: "",
            no_doc: "",
            keterangan: "",
            kronologis: "",
            perbaikan: "",
            file: undefined,
        },
    });

    const mutation = useMutation({
        mutationFn: (formData: FormData) => apiClient.post("/ikpa", formData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["ikpa-data"] });
            queryClient.invalidateQueries({ queryKey: ["ikpa-stats"] });
            toast.success("Data IKPA berhasil direkam");
            form.reset();
            onClose();
        },
        onError: (error: AxiosError<{ error: string }>) => {
            console.error("Error saving IKPA:", error);
            toast.error("Gagal merekam data IKPA: " + (error.response?.data?.error || error.message));
        },
        onSettled: () => {
            setIsSubmitting(false);
        }
    });

    async function onSubmit(values: FormValues) {
        setIsSubmitting(true);

        // Find satker details
        const satker = (satkerData as any[]).find(s => s.kdsatker === values.kdsatker);
        // Find KPPN details
        const kppn = (kppnData as any[]).find(k => k.kdkppn === satker?.kdkppn);
        // Find indicator code
        const indicator = INDIKATOR_OPTIONS.find(i => i.value === values.nm_indikator);

        const payload = {
            ...values,
            date_input: new Date().toISOString().split('T')[0],
            kdkanwil: satker?.kdkanwil || kppn?.kdkanwil || "",
            nmkanwil: kppn?.nmkanwil || "",
            kdkppn: satker?.kdkppn || "",
            nmkppn: kppn?.nmkppn || "",
            nmsatker: satker?.nmsatker || "",
            kd_indikator: indicator?.code || "",
            approval: "Pending",
            id_approval: "0"
        };

        const formData = new FormData();
        Object.entries(payload).forEach(([key, value]) => {
            if (value === undefined || value === null) return;

            if (key === 'file' && value instanceof File) {
                formData.append('file', value);
            } else if (value instanceof Date) {
                formData.append(key, value.toISOString().substring(0, 10));
            } else {
                formData.append(key, String(value));
            }
        });

        mutation.mutate(formData);
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent showCloseButton={false} className="max-w-7xl sm:max-w-7xl max-h-[90vh] flex flex-col p-0 gap-0">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle>Rekam Data IKPA</DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form id="ikpa-form" onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-y-auto grid gap-4 p-6 pt-2">
                        {/* First Row - Year, Date, ND Number */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="w-full space-y-2">
                                <Label htmlFor="thang">Tahun Anggaran</Label>
                                <Select
                                    value={form.watch("thang")}
                                    onValueChange={(value) => form.setValue("thang", value)}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Pilih Tahun" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="2026">2026</SelectItem>
                                        <SelectItem value="2025">2025</SelectItem>
                                        <SelectItem value="2024">2024</SelectItem>
                                        <SelectItem value="2023">2023</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="w-full space-y-2">
                                <Label htmlFor="tg_nd">Tanggal Nota Dinas</Label>
                                <DatePicker
                                    date={form.watch("tg_nd")}
                                    onDateChange={(date) => form.setValue("tg_nd", date || new Date())}
                                    placeholder="Pilih tanggal ND"
                                />
                            </div>

                            <div className="w-full space-y-2 lg:col-span-1">
                                <Label htmlFor="no_nd">Nomor Nota Dinas</Label>
                                <Input
                                    id="no_nd"
                                    value={form.watch("no_nd")}
                                    onChange={(e) => form.setValue("no_nd", e.target.value)}
                                    placeholder="Input nomor ND"
                                    className="w-full"
                                />
                            </div>
                        </div>

                        <div className="w-full space-y-2">
                            <Label htmlFor="kdsatker">Satuan Kerja</Label>
                            <SearchableSelect
                                options={satkerOptions}
                                value={form.watch("kdsatker")}
                                onValueChange={(value) => form.setValue("kdsatker", value)}
                                placeholder="Pilih Satker"
                                searchPlaceholder="Cari kode atau nama satker..."
                                emptyMessage="Satker tidak ditemukan."
                            />
                        </div>

                        {/* Second Row - Indikator, No Doc */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="w-full space-y-2">
                                <Label htmlFor="nm_indikator">Indikator IKPA</Label>
                                <Select
                                    value={form.watch("nm_indikator")}
                                    onValueChange={(value) => form.setValue("nm_indikator", value)}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Pilih Indikator" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {INDIKATOR_OPTIONS.map((opt) => (
                                            <SelectItem key={opt.code} value={opt.value}>
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="w-full space-y-2">
                                <Label htmlFor="no_doc">Nomor Dokumen</Label>
                                <Input
                                    id="no_doc"
                                    value={form.watch("no_doc")}
                                    onChange={(e) => form.setValue("no_doc", e.target.value)}
                                    placeholder="Input nomor dokumen"
                                    className="w-full"
                                />
                            </div>
                        </div>

                        {/* File Upload */}
                        <div className="w-full space-y-2">
                            <Label>File Nota Dinas (PDF)</Label>
                            <div className="w-full p-4 border-2 border-dashed rounded-lg bg-muted/20 flex flex-col items-center justify-center gap-2">
                                <Label htmlFor="file-upload" className="flex items-center gap-2 text-primary cursor-pointer hover:underline">
                                    <FilePlus className="h-5 w-5" />
                                    {form.watch("file") ? (form.watch("file") as File).name : "Upload PDF Nota Dinas / Dokumen (Maks 5MB)"}
                                </Label>
                                <Input
                                    id="file-upload"
                                    type="file"
                                    accept=".pdf"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            form.setValue("file", file);
                                        }
                                    }}
                                />
                                {form.watch("file") && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="text-destructive h-7 text-xs"
                                        onClick={() => form.setValue("file", undefined)}
                                    >
                                        Hapus File
                                    </Button>
                                )}
                                <p className="text-[10px] text-muted-foreground italic">* Format: PDF, Maksimal 5MB</p>
                            </div>
                        </div>

                        {/* Textareas */}
                        <div className="w-full space-y-4">
                            <div className="w-full space-y-2">
                                <Label htmlFor="keterangan">Keterangan</Label>
                                <Textarea
                                    id="keterangan"
                                    value={form.watch("keterangan") || ""}
                                    onChange={(e) => form.setValue("keterangan", e.target.value)}
                                    placeholder="Input keterangan tambahan"
                                    rows={3}
                                    className="w-full"
                                />
                            </div>

                            <div className="w-full space-y-2">
                                <Label htmlFor="kronologis">Kronologis</Label>
                                <Textarea
                                    id="kronologis"
                                    value={form.watch("kronologis") || ""}
                                    onChange={(e) => form.setValue("kronologis", e.target.value)}
                                    placeholder="Input kronologis kejadian"
                                    rows={3}
                                    className="w-full"
                                />
                            </div>

                            <div className="w-full space-y-2">
                                <Label htmlFor="perbaikan">Langkah Perbaikan</Label>
                                <Textarea
                                    id="perbaikan"
                                    value={form.watch("perbaikan") || ""}
                                    onChange={(e) => form.setValue("perbaikan", e.target.value)}
                                    placeholder="Input langkah perbaikan yang diambil"
                                    rows={3}
                                    className="w-full"
                                />
                            </div>
                        </div>
                    </form>
                </Form>

                <DialogFooter className="p-6 pt-4 gap-2 sm:gap-2">
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                            Tutup
                        </Button>
                        <Button onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting} className="bg-slate-800 hover:bg-slate-900">
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    Simpan
                                </>
                            )}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}