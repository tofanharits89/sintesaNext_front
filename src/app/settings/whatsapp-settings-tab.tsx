"use client";

import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Loader2, QrCode, RefreshCcw, Smartphone, CheckCircle2, XCircle } from "lucide-react";
import QRCode from "react-qr-code";
import { toast } from "sonner";
import { http } from "@/lib/api/httpClient";

export function WhatsAppSettingsTab() {
    const [loading, setLoading] = useState(false);
    const [qrText, setQrText] = useState<string | null>(null);
    const [status, setStatus] = useState<{
        initialized: boolean;
        ready: boolean;
        authenticated: boolean;
        hasQr: boolean;
    } | null>(null);
    const [polling, setPolling] = useState(false);

    const fetchedQrRef = useRef(false);

    async function fetchStatus() {
        try {
            const resp = await http.get(`/api/whatsapp/status`);
            const data = resp.data;
            if (!data || data?.success === false) {
                throw new Error(data?.error || "Gagal memeriksa status");
            }
            const statusData = data?.data || null;
            setStatus(statusData);
            return statusData as typeof status;
        } catch (e: any) {
            console.error("QR status error", e);
            setStatus(null);
            return null;
        }
    }

    async function fetchQr() {
        setLoading(true);
        try {
            const resp = await http.get(`/api/whatsapp/qr`);
            const data = resp.data;
            if (!data || !data?.success) {
                throw new Error(data?.error || "QR tidak tersedia");
            }
            setQrText(data?.data?.qr || null);
        } catch (e) {
            console.error("QR fetch error", e);
            setQrText(null);
            toast.error("Gagal memuat QR code");
        } finally {
            setLoading(false);
        }
    }

    // Initial check and polling logic
    useEffect(() => {
        let interval: any;
        fetchedQrRef.current = false;

        (async () => {
            const s = await fetchStatus();

            if (!s?.authenticated) {
                if (s?.hasQr && !fetchedQrRef.current) {
                    await fetchQr();
                    fetchedQrRef.current = true;
                }
                setPolling(true);
                interval = setInterval(async () => {
                    const st = await fetchStatus();

                    if (st?.authenticated) {
                        clearInterval(interval);
                        setPolling(false);
                        toast.success("WhatsApp berhasil tersambung!");
                    } else if (st?.hasQr && !fetchedQrRef.current) {
                        await fetchQr();
                        fetchedQrRef.current = true;
                    }
                }, 3000);
            } else {
                setPolling(false);
            }
        })();

        return () => {
            if (interval) clearInterval(interval);
        };
    }, []);

    const handleRefresh = async () => {
        const s = await fetchStatus();
        if (s?.hasQr) {
            await fetchQr();
        } else {
            toast.info("QR belum tersedia. Tunggu sebentar lalu coba lagi.");
        }
    };

    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Smartphone className="w-5 h-5" />
                        Status Koneksi WhatsApp
                    </CardTitle>
                    <CardDescription>
                        Status hubungan antara sistem dan WhatsApp Web.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                        <div className="space-y-1">
                            <div className="font-medium">Status Saat Ini</div>
                            <div className="text-sm text-muted-foreground">
                                {status?.authenticated
                                    ? "Sistem terhubung ke WhatsApp"
                                    : "Sistem belum terhubung"}
                            </div>
                        </div>
                        {status ? (
                            status.authenticated ? (
                                <Badge className="bg-green-600 hover:bg-green-700 px-3 py-1 text-sm gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Tersambung
                                </Badge>
                            ) : (
                                <Badge variant="destructive" className="px-3 py-1 text-sm gap-1">
                                    <XCircle className="w-3.5 h-3.5" />
                                    Terputus
                                </Badge>
                            )
                        ) : (
                            <Badge variant="outline">Memeriksa...</Badge>
                        )}
                    </div>

                    {!status?.authenticated && (
                        <div className="flex flex-col items-center gap-6 py-4 border-t">
                            <div className="text-center space-y-2">
                                <h3 className="font-medium">Scan QR Code</h3>
                                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                                    Buka WhatsApp di ponsel Anda, buka Menu {">"} Perangkat tertaut {">"} Tautkan perangkat, lalu pindai kode di bawah ini.
                                </p>
                            </div>

                            <div className="border rounded-xl p-4 bg-white shadow-sm">
                                {loading ? (
                                    <div className="w-64 h-64 flex items-center justify-center">
                                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                                    </div>
                                ) : qrText ? (
                                    <QRCode value={qrText} size={256} />
                                ) : (
                                    <div className="w-64 h-64 flex flex-col items-center justify-center text-muted-foreground gap-2">
                                        <AlertTriangle className="w-8 h-8 opacity-50" />
                                        <span className="text-sm">QR tidak tersedia</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleRefresh}
                                    disabled={loading}
                                >
                                    <RefreshCcw className="w-4 h-4 mr-2" />
                                    Refresh QR
                                </Button>
                            </div>
                        </div>
                    )}

                    {status?.authenticated && (
                        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 p-4 rounded-lg flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                            <div>
                                <h4 className="font-medium text-green-900 dark:text-green-300">Siap Digunakan</h4>
                                <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                                    Sistem siap mengirim pesan WhatsApp. Anda tidak perlu melakukan tindakan apa pun.
                                    Jika ingin mengganti akun, silakan logout dari perangkat ponsel Anda.
                                </p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
