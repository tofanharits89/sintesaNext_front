"use client";

import React, { useState, useEffect } from "react";
import { Search, FileDown } from "lucide-react";
import * as XLSX from "xlsx";

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
  <div className="row">
    <div className="col-lg-12">
      <div className="card bg-secondary text-white custom-card">
        <div className="card-body py-1 px-2">
          <div className="bagian-query">
            <div className="custom-content">
              <h5 className="text-white mb-1">{title}</h5>
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const Field = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="mb-3">
    <label
      className="form-label text-white"
      style={{ display: "block", marginBottom: 6 }}
    >
      {label}
    </label>
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
  onChange: (value: SelectOption | null) => void;
  disabled?: boolean;
  isLoading?: boolean;
}) => (
  <Field label={label}>
    <select
      className="form-select"
      disabled={disabled || isLoading}
      onChange={(e) => {
        const selected = options.find((opt) => opt.value === e.target.value);
        onChange(selected || null);
      }}
      defaultValue={defaultValue?.value}
      style={{
        backgroundColor: "white",
        color: "#000",
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
  <div className="button-query">
    <div className="row">
      <div className="col-lg-12">
        <button
          className="btn btn-success btn-sm button me-2"
          onClick={onSearch}
          disabled={loadingResults || disabled}
        >
          {loadingResults ? (
            <>
              <span
                className="spinner-border spinner-border-sm me-1"
                role="status"
                aria-hidden="true"
              ></span>
              Loading...
            </>
          ) : (
            <>
              <Search
                className="w-4 h-4 me-1"
                style={{
                  display: "inline-block",
                  width: "1rem",
                  height: "1rem",
                }}
              />
              Tayang
            </>
          )}
        </button>
      </div>
    </div>
  </div>
);

export default function DataMakrokesraPage() {
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
    <main id="main" className="main">
      <div className="flex-1 overflow-y-auto p-4 md:p-8 mt-16 md:mt-12">
        <div className="pagetitle">
          <h1>Data BPS</h1>
          <nav>
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <a href="#">Data</a>
              </li>
              <li className="breadcrumb-item active">Makro Kesra</li>
            </ol>
          </nav>
          <p className="text-muted mt-3" style={{ fontSize: "0.9em" }}>
            <i className="bi bi-info-circle me-1"></i>
            Note: Data berasal dari WebAPI Badan Pusat Statistik (BPS) Republik
            Indonesia. Informasi yang Anda lihat merupakan data resmi yang
            dipublikasikan oleh BPS, baik dalam bentuk publikasi, siaran pers,
            acara, maupun tabel data statis dan dinamis.
          </p>
        </div>

        <Section title="Pilih Parameter">
          <div className="row">
            <div className="col-lg-6">
              <SelectField
                label="Domain"
                options={domainList}
                onChange={(e) => {
                  setSelectedDomain(e ? e.value : null);
                }}
                disabled={domainList.length === 0 || isLoading}
                isLoading={isLoading}
              />
            </div>
            <div className="col-lg-6">
              <SelectField
                label="Variable"
                options={variableList}
                onChange={(e) => {
                  setSelectedVariable(e ? e.value : null);
                }}
                disabled={variableList.length === 0 || isLoading}
                isLoading={isLoading}
              />
            </div>
          </div>
        </Section>

        <ButtonRow
          onSearch={fetchVariableData}
          loadingResults={isFetching}
          disabled={!selectedVariable || !selectedDomain || !BPSKey}
        />

        {!isFetching ? (
          fetchedData ? (
            <Section title="Hasil Data">
              <div className="mb-3 d-flex justify-content-end">
                <button
                  className="btn btn-success btn-sm d-flex align-items-center gap-2"
                  onClick={() => exportToExcel()}
                >
                  <FileDown size={16} />
                  Export Excel
                </button>
              </div>
              <div className="grid grid-cols-1">
                <div
                  className="overflow-x-auto bg-white"
                  style={{ maxWidth: "100%" }}
                >
                  <table
                    className="table table-sm"
                    style={{ width: "100%", tableLayout: "auto" }}
                  >
                    <thead>
                      <tr>
                        <th rowSpan={2}>Komponen</th>
                        <th rowSpan={2}>Turunan</th>
                        {fetchedData.tahun.map((th, index) => {
                          return (
                            <th
                              key={index}
                              className="text-center"
                              colSpan={fetchedData.turtahun.length}
                            >
                              {th.label}
                            </th>
                          );
                        })}
                      </tr>
                      <tr>
                        {fetchedData.tahun.map((th, i) => {
                          let elements = fetchedData.turtahun.map(
                            (turth, j) => (
                              <th key={`${i}${j}`} colSpan={1}>
                                {turth.label}
                              </th>
                            )
                          );
                          return elements;
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {fetchedData.vervar.map((vervar, i) =>
                        fetchedData.turvar.map((turvar, j) => (
                          <tr key={`${i}-${j}`}>
                            <th className="bg-white" rowSpan={1}>
                              {vervar.label}
                            </th>
                            <td rowSpan={1}>
                              {turvar.val === 0 ? "" : turvar.label}
                            </td>
                            {fetchedData.tahun.map((tahun, k) =>
                              fetchedData.turtahun.map((turtahun, l) => (
                                <td
                                  key={`${vervar.val}${selectedVariable}${turvar.val}${tahun.val}${turtahun.val}`}
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
              <div className="text-center py-4">
                <p className="text-white">
                  {!BPSKey
                    ? "BPS API Key tidak ditemukan"
                    : "Silakan pilih Domain dan Variable untuk menampilkan data"}
                </p>
              </div>
            </Section>
          )
        ) : (
          <Section title="Memuat Data">
            <div className="text-center py-4">
              <div className="spinner-border text-light mb-2" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <div className="text-white">Memuat data, mohon tunggu...</div>
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
      </div>
    </main>
  );
}
