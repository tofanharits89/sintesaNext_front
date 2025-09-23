import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DataSupplierIndexPage() {
  // Redirect to default child route
  redirect("/data-supplier/dashboard");
}
