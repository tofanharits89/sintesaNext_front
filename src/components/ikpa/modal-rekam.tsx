"use client";

import React, { useState, useEffect } from "react";
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
import { Loader2, Save, X } from "lucide-react";
import satkerData from "@/data/carisatker.json";

// Schema based on the SQL provided
const formSchema = z.object({
    thang: z.string().min(4).max(4),
    tg_nd: z.string().min(1, "Tanggal ND wajib diisi"),
    no_nd: z.string().min(1, "Nomor ND wajib diisi"),
    kdsatker: z.string().min(1, "Satker wajib dipilih"),
    nm_indikator: z.string().min(1, "Indikator wajib dipilih"),
    no_doc: z.string().min(1, "Nomor dokumen wajib diisi"),
    keterangan: z.string().optional(),
    kronologis: z.string().optional(),
    perbaikan: z.string().optional(),
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
    const queryClient = useQueryClient();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            thang: new Date().getFullYear().toString(),
            tg_nd: new Date().toISOString().split('T')[0] as string,
            no_nd: "",
            kdsatker: "",
            nm_indikator: "",
            no_doc: "",
            keterangan: "",
            kronologis: "",
            perbaikan: "",
        },
    });

    const mutation = useMutation({
        mutationFn: (newRecord: any) => apiClient.post("/ikpa", newRecord),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["ikpa-data"] });
            queryClient.invalidateQueries({ queryKey: ["ikpa-stats"] });
            toast.success("Data IKPA berhasil direkam");
            form.reset();
            onClose();
        },
        onError: (error: any) => {
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
        // Find indicator code
        const indicator = INDIKATOR_OPTIONS.find(i => i.value === values.nm_indikator);

        const payload = {
            ...values,
            date_input: new Date().toISOString().split('T')[0],
            kdkanwil: satker?.kdkanwil || "",
            nmkanwil: satker?.nmkanwil || "",
            kdkppn: satker?.kdkppn || "",
            nmkppn: satker?.nmkppn || "",
            nmsatker: satker?.nmsatker || "",
            kd_indikator: indicator?.code || "",
            approval: "Pending",
            id_approval: "0"
        };

        mutation.mutate(payload);
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <Save className="h-5 w-5 text-primary" />
                        Rekam Data IKPA
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Tahun Anggaran */}
                            <FormField
                                control={form.control}
                                name="thang"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tahun Anggaran</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Pilih Tahun" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
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
                                            <Input type="date" {...field} />
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
                                    <FormItem className="md:col-span-2">
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
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Pilih Satker" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="max-h-[300px]">
                                                {(satkerData as any[]).slice(0, 200).map((s) => (
                                                    <SelectItem key={s.kdsatker} value={s.kdsatker}>
                                                        {s.kdsatker} - {s.nmsatker}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Indikator */}
                            <FormField
                                control={form.control}
                                name="nm_indikator"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Indikator IKPA</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
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

                            {/* No Doc */}
                            <FormField
                                control={form.control}
                                name="no_doc"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nomor Dokumen</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Input nomor dokumen..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
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
                                            <Textarea placeholder="Input keterangan tambahan..." className="min-h-[80px]" {...field} />
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
                                            <Textarea placeholder="Input kronologis kejadian..." className="min-h-[80px]" {...field} />
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
                                            <Textarea placeholder="Input langkah perbaikan yang diambil..." className="min-h-[80px]" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter className="gap-2">
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
                                Simpan Record
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
