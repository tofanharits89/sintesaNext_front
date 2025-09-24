export const dynamic = "force-dynamic";

import SupplierProfileClient from "@/components/data-supplier/SupplierProfileClient";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const resolvedSearchParams: SearchParams = searchParams
    ? await searchParams
    : {};
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 2, currentYear - 1, currentYear];
  const spYear =
    typeof resolvedSearchParams.year === "string" ? resolvedSearchParams.year : "";
  const selectedYear = /^\d{4}$/.test(spYear) ? spYear : String(currentYear);

  return <SupplierProfileClient years={years} selectedYear={selectedYear} />;
}
