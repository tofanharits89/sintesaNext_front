"use client";

import { useMemo } from "react";

export function PotonganTable({
  rows,
  renderActions,
}: {
  rows: any[];
  renderActions?: (row: any) => React.ReactNode;
}) {
  const fmtNum = (value: number | string | null | undefined) => {
    const num = Number(value ?? 0);
    return Number.isFinite(num)
      ? num.toLocaleString("id-ID", { maximumFractionDigits: 0 })
      : "0";
  };

  const baseColumns = useMemo(
    () => [
      { key: "no", label: "No", align: "center" as const },
      { key: "thang", label: "Tahun", align: "center" as const },
      { key: "no_kmk", label: "Nomor KMK" },
      { key: "uraian", label: "Uraian" },
      { key: "nmkppn", label: "KPPN" },
      { key: "nmpemda", label: "Kab/Kota" },
      { key: "jan", label: "Jan", align: "right" as const },
      { key: "peb", label: "Peb", align: "right" as const },
      { key: "mar", label: "Mar", align: "right" as const },
      { key: "apr", label: "Apr", align: "right" as const },
      { key: "mei", label: "Mei", align: "right" as const },
      { key: "jun", label: "Jun", align: "right" as const },
      { key: "jul", label: "Jul", align: "right" as const },
      { key: "ags", label: "Ags", align: "right" as const },
      { key: "sep", label: "Sep", align: "right" as const },
      { key: "okt", label: "Okt", align: "right" as const },
      { key: "nov", label: "Nov", align: "right" as const },
      { key: "des", label: "Des", align: "right" as const },
    ],
    []
  );
  const columns = renderActions
    ? [
        ...baseColumns,
        { key: "_aksi", label: "Aksi", align: "center" as const },
      ]
    : baseColumns;

  return (
    <div className="border rounded-lg h-full flex flex-col overflow-hidden">
      <div className="flex-1 w-full overflow-auto">
        <div className="min-w-full">
          <table className="w-full min-w-max text-xs">
            <thead className="bg-muted sticky top-0 z-30">
              <tr>
                {columns.map((c) => (
                  <th
                    key={c.key}
                    className="p-2 text-center whitespace-nowrap text-xs"
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length ? (
                rows.map((r: any) => (
                  <tr
                    key={`${r.no}-${r.no_kmk}-${r.kdpemda}`}
                    className="border-t"
                  >
                    {baseColumns.map((c) => (
                      <td
                        key={c.key}
                        className={
                          c.align === "center"
                            ? "p-2 text-center text-xs"
                            : c.align === "right"
                            ? "p-2 text-right font-mono text-xs"
                            : "p-2 text-xs"
                        }
                      >
                        {c.align === "right"
                          ? fmtNum((r as any)[c.key])
                          : (r as any)[c.key]}
                      </td>
                    ))}
                    {renderActions && (
                      <td className="p-2 text-center">{renderActions(r)}</td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Tidak ada data.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
