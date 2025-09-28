"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Building2,
  Mail,
  MapPin,
  Users,
  Shield,
  Landmark,
  CreditCard,
  Calendar,
  User,
  FileText,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { CarisatkerData, SatkerProfileData } from "@/types/satker";
import { useSatkerData } from "@/hooks/use-satker-data";

interface SatkerProfileTabProps {
  kdsatker: string;
}

export function SatkerProfileTab({ kdsatker }: SatkerProfileTabProps) {
  const { data: satkerData, loading, error } = useSatkerData(kdsatker);

  // Transform carisatker data to profile data format
  const getProfileData = (
    data: CarisatkerData | null
  ): SatkerProfileData | null => {
    if (!data) return null;

    return {
      namaSatker: data.nmsatker,
      emailSatker: data.email || `${data.kdsatker}@kemenkeu.go.id`,
      kementerian: data.nmdept || `${data.kddept || ""} - Kementerian Keuangan`,
      unitEselonI: data.nmunit || `${data.kdunit || ""} - Unit Eselon I`,
      kewenangan: data.nmdekon || `${data.kddekon || ""} - Kewenangan`,
      kanwilDJPb: data.nmkanwil || `${data.kdkanwil} - Kanwil DJPb`,
      kppn: data.nmkppn || `${data.kdkppn} - KPPN`,
      tahunAnggaran: data.thang || "2025",
      kuasaPenggunaAnggaran: data.kpa || "-",
      bendahara: data.bendahara || "-",
      ppspm: data.ppspm || "-",
      npwp: data.npwp || "-",
      statusBLU:
        typeof data.statusblu === "boolean"
          ? data.statusblu
          : data.statusblu === "1" || data.statusblu === "true",
      jenisDokumen: data.kdjendok || "DIPA",
    };
  };

  const profileData = getProfileData(satkerData);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <XCircle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Gagal Memuat Data</h3>
          <p className="text-muted-foreground text-center">
            {error || "Tidak dapat memuat data profil satker."}
          </p>
        </CardContent>
      </Card>
    );
  }

  const InfoItem = ({
    icon: Icon,
    label,
    value,
    type = "text",
  }: {
    icon: any;
    label: string;
    value?: string | boolean;
    type?: "text" | "email" | "boolean";
  }) => (
    <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
      <Icon className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-muted-foreground mb-1">
          {label}
        </p>
        {type === "email" ? (
          typeof value === "string" && value.length > 0 ? (
            <a
              href={`mailto:${value}`}
              className="text-sm font-medium text-blue-600 hover:text-blue-800 break-all"
            >
              {value}
            </a>
          ) : (
            <p className="text-sm font-medium text-muted-foreground">-</p>
          )
        ) : type === "boolean" ? (
          <div className="flex items-center gap-2">
            {value ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-600">Ya</span>
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-600">Tidak</span>
              </>
            )}
          </div>
        ) : (
          <p className="text-sm font-medium break-words">
            {typeof value === "string" && value.length > 0 ? value : "-"}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Informasi Dasar
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <InfoItem
            icon={Building2}
            label="Nama Satker"
            value={profileData.namaSatker}
          />
          <InfoItem
            icon={Mail}
            label="Email Satker"
            value={profileData.emailSatker ?? ""}
            type="email"
          />
          <InfoItem
            icon={Landmark}
            label="Kementerian"
            value={profileData.kementerian ?? ""}
          />
          <InfoItem
            icon={Users}
            label="Unit Eselon I"
            value={profileData.unitEselonI ?? ""}
          />
        </CardContent>
      </Card>

      {/* Administrative Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Informasi Administratif
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <InfoItem
            icon={Shield}
            label="Kewenangan"
            value={profileData.kewenangan ?? ""}
          />
          <InfoItem
            icon={MapPin}
            label="Kanwil DJPb"
            value={profileData.kanwilDJPb ?? ""}
          />
          <InfoItem icon={Landmark} label="KPPN" value={profileData.kppn ?? ""} />
          <InfoItem
            icon={Calendar}
            label="Tahun Anggaran"
            value={profileData.tahunAnggaran ?? ""}
          />
        </CardContent>
      </Card>

      {/* Personnel Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informasi Personel
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <InfoItem
            icon={User}
            label="Kuasa Pengguna Anggaran"
            value={profileData.kuasaPenggunaAnggaran ?? ""}
          />
          <InfoItem
            icon={User}
            label="Bendahara"
            value={profileData.bendahara ?? ""}
          />
          <InfoItem icon={User} label="PPSPM" value={profileData.ppspm ?? ""} />
          <InfoItem icon={CreditCard} label="NPWP" value={profileData.npwp ?? ""} />
        </CardContent>
      </Card>

      {/* Status Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Status & Dokumen
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <InfoItem
            icon={CheckCircle}
            label="Status BLU"
            value={profileData.statusBLU}
            type="boolean"
          />
          <InfoItem
            icon={FileText}
            label="Jenis Dokumen"
            value={profileData.jenisDokumen ?? ""}
          />
        </CardContent>
      </Card>
    </div>
  );
}
