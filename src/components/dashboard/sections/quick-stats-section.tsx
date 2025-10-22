import { useRouter } from "next/navigation";
import { StatCard } from "@/components/lazy";
import {
  FileText,
  Banknote,
  Wallet,
  TrendingUp,
  Lock,
  Calculator,
} from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import type { DashboardDataHooks } from "@/hooks/dashboard/use-dashboard-data";

interface QuickStatsSectionProps {
  quickStats: DashboardDataHooks['quickStats'];
}

export const QuickStatsSection = ({ quickStats }: QuickStatsSectionProps) => {
  const router = useRouter();
  const qs = quickStats.data as import("@/hooks/useQuickStats").QSReturn | undefined;

  const statCards = [
    {
      label: "Jumlah DIPA",
      icon: <FileText className="h-4 w-4 text-blue-500" />,
      value: qs?.jumlahDipa?.toLocaleString("id-ID") || "0",
    },
    {
      label: "Pagu APBN",
      icon: <Banknote className="h-4 w-4 text-green-500" />,
      value: formatCurrency(qs?.paguApbn || 0),
    },
    {
      label: "Pagu DIPA",
      icon: <Wallet className="h-4 w-4 text-purple-500" />,
      value: formatCurrency(qs?.paguDipa || 0),
    },
    {
      label: "Realisasi",
      icon: <TrendingUp className="h-4 w-4 text-orange-500" />,
      value: formatCurrency(qs?.realisasi || 0),
    },
    {
      label: "Blokir",
      icon: <Lock className="h-4 w-4 text-red-500" />,
      value: formatCurrency(qs?.blokir || 0),
    },
    {
      label: "Sisa Pagu DIPA",
      icon: <Calculator className="h-4 w-4 text-teal-500" />,
      value: formatCurrency(qs?.sisaPaguDipa || 0),
    },
  ];

  if (quickStats.error) {
    return (
      <div className="col-span-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-sm text-red-600 dark:text-red-400 font-medium">
          Error loading data
        </p>
        <p className="text-xs text-red-500 dark:text-red-500 mt-1">
          {quickStats.error.message}
        </p>
        {quickStats.error.message.includes("Authentication") && (
          <button
            onClick={() => router.push("/login")}
            className="mt-2 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
          >
            Go to Login
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
      {quickStats.isLoading ? (
        Array.from({ length: 6 }).map((_, i) => (
          <StatCard
            key={`skeleton-${i}`}
            label={statCards[i]?.label || ""}
            icon={statCards[i]?.icon}
            loading={true}
            value="0"
          />
        ))
      ) : (
        statCards.map((card, index) => (
          <StatCard
            key={card.label}
            label={card.label}
            icon={card.icon}
            value={card.value}
          />
        ))
      )}
    </div>
  );
};