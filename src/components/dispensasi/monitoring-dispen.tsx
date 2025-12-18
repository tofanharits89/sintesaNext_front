"use client";

import React, { useState, useEffect } from "react";
import {
  Button,
  Card,
  Container,
  Spinner,
  Table,
  Form,
  Row,
  Col,
} from "react-bootstrap";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { TableSkeleton } from "@/components/ui/skeleton-loader";
import { Skeleton } from "@/components/ui/skeleton";
import ReactPaginate from "react-paginate";
import moment from "moment";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface MonitoringProps {
  cek: boolean;
  id: string;
  where: string;
}

interface MonitoringData {
  kddept: string;
  nmdept: string;
  jumlah_spm: number;
  nilai_spm: number;
}

export default function Monitoring({ cek, id, where }: MonitoringProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<MonitoringData[]>([]);
  const [page, setPage] = useState(0);
  const [limit] = useState(100);
  const [pages, setPages] = useState(0);
  const [rows, setRows] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDataFetched, setIsDataFetched] = useState(false);
  const [totalSPM, setTotalSPM] = useState(0);
  const [totalNilaiSPM, setTotalNilaiSPM] = useState(0);

  useEffect(() => {
    if (cek && selectedDate) {
      getData();
    }
  }, [cek, id, where, page, selectedDate]);

  const getData = async () => {
    setLoading(true);

    let combinedFilter = where || "";

    if (user?.role === "kanwil_djpb") {
      combinedFilter += combinedFilter
        ? ` AND a.kdkanwil = '${user.kdkanwil}'`
        : `a.kdkanwil = '${user.kdkanwil}'`;
    } else if (user?.role === "kppn") {
      combinedFilter += combinedFilter
        ? ` AND a.kdkppn = '${user.kdkppn}'`
        : `a.kdkppn = '${user.kdkppn}'`;
    }

    if (selectedDate) {
      const formattedDate = moment(selectedDate).format("YYYY-MM-DD");
      combinedFilter += combinedFilter
        ? ` AND a.tgpersetujuan = '${formattedDate}'`
        : `a.tgpersetujuan = '${formattedDate}'`;
    }

    const encodedQuery = encodeURIComponent(combinedFilter);

    const cleanedQuery = decodeURIComponent(encodedQuery)
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const encryptedQuery = btoa(cleanedQuery);

    try {
      // API endpoint: POST /api/v1/dispensasi/query with JSON body
      const apiUrl = `${
        process.env.NEXT_PUBLIC_API_URL || "/api/v1"
      }/dispensasi/query`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: encryptedQuery,
          limit,
          page,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setData(result.result || []);
      setPages(result.totalPages || 0);
      setRows(result.totalRows || 0);
      setTotalSPM(result.totalSPM || 0);
      setTotalNilaiSPM(result.totalNilaiSPM || 0);
      setLoading(false);
      setIsDataFetched(true);
    } catch (error) {
      console.error("Data fetch error:", error);
      toast.error("Terjadi Permasalahan Koneksi atau Server Backend");
      setLoading(false);
    }
  };

  const handleFilterByDate = (date: Date | null) => {
    setSelectedDate(date);
    setIsDataFetched(false);
  };

  const handlePageChange = ({ selected }: { selected: number }) => {
    setPage(selected);
  };

  return (
    <Card className="p-3 mt-3" bg="light" style={{ minHeight: "700px" }}>
      {/* Filter Tanggal */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <Form>
          <Form.Group controlId="tanggalPersetujuan">
            <Form.Label className="fw-bold">Tanggal Persetujuan</Form.Label>
            <div className="d-flex align-items-center">
              <DatePicker
                name="tanggalPersetujuan"
                selected={selectedDate}
                onChange={(date) => handleFilterByDate(date)}
                dateFormat="dd/MM/yyyy"
                placeholderText="Pilih Tanggal"
                autoComplete="off"
                className="form-control"
              />
              <i
                className="bi bi-calendar-date text-success fw-bold ms-2"
                style={{
                  fontSize: "25px",
                  color: "#6c757d",
                }}
              />
            </div>
          </Form.Group>
        </Form>
      </div>

      {/* Konten Utama: Loading atau Table */}
      {loading ? (
        <div className="text-center">
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>{" "}
          <br />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      ) : (
        <div className="fade-in">
          {isDataFetched ? (
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th style={{ fontSize: "14px" }}>No.</th>
                  <th style={{ fontSize: "14px" }}>Kementerian/Lembaga</th>
                  <th style={{ fontSize: "14px" }}>Jumlah SPM</th>
                  <th style={{ fontSize: "14px" }}>Nilai Dispensasi</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, index) => (
                  <tr key={index}>
                    <td>{index + 1 + page * limit}</td>
                    <td>
                      {row.nmdept} ({row.kddept})
                    </td>
                    <td className="text-end">
                      {row.jumlah_spm.toLocaleString()}
                    </td>
                    <td className="text-end">
                      {row.nilai_spm.toLocaleString()}
                    </td>
                  </tr>
                ))}
                {/* Total SPM dan Nilai SPM */}
                <tr>
                  <td
                    colSpan={2}
                    className="fw-bold text-end"
                    style={{ fontSize: "14px" }}
                  >
                    Total
                  </td>
                  <td className="fw-bold text-end" style={{ fontSize: "14px" }}>
                    {totalSPM.toLocaleString()}
                  </td>
                  <td className="fw-bold text-end" style={{ fontSize: "14px" }}>
                    {totalNilaiSPM.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </Table>
          ) : (
            <div className="text-center">
              <p className="text-muted">Tidak ada data yang tersedia.</p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
