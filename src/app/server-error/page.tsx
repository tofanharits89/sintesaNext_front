import { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { RetryActions } from "@/components/retry-actions";
import AutoRetry from "@/components/auto-retry";

export const metadata: Metadata = {
  title: "Server Connection Error",
  description: "We can't reach the server right now.",
};

export default function ServerErrorPage() {
  return (
    <div className="min-h-[100svh] w-full flex items-center justify-center bg-gradient-to-b from-background to-muted/40 p-6">
      <div className="max-w-xl w-full">
        <AutoRetry />
        <Card className="border-2 shadow-xl">
          <CardHeader className="space-y-2 text-center">
            <div className="mx-auto h-14 w-14 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <CardTitle className="text-2xl">
              Tidak dapat terhubung ke server
            </CardTitle>
            <CardDescription>
              Sistem kami mengalami kendala saat menghubungkan ke backend. Ini
              biasanya bersifat sementara.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md bg-muted p-4 text-sm leading-relaxed">
              <p className="mb-1 font-medium">Kemungkinan penyebab:</p>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>Server sedang pemeliharaan atau restart</li>
                <li>Koneksi internet Anda terputus</li>
                <li>Terjadi gangguan jaringan sementara</li>
              </ul>
            </div>
          </CardContent>
          <CardFooter className="flex items-center justify-end">
            <RetryActions />
          </CardFooter>
        </Card>
        <div className="mt-6 text-center text-xs text-muted-foreground">
          Butuh bantuan?{" "}
          <a
            className="underline hover:text-foreground"
            href="mailto:support@example.com"
          >
            Hubungi dukungan
          </a>
        </div>
      </div>
    </div>
  );
}
