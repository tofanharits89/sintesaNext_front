"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  XCircle
} from "lucide-react";

interface SatkerData {
  kdsatker: string;
  nmsatker: string;
}

interface SatkerProfileTabProps {
  satkerData: SatkerData;
}

export function SatkerProfileTab({ satkerData }: SatkerProfileTabProps) {
  // Mock data for demonstration - in real app, this would come from API
  const profileData = {
    namaSatker: satkerData.nmsatker,
    emailSatker: `${satkerData.kdsatker}@kemenkeu.go.id`,
    kementerian: "Kementerian Keuangan",
    unitEselonI: "Direktorat Jenderal Perbendaharaan",
    kewenangan: "Dekonsentrasi",
    kanwilDJPb: "Kanwil DJPb Provinsi DKI Jakarta",
    kppn: "KPPN Jakarta I",
    tahunAnggaran: "2025",
    kuasaPenggunaAnggaran: "Dr. John Doe, S.E., M.M.",
    bendahara: "Jane Smith, S.Ak.",
    ppspm: "Robert Johnson, S.E.",
    npwp: "00.000.000.0-000.000",
    statusBLU: false,
    jenisDokumen: "DIPA"
  };

  const InfoItem = ({ 
    icon: Icon, 
    label, 
    value, 
    type = "text" 
  }: { 
    icon: any; 
    label: string; 
    value: string | boolean; 
    type?: "text" | "email" | "boolean";
  }) => (
    <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
      <Icon className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-muted-foreground mb-1">{label}</p>
        {type === "email" ? (
          <a 
            href={`mailto:${value}`} 
            className="text-sm font-medium text-blue-600 hover:text-blue-800 break-all"
          >
            {value as string}
          </a>
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
          <p className="text-sm font-medium break-words">{value as string}</p>
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
            value={profileData.emailSatker}
            type="email"
          />
          <InfoItem
            icon={Landmark}
            label="Kementerian"
            value={profileData.kementerian}
          />
          <InfoItem
            icon={Users}
            label="Unit Eselon I"
            value={profileData.unitEselonI}
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
            value={profileData.kewenangan}
          />
          <InfoItem
            icon={MapPin}
            label="Kanwil DJPb"
            value={profileData.kanwilDJPb}
          />
          <InfoItem
            icon={Landmark}
            label="KPPN"
            value={profileData.kppn}
          />
          <InfoItem
            icon={Calendar}
            label="Tahun Anggaran"
            value={profileData.tahunAnggaran}
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
            value={profileData.kuasaPenggunaAnggaran}
          />
          <InfoItem
            icon={User}
            label="Bendahara"
            value={profileData.bendahara}
          />
          <InfoItem
            icon={User}
            label="PPSPM"
            value={profileData.ppspm}
          />
          <InfoItem
            icon={CreditCard}
            label="NPWP"
            value={profileData.npwp}
          />
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
            value={profileData.jenisDokumen}
          />
        </CardContent>
      </Card>
    </div>
  );
}