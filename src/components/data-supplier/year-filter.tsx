"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTransition } from "react";
import { Loader2 } from "lucide-react";

interface YearFilterProps {
  years: number[];
  selectedYear?: string;
}

export default function YearFilter({ years, selectedYear }: YearFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  // Ensure years are displayed in descending order
  const orderedYears = Array.isArray(years) ? [...years].sort((a, b) => b - a) : [];

  function onValueChange(value: string) {
    // Avoid redundant navigation if value is unchanged
    const current = searchParams?.get("year") || selectedYear || String(years[years.length - 1]);
    if (current === value) return;

    const sp = new URLSearchParams(searchParams?.toString() || "");
    // Always set a year (no "Semua" state in this dashboard)
    sp.set("year", value);
    const qs = sp.toString();
    startTransition(() => {
      router.replace(`${pathname}${qs ? `?${qs}` : ""}`);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Tahun</span>
      <Select value={selectedYear || String(years[years.length - 1])} onValueChange={onValueChange}>
        <SelectTrigger
          className="h-9 w-[140px] data-[pending=true]:opacity-60"
          disabled={isPending}
          aria-busy={isPending}
          data-pending={isPending}
          aria-live="polite"
          title={isPending ? "Memuat data untuk tahun terpilih..." : "Pilih tahun"}
       >
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          {orderedYears.map((y) => (
            <SelectItem key={y} value={String(y)} disabled={isPending}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isPending ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
    </div>
  );
}
