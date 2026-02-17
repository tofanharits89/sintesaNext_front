import YearFilter from "@/components/data-supplier/year-filter";
import { DashboardSupplierClient } from "@/components/lazy";
import { MultipleBarChartSkeleton, GenericCardSkeleton } from "@/components/ui/dashboard-skeletons";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<{ [k: string]: string | string[] | undefined }>;
}) {
  // Define available years based on the current year (ensure the latest year is the current year)
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 2, currentYear - 1, currentYear];
  const latestYear = String(currentYear);

  // Determine selectedYear from URL if valid, otherwise default to latestYear
  const resolvedSearchParams = (await searchParams) ?? {};
  const spYear =
    typeof resolvedSearchParams.year === "string" ? (resolvedSearchParams.year as string) : "";
  const selectedYear = /^\d{4}$/.test(spYear) ? spYear : latestYear;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard Supplier</h1>
          <p className="text-sm text-muted-foreground">Ringkasan agregat vendor dan kontrak</p>
        </div>
        <YearFilter years={years} selectedYear={selectedYear} />
      </div>

      <Suspense
        fallback={
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <MultipleBarChartSkeleton height={250} />
              <MultipleBarChartSkeleton height={250} />
              <MultipleBarChartSkeleton height={250} />
            </div>
            <GenericCardSkeleton showHeader contentLines={6} />
          </div>
        }
      >
        <DashboardSupplierClient selectedYear={selectedYear} />
      </Suspense>
    </div>
  );
}

