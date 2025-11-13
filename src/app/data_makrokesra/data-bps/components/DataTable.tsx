"use client";

import { FileDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FetchedData {
  var: any;
  turvar: Array<{ val: number; label: string }>;
  vervar: Array<{ val: string; label: string }>;
  tahun: Array<{ val: string; label: string; th_id: string; th_name: string }>;
  turtahun: Array<{ val: string; label: string }>;
  datacontent: Record<string, string>;
}

interface DataTableProps {
  data: FetchedData;
  selectedVariable: string;
  onExport: () => void;
}

export function DataTable({ data, selectedVariable, onExport }: DataTableProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold">Hasil Data</CardTitle>
          <button
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2"
            onClick={onExport}
          >
            <FileDown className="mr-2 h-4 w-4" />
            Export Excel
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <div className="overflow-x-auto">
            <table
              className="w-full text-sm"
              style={{ width: "100%", tableLayout: "auto" }}
            >
              <thead className="bg-muted/50">
                <tr className="border-b">
                  <th
                    className="h-12 px-4 text-left align-middle font-medium"
                    rowSpan={2}
                  >
                    Komponen
                  </th>
                  <th
                    className="h-12 px-4 text-left align-middle font-medium"
                    rowSpan={2}
                  >
                    Turunan
                  </th>
                  {data.tahun.map((th) => (
                    <th
                      key={th.val}
                      className="h-12 px-4 text-center align-middle font-medium"
                      colSpan={data.turtahun.length}
                    >
                      {th.label}
                    </th>
                  ))}
                </tr>
                <tr className="border-b">
                  {data.tahun.flatMap((tahun) =>
                    data.turtahun.map((turth) => (
                      <th
                        key={`${tahun.val}-${turth.val}`}
                        className="h-12 px-4 text-left align-middle font-medium"
                      >
                        {turth.label}
                      </th>
                    ))
                  )}
                </tr>
              </thead>
              <tbody>
                {data.vervar.map((vervar, i) =>
                  data.turvar.map((turvar, j) => (
                    <tr key={`${i}-${j}`} className="border-b">
                      <th
                        className="p-4 align-middle font-medium"
                        rowSpan={1}
                      >
                        {vervar.label}
                      </th>
                      <td className="p-4 align-middle" rowSpan={1}>
                        {turvar.val === 0 ? "" : turvar.label}
                      </td>
                      {data.tahun.map((tahun, k) =>
                        data.turtahun.map((turtahun, l) => (
                          <td
                            key={`${vervar.val}${selectedVariable}${turvar.val}${tahun.val}${turtahun.val}`}
                            className="p-4 align-middle"
                          >
                            {
                              data.datacontent[
                                `${vervar.val}${selectedVariable}${turvar.val}${tahun.val}${turtahun.val}`
                              ]
                            }
                          </td>
                        ))
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
