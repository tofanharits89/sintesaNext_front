"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface CekKppnProps {
  value: string;
  className?: string;
  onChange: (value: string) => void;
}

interface KppnData {
  nmkppn: string;
  kdkppn: string;
}

const CekKppn: React.FC<CekKppnProps> = ({ value, className, onChange }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<KppnData[]>([]);

  useEffect(() => {
    getData();
  }, []);

  const getData = async () => {
    setLoading(true);
    let filterKppn =
      user?.role === "kppn" ? `WHERE kdkppn = '${user.kdkppn}'` : "";
    const query = `SELECT a.nmkppn, a.kdkppn FROM dbref.t_kppn_2025 a ${filterKppn} ORDER BY a.kdkppn`;
    const encryptedQuery = btoa(query);
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

    try {
      const response = await fetch(
        `${baseUrl}/dispensasi/${encryptedQuery}?limit=999999&page=0`,
        {
          headers: {
            // Authorization: `Bearer ${user?.token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setData(result.result);
      setLoading(false);
    } catch (error) {
      toast.error("Terjadi Permasalahan Koneksi atau Server Backend");
      setLoading(false);
    }
  };

  return (
    <select
      value={value}
      className={className}
      onChange={(e) => onChange(e.target.value)}
      disabled={loading}
    >
      <option value="">-- Pilih KPPN --</option>
      {data.map((dau, index) => (
        <option key={index} value={dau.kdkppn}>
          {dau.kdkppn} - {dau.nmkppn}
        </option>
      ))}
    </select>
  );
};

export default CekKppn;
