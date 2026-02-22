import React, { useState, useEffect } from "react";
import numeral from "numeral";
import GenerateCSV from "../GenerateCSV";
import { toast } from "sonner";
import moment from "moment";
import { apiPath } from "@/lib/config/base-path";

interface DetailSatkerBlokir {
  isModalOpen: boolean;
  handleModalClose: () => void;
  kddept: string;
  kdunit: string;
  jenis: string;
  role?: string;
  kdkanwil?: string;
  token?: string;
}

interface SatkerData {
  kddept: string;
  nmdept: string;
  kdsatker: string;
  nmsatker: string;
  nilai_blokir: number;
  status_revisi: string;
}

export default function DetailSatkerBlokir({
  isModalOpen,
  handleModalClose,
  kddept,
  kdunit,
  jenis,
  role = "0", // Default to admin for now if not provided
  kdkanwil = "",
  token = "",
}: DetailSatkerBlokir) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SatkerData[]>([]);
  const [export2, setExport2] = useState(false);
  const [sql, setSql] = useState("");
  const [hasMoreData, setHasMoreData] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (isModalOpen) {
      getData();
    }
  }, [isModalOpen]);

  const getData = async () => {
    let limitakses = "";
    if (role === "X" || role === "1" || role === "0") {
      limitakses = " ";
    } else if (role === "2" && kdkanwil !== "11") {
      limitakses = " and c.kdkanwil= '" + kdkanwil + "'  ";
    } else if (role === "2" && kdkanwil === "11") {
      limitakses = " and c.kdkanwil='11'  and a.kddekon<>'1' ";
    }

    const encodedQuery2 = encodeURIComponent(
      `SELECT b.kddept, d.nmdept, a.kdsatker, c.nmsatker, SUM(a.total) as nilai_blokir,(CASE WHEN a.total <= '0' THEN 'Belum Revisi' WHEN a.total > '0' THEN 'Sudah Revisi' END) AS status_revisi FROM laporan_2023.blokir_perjadin_satker a LEFT JOIN laporan_2023.target_blokir_perjadin b ON a.kddept = b.kddept and a.kdunit = b.kdunit LEFT JOIN dbref.t_satker_2024 c ON a.kddept = c.kddept and a.kdunit = c.kdunit and a.kdsatker = c.kdsatker LEFT JOIN dbref.t_dept_2024 d ON a.kddept = d.kddept WHERE a.kddept='${kddept}' and a.kdunit='${kdunit}' group by b.kddept, b.kdunit, a.kdsatker ORDER BY a.kddept,a.kdunit,a.kdsatker DESC`,
    );

    const cleanedQuery2 = decodeURIComponent(encodedQuery2)
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    setSql(cleanedQuery2);
    // Use btoa as a simple replacement for Encrypt to match GenerateCSV usage
    const encryptedQuery = btoa(cleanedQuery2);

    try {
      setLoading(true);
      const apiUrl = apiPath(`/blokir/monitoring-satker/${encryptedQuery}`);

      const response = await fetch(apiUrl, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const newData = Array.isArray(result) ? result : result.result || [];

      setData((prevData) => [...prevData, ...newData]);

      // Simple check for "hasMore" if backend supports pagination
      if (newData.length < 30) {
        setHasMoreData(false);
      } else {
        setHasMoreData(true);
      }
    } catch (error) {
      console.log(error);
      toast.error("Terjadi Permasalahan Koneksi atau Server Backend");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = (status?: boolean | any) => {
    setIsDownloading(true);
    setExport2(true);
    setSql(sql);
    setIsDownloading(false);
  };

  return (
    <div
      style={{
        display: isModalOpen ? "flex" : "none",
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        zIndex: 1000,
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
      }}
      onClick={handleModalClose}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
          display: "flex",
          flexDirection: "column",
          maxHeight: "90vh",
          overflow: "hidden",
          width: "90%",
          maxWidth: "1200px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "20px",
            borderBottom: "1px solid #dee2e6",
            flexShrink: 0,
          }}
        >
          <div>
            <h6
              style={{
                margin: 0,
                fontSize: "1.1rem",
                fontWeight: 600,
                color: "#333",
                display: "flex",
                alignItems: "center",
              }}
            >
              <i
                className="bi bi-briefcase-fill"
                style={{ margin: "0 8px 0 0", color: "#28a745" }}
              ></i>
              Satker yang Sudah dan Belum Revisi Blokir
            </h6>
          </div>
          <button
            style={{
              background: "none",
              border: "none",
              fontSize: "2rem",
              cursor: "pointer",
              color: "#999",
              padding: 0,
              lineHeight: 1,
            }}
            onClick={handleModalClose}
            type="button"
            onMouseOver={(e) => (e.currentTarget.style.color = "#333")}
            onMouseOut={(e) => (e.currentTarget.style.color = "#999")}
          >
            <span>&times;</span>
          </button>
        </div>

        <div
          style={{
            flex: 1,
            overflow: "auto",
            padding: "20px",
          }}
        >
          <div
            style={{
              border: "1px solid #dee2e6",
              borderRadius: "6px",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
              backgroundColor: "#f8f9fa",
            }}
          >
            <div
              id="scrollableDiv"
              style={{
                height: "50vh",
                overflowY: "auto",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  marginBottom: 0,
                }}
              >
                <thead style={{ backgroundColor: "#e9ecef" }}>
                  <tr>
                    <th
                      style={{
                        padding: "12px 8px",
                        fontWeight: 600,
                        border: "1px solid #dee2e6",
                        backgroundColor: "#f8f9fa",
                        textAlign: "center",
                      }}
                    >
                      No.
                    </th>
                    <th
                      style={{
                        padding: "12px 8px",
                        fontWeight: 600,
                        border: "1px solid #dee2e6",
                        backgroundColor: "#f8f9fa",
                        textAlign: "center",
                      }}
                    >
                      Kementerian/ Lembaga
                    </th>
                    <th
                      style={{
                        padding: "12px 8px",
                        fontWeight: 600,
                        border: "1px solid #dee2e6",
                        backgroundColor: "#f8f9fa",
                        textAlign: "center",
                      }}
                    >
                      Satker
                    </th>
                    <th
                      style={{
                        padding: "12px 8px",
                        fontWeight: 600,
                        border: "1px solid #dee2e6",
                        backgroundColor: "#f8f9fa",
                        textAlign: "center",
                      }}
                    >
                      Nilai Blokir
                    </th>
                    <th
                      style={{
                        padding: "12px 8px",
                        fontWeight: 600,
                        border: "1px solid #dee2e6",
                        backgroundColor: "#f8f9fa",
                        textAlign: "center",
                      }}
                    >
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, index) => (
                    <tr
                      key={index}
                      style={{
                        backgroundColor:
                          index % 2 === 0 ? "#ffffff" : "#f9f9f9",
                      }}
                      onMouseOver={(e) =>
                        (e.currentTarget.style.backgroundColor = "#f5f5f5")
                      }
                      onMouseOut={(e) =>
                        (e.currentTarget.style.backgroundColor =
                          index % 2 === 0 ? "#ffffff" : "#f9f9f9")
                      }
                    >
                      <td
                        style={{
                          padding: "12px 8px",
                          border: "1px solid #dee2e6",
                          textAlign: "center",
                          verticalAlign: "middle",
                        }}
                      >
                        {index + 1}
                      </td>
                      <td
                        style={{
                          padding: "12px 8px",
                          border: "1px solid #dee2e6",
                          textAlign: "center",
                          verticalAlign: "middle",
                        }}
                      >
                        {row.nmdept} ({row.kddept})
                      </td>
                      <td
                        style={{
                          padding: "12px 8px",
                          border: "1px solid #dee2e6",
                          textAlign: "center",
                          verticalAlign: "middle",
                        }}
                      >
                        {row.nmsatker} ({row.kdsatker})
                      </td>
                      <td
                        style={{
                          padding: "12px 8px",
                          border: "1px solid #dee2e6",
                          textAlign: "center",
                        }}
                      >
                        {numeral(row.nilai_blokir).format("0,0")}
                      </td>
                      <td
                        style={{
                          padding: "12px 8px",
                          border: "1px solid #dee2e6",
                          textAlign: "center",
                          verticalAlign: "middle",
                        }}
                      >
                        {row.status_revisi}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {loading && (
                <p
                  style={{
                    textAlign: "center",
                    padding: "20px",
                    color: "#666",
                  }}
                >
                  Loading...
                </p>
              )}
            </div>
          </div>

          {export2 && (
            <GenerateCSV
              query3={sql}
              status={handleDownloadCSV}
              namafile={`v3_CSV_MONITORING_BLOKIR_${moment().format(
                "DDMMYY-HHmmss",
              )}`}
            />
          )}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
            padding: "15px 20px",
            borderTop: "1px solid #dee2e6",
            flexShrink: 0,
            backgroundColor: "#f8f9fa",
          }}
        >
          <button
            style={{
              padding: "8px 16px",
              border: "1px solid #6c757d",
              borderRadius: "4px",
              fontSize: "0.95rem",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.2s ease",
              backgroundColor: "#6c757d",
              color: "white",
            }}
            onClick={handleModalClose}
            type="button"
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "#545b62";
              e.currentTarget.style.borderColor = "#545b62";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "#6c757d";
              e.currentTarget.style.borderColor = "#6c757d";
            }}
          >
            Close
          </button>
          <button
            style={{
              padding: "8px 16px",
              border: "1px solid #007bff",
              borderRadius: "4px",
              fontSize: "0.95rem",
              fontWeight: 500,
              cursor: isDownloading ? "not-allowed" : "pointer",
              transition: "all 0.2s ease",
              backgroundColor: isDownloading ? "#6c757d" : "#007bff",
              color: "white",
              opacity: isDownloading ? 0.65 : 1,
            }}
            onClick={handleDownloadCSV}
            disabled={isDownloading}
            type="button"
            onMouseOver={(e) => {
              if (!isDownloading) {
                e.currentTarget.style.backgroundColor = "#0056b3";
                e.currentTarget.style.borderColor = "#0056b3";
              }
            }}
            onMouseOut={(e) => {
              if (!isDownloading) {
                e.currentTarget.style.backgroundColor = "#007bff";
                e.currentTarget.style.borderColor = "#007bff";
              }
            }}
          >
            {isDownloading ? "Downloading..." : "Download CSV"}
          </button>
        </div>
      </div>
    </div>
  );
}
