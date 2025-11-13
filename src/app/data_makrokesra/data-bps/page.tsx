"use client";

import React, { useState, useEffect } from "react";
import { Search, FileDown } from "lucide-react";
import * as XLSX from "xlsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Types
interface SelectOption {
  value: string;
  label: string;
}

interface DomainItem {
  domain_id: string;
  domain_name: string;
}

interface VariableItem {
  var_id: string;
  title: string;
}

interface TahunItem {
  th_id: string;
  th_name: string;
  val: string;
  label: string;
}

interface TurtahunItem {
  val: string;
  label: string;
}

interface VervarItem {
  val: string;
  label: string;
}

interface TurvarItem {
  val: number;
  label: string;
}

interface FetchedData {
  var: any;
  turvar: TurvarItem[];
  vervar: VervarItem[];
  tahun: TahunItem[];
  turtahun: TurtahunItem[];
  datacontent: Record<string, string>;
}

// Presentational subcomponents
const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-lg font-semibold">{title}</CardTitle>
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);

const Field = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="mb-4">
    <label className="text-sm font-medium mb-2 block">{label}</label>
    {children}
  </div>
);

const SelectField = ({
  label,
  options = [],
  defaultValue,
  onChange,
  disabled,
  isLoading,
}: {
  label: string;
  options: SelectOption[];
  defaultValue?: SelectOption;
  onChange: (value: string | null) => void;
  disabled?: boolean;
  isLoading?: boolean;
}) => (
  <Field label={label}>
    <select
      className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
      disabled={disabled || isLoading}
      onChange={(e) => {
        const value = e.target.value;
        onChange(value || null);
      }}
    >
      <option value="">Pilih {label}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </Field>
);

const ButtonRow = ({
  onSearch,
  loadingResults,
  disabled = false,
}: {
  onSearch: () => void;
  loadingResults: boolean;
  disabled?: boolean;
}) => (
  <div className="flex gap-2">
    <button
      className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
      onClick={onSearch}
      disabled={loadingResults || disabled}
    >
      {loadingResults ? (
        <>
          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
          Loading...
        </>
      ) : (
        <>
          <Search className="mr-2 h-4 w-4" />
          Tayang
        </>
      )}
    </button>
  </div>
);

function DataBPSContent() {
  const BPSKey = "3405ac46a7c9419e06ebc7a9894b79fd";
  const [domainList, setDomainList] = useState<SelectOption[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [variableList, setVariableList] = useState<SelectOption[]>([]);
  const [selectedVariable, setSelectedVariable] = useState<string | null>(null);
  const [fetchedData, setFetchedData] = useState<FetchedData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [pulse, setPulse] = useState(false);

  const exportToExcel = () => {
    if (!fetchedData) return;

    const excelData: any[] = [];

    // Add header rows
    const header1 = ["Komponen", "Turunan"];
    fetchedData.tahun.forEach((th) => {
      for (let i = 0; i < fetchedData.turtahun.length; i++) {
        header1.push(th.label);
      }
    });
    excelData.push(header1);

    const header2 = ["", ""];
    fetchedData.tahun.forEach(() => {
      fetchedData.turtahun.forEach((turth) => {
        header2.push(turth.label);
      });
    });
    excelData.push(header2);

    // Add data rows
    fetchedData.vervar.forEach((vervar) => {
      fetchedData.turvar.forEach((turvar) => {
        const row: any[] = [vervar.label, turvar.val === 0 ? "" : turvar.label];
        fetchedData.tahun.forEach((tahun) => {
          fetchedData.turtahun.forEach((turtahun) => {
            const key = `${vervar.val}${selectedVariable}${turvar.val}${tahun.val}${turtahun.val}`;
            row.push(fetchedData.datacontent[key] || "");
          });
        });
        excelData.push(row);
      });
    });

    // Create workbook and worksheet
    const ws = XLSX.utils.aoa_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data BPS");

    // Generate filename with current date
    const date = new Date().toISOString().split("T")[0];
    const filename = `BPS_Data_${date}.xlsx`;

    // Save file
    XLSX.writeFile(wb, filename);
  };

  const BPSFetchAllDomain = async () => {
    setIsLoading(true);
    if (!BPSKey) {
      console.error("BPS API Key not found");
      setIsLoading(false);
      return;
    }
    try {
      const response = await fetch(
        `https://webapi.bps.go.id/v1/api/domain/type/all/key/${BPSKey}`
      );
      const res = await response.json();
      let filteredRes = res.data[1].filter(
        (item: DomainItem) => item.domain_id !== "0000"
      );
      filteredRes = [
        { domain_id: "0000", domain_name: "Nasional" },
        ...filteredRes,
      ];
      const filteredResTransformed = filteredRes.map((item: DomainItem) => ({
        value: item.domain_id,
        label: item.domain_name,
      }));
      setDomainList(filteredResTransformed);
    } catch (error) {
      console.warn(error);
    } finally {
      setIsLoading(false);
    }
  };

  const BPSFetchAllVariable = async () => {
    setIsLoading(true);
    if (!selectedDomain || !BPSKey) {
      setIsLoading(false);
      return;
    }

    try {
      const pageCountResponse = await fetch(
        `https://webapi.bps.go.id/v1/api/list/model/var/domain/${selectedDomain}/key/${BPSKey}`
      );
      const pageCountRes = await pageCountResponse.json();
      const pageCount = pageCountRes.data[0].pages;

      let variableListTemp: VariableItem[] = [];

      for (let page = 1; page <= pageCount; page++) {
        const variableResponse = await fetch(
          `https://webapi.bps.go.id/v1/api/list/model/var/domain/${selectedDomain}/page/${page}/key/${BPSKey}`
        );
        const variableRes = await variableResponse.json();
        variableListTemp = [...variableListTemp, ...variableRes.data[1]];
      }

      const variableListTransformed = variableListTemp.map((item) => ({
        value: item.var_id,
        label: item.title,
      }));
      setVariableList(variableListTransformed);
    } catch (error) {
      console.warn(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVariableData = async () => {
    setIsFetching(true);
    if (!selectedVariable || !BPSKey) {
      setIsFetching(false);
      return;
    }

    try {
      const pageThCountResponse = await fetch(
        `https://webapi.bps.go.id/v1/api/list/model/th/domain/${selectedDomain}/var/${selectedVariable}/key/${BPSKey}`
      );
      const pageThCountRes = await pageThCountResponse.json();
      const pageThCount = pageThCountRes.data[0].pages;

      let tahunList: any[] = [];

      for (let page = 1; page <= pageThCount; page++) {
        const thResponse = await fetch(
          `https://webapi.bps.go.id/v1/api/list/model/th/domain/${selectedDomain}/var/${selectedVariable}/page/${page}/key/${BPSKey}`
        );
        const thRes = await thResponse.json();
        tahunList = [...tahunList, ...thRes.data[1]];
      }

      let combinedData: FetchedData = {
        var: null,
        turvar: [],
        vervar: [],
        tahun: [],
        turtahun: [],
        datacontent: {},
      };
      let allTahunObjects: TahunItem[] = [];
      let uniqueTurtahun = new Set<string>();

      const fetchPromises = tahunList.map(async (yearInfo) => {
        const result = await fetch(
          `https://webapi.bps.go.id/v1/api/list/model/data/lang/ind/domain/${selectedDomain}/var/${selectedVariable}/th/${yearInfo.th_id}/key/${BPSKey}`
        ).then((response) => response.json());
        if (result.status === "OK" && result.datacontent) {
          return result;
        }
        console.warn(`No data or API error for year ${yearInfo.th_name}`);
        return null;
      });

      const responsesForYears = await Promise.all(fetchPromises);

      responsesForYears.forEach((dataForYear) => {
        if (dataForYear) {
          if (!combinedData.var) combinedData.var = dataForYear.var;
          if (!combinedData.turvar.length)
            combinedData.turvar = dataForYear.turvar;
          if (!combinedData.vervar.length)
            combinedData.vervar = dataForYear.vervar;
          if (!combinedData.turtahun.length)
            combinedData.turtahun = dataForYear.turtahun;

          combinedData.datacontent = {
            ...combinedData.datacontent,
            ...dataForYear.datacontent,
          };

          if (dataForYear.tahun) {
            allTahunObjects = allTahunObjects.concat(dataForYear.tahun);
          }

          if (dataForYear.turtahun) {
            dataForYear.turtahun.forEach((tt: TurtahunItem) =>
              uniqueTurtahun.add(JSON.stringify(tt))
            );
          }
        }
      });

      combinedData.tahun = allTahunObjects.sort(
        (a, b) => parseInt(a.val) - parseInt(b.val)
      );
      combinedData.turtahun = Array.from(uniqueTurtahun).map((tt) =>
        JSON.parse(tt)
      );
      setFetchedData(combinedData);
    } catch (error) {
      console.warn(error);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    BPSFetchAllDomain();
  }, []);

  useEffect(() => {
    if (selectedDomain) {
      BPSFetchAllVariable();
    }
  }, [selectedDomain]);

  useEffect(() => {
    let iv: NodeJS.Timeout | null = null;
    if (isFetching) {
      iv = setInterval(() => setPulse((p) => !p), 600);
    } else {
      setPulse(false);
    }
    return () => {
      if (iv) clearInterval(iv);
    };
  }, [isFetching]);

  return (
    <>
      <Section title="Pilih Parameter">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SelectField
            label="Domain"
            options={domainList}
            onChange={(value) => {
              setSelectedDomain(value);
            }}
            disabled={domainList.length === 0 || isLoading}
            isLoading={isLoading}
          />
          <SelectField
            label="Variable"
            options={variableList}
            onChange={(value) => {
              setSelectedVariable(value);
            }}
            disabled={variableList.length === 0 || isLoading}
            isLoading={isLoading}
          />
        </div>
      </Section>
      <div className="flex justify-center">
        <ButtonRow
          onSearch={fetchVariableData}
          loadingResults={isFetching}
          disabled={!selectedVariable || !selectedDomain}
        />
      </div>
      {!isFetching ? (
        fetchedData ? (
          <Section title="Hasil Data">
            <div className="mb-4 flex justify-end">
              <button
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2"
                onClick={() => exportToExcel()}
              >
                <FileDown className="mr-2 h-4 w-4" />
                Export Excel
              </button>
            </div>
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
                      {fetchedData.tahun.map((th, index) => {
                        return (
                          <th
                            key={index}
                            className="h-12 px-4 text-center align-middle font-medium"
                            colSpan={fetchedData.turtahun.length}
                          >
                            {th.label}
                          </th>
                        );
                      })}
                    </tr>
                    <tr className="border-b">
                      {fetchedData.tahun.map((th, i) => {
                        let elements = fetchedData.turtahun.map((turth, j) => (
                          <th
                            key={`${i}${j}`}
                            className="h-12 px-4 text-left align-middle font-medium"
                            colSpan={1}
                          >
                            {turth.label}
                          </th>
                        ));
                        return elements;
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {fetchedData.vervar.map((vervar, i) =>
                      fetchedData.turvar.map((turvar, j) => (
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
                          {fetchedData.tahun.map((tahun, k) =>
                            fetchedData.turtahun.map((turtahun, l) => (
                              <td
                                key={`${vervar.val}${selectedVariable}${turvar.val}${tahun.val}${turtahun.val}`}
                                className="p-4 align-middle"
                              >
                                {
                                  fetchedData.datacontent[
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
          </Section>
        ) : (
          <Section title="Tidak Ada Data">
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {!BPSKey
                  ? "BPS API Key tidak ditemukan"
                  : "Silakan pilih Domain dan Variable untuk menampilkan data"}
              </p>
            </div>
          </Section>
        )
      ) : (
        <Section title="Memuat Data">
          <div className="text-center py-8">
            <div
              className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] mb-4"
              role="status"
            >
              <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
                Loading...
              </span>
            </div>
            <div className="text-muted-foreground">
              Memuat data, mohon tunggu...
            </div>
          </div>

          <div style={{ overflowX: "auto", maxWidth: "100%", marginTop: 12 }}>
            <div
              style={{
                display: "table",
                width: "100%",
                borderCollapse: "collapse",
              }}
            >
              <div style={{ display: "table-header-group" }}>
                <div style={{ display: "table-row" }}>
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "table-cell",
                        padding: "10px",
                        background: pulse ? "#e9ecef" : "#f8f9fa",
                        transition: "background-color 300ms",
                        height: 20,
                        borderBottom: "1px solid #dee2e6",
                      }}
                    />
                  ))}
                </div>
              </div>
              <div style={{ display: "table-row-group" }}>
                {Array.from({ length: 5 }).map((_, r) => (
                  <div key={r} style={{ display: "table-row" }}>
                    {Array.from({ length: 6 }).map((__, c) => (
                      <div
                        key={c}
                        style={{
                          display: "table-cell",
                          padding: "8px",
                          background: pulse ? "#f1f3f5" : "#f8f9fa",
                          transition: "background-color 300ms",
                          height: 28,
                          borderBottom: "1px solid #eee",
                        }}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>
      )}
    </>
  );
}

export default function DataBPSPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Data BPS</h1>
          <p className="text-sm text-muted-foreground">
            Data berasal dari WebAPI Badan Pusat Statistik (BPS) Republik
            Indonesia
          </p>
        </div>
      </div>

      <DataBPSContent />
    </div>
  );
}
