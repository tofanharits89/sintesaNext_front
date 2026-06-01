"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { apiClient } from "@/lib/api/httpClient";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { DatePicker } from "@/components/ui/date-picker";
import { Loader2, Save, X, Edit, FilePlus } from "lucide-react";
import satkerData from "@/data/carisatker.json";
import kppnData from "@/data/kdkppn.json";
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
    tg_nd: z.string().min(1, "Tanggal ND wajib diisi"),
    no_nd: z.string().min(1, "Nomor ND wajib diisi"),
    kdsatker: z.string().min(1, "Satker wajib dipilih"),
    nm_indikator: z.string().min(1, "Indikator wajib dipilih"),
    no_doc: z.string().min(1, "Nomor dokumen wajib diisi"),
    keterangan: z.string().optional().nullable(),
    kronologis: z.string().optional().nullable(),
    perbaikan: z.string().optional().nullable(),
    approval: z.string().min(1, "Status wajib dipilih"),
    file: z.any().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ModalEditProps {
    isOpen: boolean;
    onClose: () => void;
    data: any | null;
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

const STATUS_OPTIONS = [
    { label: "Pending", value: "Pending" },
    { label: "Disetujui", value: "Disetujui" },
    { label: "Ditolak", value: "Ditolak" },
];

const normalizeIndikatorText = (value: string) =>
    value
        .toLowerCase()
        .replace(/\bup\s*\/\s*tup\b/g, "up dan tup")
        .replace(/\bup\s+tup\b/g, "up dan tup")
        .replace(/&/g, "dan")
        .replace(/[^a-z0-9]+/g, "");

const resolveIndikatorOption = (nmIndikator?: string | null) => {
    if (nmIndikator) {
        const directMatch = INDIKATOR_OPTIONS.find((opt) => opt.value === nmIndikator);
        if (directMatch) return directMatch;

        const normalizedIncoming = normalizeIndikatorText(nmIndikator);
        const normalizedMatch = INDIKATOR_OPTIONS.find((opt) => normalizeIndikatorText(opt.value) === normalizedIncoming);
        if (normalizedMatch) return normalizedMatch;
    }

    return undefined;
};

export function ModalEditIkpa({ isOpen, onClose, data }: ModalEditProps) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const filteredSatkerList = useMemo(() => {
        return filterSatkerByUserAccess(
            satkerData as SatkerItem[],
            user
        );
    }, [user]);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            thang: "",
            tg_nd: "",
            no_nd: "",
            kdsatker: "",
            nm_indikator: "",
            no_doc: "",
            keterangan: "",
            kronologis: "",
            perbaikan: "",
            approval: "Pending",
            file: undefined,
        },
    });

    const watchedKdSatker = form.watch("kdsatker");

    const satkerOptions = useMemo(() => {
        let subset = [...filteredSatkerList];
        if (watchedKdSatker) {
            const exists = subset.find(s => s.kdsatker === watchedKdSatker);
            if (!exists) {
                const missing = (satkerData as any[]).find(s => s.kdsatker === watchedKdSatker);
                if (missing) subset = [missing, ...subset];
            }
        }
        return subset.map(s => ({
            value: s.kdsatker,
            label: `${s.kdsatker} - ${s.nmsatker}`
        }));
    }, [filteredSatkerList, watchedKdSatker]);

    // Update form values when data changes
    useEffect(() => {
        if (data && isOpen) {
            let parsedApproval = "Pending";
            if (data.approval) {
                const lower = data.approval.toLowerCase();
                if (lower.includes("disetujui") || lower.includes("setuju")) parsedApproval = "Disetujui";
                else if (lower.includes("ditolak") || lower.includes("tolak")) parsedApproval = "Ditolak";
            }

            form.reset({
                thang: data.thang || "",
                tg_nd: (data.tg_nd ? new Date(data.tg_nd).toISOString().split('T')[0] : "") as string,
                no_nd: data.no_nd || "",
                kdsatker: data.kdsatker || "",
                nm_indikator: resolveIndikatorOption(data.nm_indikator)?.value || data.nm_indikator || "",
                no_doc: data.no_doc || "",
                keterangan: data.keterangan || "",
                kronologis: data.kronologis || "",
                perbaikan: data.perbaikan || "",
                approval: parsedApproval,
                file: undefined,
            });
        }
    }, [data, isOpen, form]);

    const mutation = useMutation({
        mutationFn: (formData: FormData) => apiClient.put(`/ikpa/${data?.id}`, formData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["ikpa-data"] });
            queryClient.invalidateQueries({ queryKey: ["ikpa-stats"] });
            toast.success("Data IKPA berhasil diperbarui");
            onClose();
        },
        onError: (error: AxiosError<{ error: string }>) => {
            console.error("Error updating IKPA:", error);
            toast.error("Gagal memperbarui data IKPA: " + (error.response?.data?.error || error.message));
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
        const indicator = resolveIndikatorOption(values.nm_indikator);

        const payload = {
            ...values,
            kdkanwil: satker?.kdkanwil || kppn?.kdkanwil || "",
            nmkanwil: kppn?.nmkanwil || "",
            kdkppn: satker?.kdkppn || "",
            nmkppn: kppn?.nmkppn || "",
            nmsatker: satker?.nmsatker || "",
            kd_indikator: indicator?.code || "",
            id_approval: values.approval === "Disetujui" ? "1" : values.approval === "Ditolak" ? "2" : "0"
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
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent showCloseButton={false} className="max-w-7xl sm:max-w-7xl max-h-[90vh] flex flex-col p-0 gap-0">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <Edit className="h-5 w-5 text-primary" />
                        Edit Data IKPA
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="contents">
                        <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Tahun Anggaran */}
                                <FormField
                                    control={form.control}
                                    name="thang"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Tahun Anggaran</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Pilih Tahun" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="2026">2026</SelectItem>
                                                    <SelectItem value="2025">2025</SelectItem>
                                                    <SelectItem value="2024">2024</SelectItem>
                                                    <SelectItem value="2023">2023</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Tanggal ND */}
                                <FormField
                                    control={form.control}
                                    name="tg_nd"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Tanggal Nota Dinas</FormLabel>
                                            <FormControl>
                                                <DatePicker
                                                    date={field.value ? new Date(field.value) : undefined}
                                                    onDateChange={(date) => {
                                                        if (date) {
                                                            const yyyy = date.getFullYear();
                                                            const mm = String(date.getMonth() + 1).padStart(2, "0");
                                                            const dd = String(date.getDate()).padStart(2, "0");
                                                            field.onChange(`${yyyy}-${mm}-${dd}`);
                                                        } else {
                                                            field.onChange("");
                                                        }
                                                    }}
                                                    placeholder="Pilih tanggal ND"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Nomor ND */}
                                <FormField
                                    control={form.control}
                                    name="no_nd"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nomor Nota Dinas</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Input nomor ND..." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Satker */}
                                <FormField
                                    control={form.control}
                                    name="kdsatker"
                                    render={({ field }) => (
                                        <FormItem className="md:col-span-2">
                                            <FormLabel>Satuan Kerja</FormLabel>
                                            <FormControl>
                                                <SearchableSelect
                                                    options={satkerOptions}
                                                    value={field.value}
                                                    onValueChange={field.onChange}
                                                    placeholder="Pilih Satker"
                                                    searchPlaceholder="Cari kode atau nama satker..."
                                                    emptyMessage="Satker tidak ditemukan."
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* No Doc */}
                                <FormField
                                    control={form.control}
                                    name="no_doc"
                                    render={({ field }) => (
                                        <FormItem className="md:col-span-1">
                                            <FormLabel>Nomor Dokumen</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Input nomor dokumen..." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Indikator */}
                                <FormField
                                    control={form.control}
                                    name="nm_indikator"
                                    render={({ field }) => (
                                        <FormItem className="md:col-span-2">
                                            <FormLabel>Indikator IKPA</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Pilih Indikator" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {INDIKATOR_OPTIONS.map((opt) => (
                                                        <SelectItem key={opt.code} value={opt.value}>
                                                            {opt.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Approval Status */}
                                <FormField
                                    control={form.control}
                                    name="approval"
                                    render={({ field }) => (
                                        <FormItem className="md:col-span-1">
                                            <FormLabel>Status Approval</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Pilih Status" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {STATUS_OPTIONS.map((opt) => (
                                                        <SelectItem key={opt.value} value={opt.value}>
                                                            {opt.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="md:col-span-3 p-4 border-2 border-dashed rounded-lg bg-muted/20 flex flex-col items-center justify-center gap-2">
                                    <FormLabel className="flex items-center gap-2 text-primary cursor-pointer hover:underline" htmlFor="file-upload-edit">
                                        <FilePlus className="h-5 w-5" />
                                        {form.watch("file") ? (form.watch("file") as File).name : data?.file ? `Ganti File (${data.file})` : "Upload PDF Nota Dinas / Dokumen (Maks 5MB)"}
                                    </FormLabel>
                                    <Input
                                        id="file-upload-edit"
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
                                            className="text-destructive h-7 text-[10px]"
                                            onClick={() => form.setValue("file", undefined)}
                                        >
                                            Batal Ganti
                                        </Button>
                                    )}
                                    <p className="text-[10px] text-muted-foreground italic">* Format: PDF, Maksimal 5MB</p>
                                </div>
                            </div>

                            {/* Textareas */}
                            <div className="space-y-4 pt-2 border-t">
                                <FormField
                                    control={form.control}
                                    name="keterangan"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Keterangan</FormLabel>
                                            <FormControl>
                                                <Textarea placeholder="Input keterangan tambahan..." className="min-h-[80px]" {...field} value={field.value || ""} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="kronologis"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Kronologis</FormLabel>
                                            <FormControl>
                                                <Textarea placeholder="Input kronologis kejadian..." className="min-h-[80px]" {...field} value={field.value || ""} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="perbaikan"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Langkah Perbaikan</FormLabel>
                                            <FormControl>
                                                <Textarea placeholder="Input langkah perbaikan yang diambil..." className="min-h-[80px]" {...field} value={field.value || ""} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <DialogFooter className="p-6 pt-4 gap-2 sm:gap-2">
                            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                                <X className="h-4 w-4 mr-2" />
                                Batal
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4 mr-2" />
                                )}
                                Simpan Perubahan
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}