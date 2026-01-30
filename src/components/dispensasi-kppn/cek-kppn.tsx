"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { apiClient } from "@/lib/api/httpClient";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

    try {
      const result = await apiClient.get(
        `/dispensasi/${encryptedQuery}?limit=999999&page=0`
      );

      setData(result.result);
      setLoading(false);
    } catch (error) {
      toast.error("Terjadi Permasalahan Koneksi atau Server Backend");
      setLoading(false);
    }
  };

  return (
    <Select value={value} onValueChange={onChange} disabled={loading}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="-- Pilih KPPN --" />
      </SelectTrigger>
      <SelectContent>
        {data.map((dau, index) => (
          <SelectItem key={index} value={dau.kdkppn}>
            {dau.kdkppn} - {dau.nmkppn}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default CekKppn;
